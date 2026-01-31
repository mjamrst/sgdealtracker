import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, TrendingUp, Clock } from "lucide-react";

const stageLabels: Record<string, string> = {
  new: "New",
  intro_made: "Intro Made",
  responded_yes: "Responded (Yes)",
  responded_no: "Responded (No)",
  meeting_scheduled: "Meeting Scheduled",
  demo_completed_yes: "Demo Completed (Yes)",
  demo_completed_no: "Demo Completed (No)",
  proposal_sent: "Proposal Sent",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const stageColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-700",
  intro_made: "bg-slate-100 text-slate-700",
  responded_yes: "bg-blue-100 text-blue-700",
  responded_no: "bg-orange-100 text-orange-700",
  meeting_scheduled: "bg-purple-100 text-purple-700",
  demo_completed_yes: "bg-cyan-100 text-cyan-700",
  demo_completed_no: "bg-amber-100 text-amber-700",
  proposal_sent: "bg-indigo-100 text-indigo-700",
  closed_won: "bg-green-100 text-green-700",
  closed_lost: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's profile by ID
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user?.id || "")
    .single();

  const profile = profileData as { id: string; role: string } | null;

  let startupIds: string[] = [];

  if (profile?.role === "admin") {
    const { data: allStartups } = await supabase
      .from("startups")
      .select("id");
    const startups = allStartups as { id: string }[] | null;
    startupIds = startups?.map(s => s.id) || [];
  } else if (profile) {
    const { data: memberships } = await supabase
      .from("startup_members")
      .select("startup_id")
      .eq("user_id", profile.id);
    const members = memberships as { startup_id: string }[] | null;
    startupIds = members?.map(m => m.startup_id) || [];
  }

  // Get prospects stats
  let prospects: { id: string; stage: string; estimated_value: number | null }[] = [];
  if (startupIds.length > 0) {
    const { data: prospectsData } = await supabase
      .from("prospects")
      .select("id, stage, estimated_value")
      .in("startup_id", startupIds);
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

  // Get recent activity
  let activities: { id: string; description: string; created_at: string; action_type: string }[] = [];
  if (startupIds.length > 0) {
    const { data: activitiesData } = await supabase
      .from("activity_log")
      .select("id, description, created_at, action_type")
      .in("startup_id", startupIds)
      .order("created_at", { ascending: false })
      .limit(10);
    activities = (activitiesData as typeof activities) || [];
  }

  // Get prospects with upcoming actions
  const today = new Date().toISOString().split("T")[0];
  let upcomingActions: { id: string; company_name: string; next_action: string | null; next_action_due: string | null }[] = [];
  if (startupIds.length > 0) {
    const { data: upcomingActionsData } = await supabase
      .from("prospects")
      .select("id, company_name, next_action, next_action_due")
      .in("startup_id", startupIds)
      .gte("next_action_due", today)
      .not("next_action", "is", null)
      .order("next_action_due", { ascending: true })
      .limit(5);
    upcomingActions = (upcomingActionsData as typeof upcomingActions) || [];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your sales pipeline</p>
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
              Upcoming Actions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingActions?.length || 0}</div>
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
                    <div className="w-32 text-sm text-muted-foreground truncate">
                      {label}
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">{activity.description}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {new Date(activity.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Actions */}
      {upcomingActions && upcomingActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Actions</CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingActions.map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{prospect.company_name}</p>
                    <p className="text-sm text-muted-foreground">{prospect.next_action}</p>
                  </div>
                  <Badge variant="secondary">
                    {new Date(prospect.next_action_due!).toLocaleDateString("en-US", {
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
