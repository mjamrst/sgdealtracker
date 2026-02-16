import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, TrendingUp, Clock, CalendarCheck } from "lucide-react";

const stageLabels: Record<string, string> = {
  new_lead: "New Lead",
  in_conversation: "In Conversation",
  proposal_negotiation: "Proposal/Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const stageColors: Record<string, string> = {
  new_lead: "bg-gray-100 text-gray-700",
  in_conversation: "bg-blue-100 text-blue-700",
  proposal_negotiation: "bg-purple-100 text-purple-700",
  closed_won: "bg-green-100 text-green-700",
  closed_lost: "bg-red-100 text-red-700",
};

const stageBarColors: Record<string, string> = {
  new_lead: "bg-gray-400",
  in_conversation: "bg-blue-500",
  proposal_negotiation: "bg-purple-500",
  closed_won: "bg-green-500",
  closed_lost: "bg-red-400",
};

const stageDotColors: Record<string, string> = {
  new_lead: "bg-gray-400",
  in_conversation: "bg-blue-500",
  proposal_negotiation: "bg-purple-500",
  closed_won: "bg-green-500",
  closed_lost: "bg-red-400",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's profile by ID
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user?.id || "")
    .single();

  const profile = profileData as { id: string; role: string } | null;

  // Get current startup from cookie
  const currentStartupId = cookieStore.get("current_startup_id")?.value;

  // Verify user has access to this startup
  let hasAccess = false;
  if (currentStartupId) {
    if (profile?.role === "admin") {
      hasAccess = true;
    } else if (profile) {
      const { data: membership } = await supabase
        .from("startup_members")
        .select("id")
        .eq("user_id", profile.id)
        .eq("startup_id", currentStartupId)
        .single();
      hasAccess = !!membership;
    }
  }

  // If no valid startup selected, show empty state
  const startupId = hasAccess ? currentStartupId : null;

  // Get prospects stats for current startup only
  let prospects: { id: string; stage: string; estimated_value: number | null }[] = [];
  if (startupId) {
    const { data: prospectsData } = await supabase
      .from("prospects")
      .select("id, stage, estimated_value")
      .eq("startup_id", startupId);
    prospects = (prospectsData as typeof prospects) || [];
  }

  const totalProspects = prospects.length;
  const totalPipelineValue = prospects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  const wonDeals = prospects.filter(p => p.stage === "closed_won").length;

  // Group by stage
  const prospectsByStage = prospects.reduce((acc, p) => {
    acc[p.stage] = (acc[p.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get recent activity for current startup
  let activities: { id: string; description: string; created_at: string; action_type: string }[] = [];
  if (startupId) {
    const { data: activitiesData } = await supabase
      .from("activity_log")
      .select("id, description, created_at, action_type")
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false })
      .limit(10);
    activities = (activitiesData as typeof activities) || [];
  }

  // Get prospects with upcoming meetings for current startup
  const today = new Date().toISOString().split("T")[0];
  let upcomingMeetings: { id: string; company_name: string; contact_name: string | null; meeting_date: string | null }[] = [];
  if (startupId) {
    const { data: upcomingMeetingsData } = await supabase
      .from("prospects")
      .select("id, company_name, contact_name, meeting_date")
      .eq("startup_id", startupId)
      .gte("meeting_date", today)
      .not("meeting_date", "is", null)
      .order("meeting_date", { ascending: true });
    upcomingMeetings = (upcomingMeetingsData as typeof upcomingMeetings) || [];
  }

  // Count meetings scheduled in the current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const currentMonthName = now.toLocaleDateString("en-US", { month: "long" });
  const MONTHLY_MEETING_GOAL = 10;
  let monthlyMeetingCount = 0;
  if (startupId) {
    const { count } = await supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .eq("startup_id", startupId)
      .gte("meeting_date", monthStart)
      .lte("meeting_date", monthEnd)
      .not("meeting_date", "is", null);
    monthlyMeetingCount = count || 0;
  }
  const meetingProgress = Math.min((monthlyMeetingCount / MONTHLY_MEETING_GOAL) * 100, 100);
  const meetingGoalMet = monthlyMeetingCount >= MONTHLY_MEETING_GOAL;

  // Get prospects with upcoming next steps/actions for current startup
  let nextSteps: { id: string; company_name: string; next_action: string | null; next_action_due: string | null }[] = [];
  if (startupId) {
    const { data: nextStepsData } = await supabase
      .from("prospects")
      .select("id, company_name, next_action, next_action_due")
      .eq("startup_id", startupId)
      .gte("next_action_due", today)
      .not("next_action", "is", null)
      .order("next_action_due", { ascending: true });
    nextSteps = (nextStepsData as typeof nextSteps) || [];
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your sales pipeline</p>
        </div>
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${meetingGoalMet ? "border-green-200 bg-green-50" : "border-border bg-muted/50"}`}>
          <CalendarCheck className={`h-5 w-5 shrink-0 ${meetingGoalMet ? "text-green-600" : "text-muted-foreground"}`} />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{currentMonthName} Meetings</span>
              <span className={`font-bold ${meetingGoalMet ? "text-green-600" : ""}`}>
                {monthlyMeetingCount}/{MONTHLY_MEETING_GOAL}
              </span>
            </div>
            <div className="h-1.5 w-36 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${meetingGoalMet ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${meetingProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Prospects
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProspects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totalPipelineValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Won Deals
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{wonDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Meetings
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingMeetings?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Distribution of prospects across stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stageLabels).map(([stage, label]) => {
                const count = prospectsByStage[stage] || 0;
                const percentage = totalProspects > 0 ? (count / totalProspects) * 100 : 0;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${stageDotColors[stage]}`} />
                    <div className="w-28 text-sm text-muted-foreground truncate">
                      {label}
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${stageBarColors[stage]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-sm text-right font-medium">{count}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Scheduled meetings with prospects</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">{meeting.company_name}</p>
                      {meeting.contact_name && (
                        <p className="text-muted-foreground text-xs">{meeting.contact_name}</p>
                      )}
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {new Date(meeting.meeting_date!).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming meetings scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Upcoming actions for your prospects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{step.company_name}</p>
                    <p className="text-sm text-muted-foreground">{step.next_action}</p>
                  </div>
                  <Badge variant="secondary">
                    {new Date(step.next_action_due!).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
