"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import type { Prospect, ProspectStage, ProspectFunction, ActivityLog, Profile } from "@/lib/types/database";

const stageLabels: Record<ProspectStage, string> = {
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

const stageColors: Record<ProspectStage, string> = {
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

const functionLabels: Record<ProspectFunction, string> = {
  marketing: "Marketing",
  insights: "Insights",
  partnerships: "Partnerships",
  other: "Other",
};

const industries = [
  "Advertising & Marketing",
  "Agency",
  "Alcohol & Spirits",
  "Apparel & Fashion",
  "Automotive",
  "Beauty & Cosmetics",
  "Consumer Electronics",
  "Consumer Packaged Goods (CPG)",
  "Entertainment & Media",
  "Financial Services",
  "Food & Beverage",
  "Gaming",
  "Healthcare & Pharma",
  "Hospitality & Travel",
  "Private Equity",
  "Quick Service Restaurant (QSR)",
  "Retail",
  "Sports & Fitness",
  "Technology",
  "Telecommunications",
  "Other",
];

interface ProspectDetailProps {
  prospect: Prospect & { startup: { id: string; name: string } | null };
  activities: (ActivityLog & { user: Pick<Profile, "full_name"> | null })[];
}

export function ProspectDetail({ prospect: initialProspect, activities }: ProspectDetailProps) {
  const [prospect, setProspect] = useState(initialProspect);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("prospects")
      .update({
        company_name: prospect.company_name,
        contact_name: prospect.contact_name,
        contact_email: prospect.contact_email,
        industry: prospect.industry,
        function: prospect.function,
        estimated_value: prospect.estimated_value,
        stage: prospect.stage,
        notes: prospect.notes,
        next_action: prospect.next_action,
        next_action_due: prospect.next_action_due,
      })
      .eq("id", prospect.id);

    if (error) {
      toast.error("Failed to save changes");
      setSaving(false);
      return;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      startup_id: prospect.startup_id,
      prospect_id: prospect.id,
      user_id: (await supabase.auth.getUser()).data.user?.id || "",
      action_type: "prospect_updated",
      description: `Updated ${prospect.company_name}`,
    });

    toast.success("Changes saved");
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);

    const { error } = await supabase
      .from("prospects")
      .delete()
      .eq("id", prospect.id);

    if (error) {
      toast.error("Failed to delete prospect");
      setDeleting(false);
      return;
    }

    toast.success("Prospect deleted");
    router.push("/prospects");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/prospects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{prospect.company_name}</h1>
            {prospect.startup && (
              <p className="text-muted-foreground">{prospect.startup.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Prospect</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {prospect.company_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prospect Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={prospect.company_name}
                    onChange={(e) =>
                      setProspect((prev) => ({ ...prev, company_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={prospect.industry || ""}
                    onValueChange={(value) =>
                      setProspect((prev) => ({ ...prev, industry: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={prospect.contact_name || ""}
                    onChange={(e) =>
                      setProspect((prev) => ({ ...prev, contact_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={prospect.contact_email || ""}
                    onChange={(e) =>
                      setProspect((prev) => ({ ...prev, contact_email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="function">Function</Label>
                  <Select
                    value={prospect.function}
                    onValueChange={(value: ProspectFunction) =>
                      setProspect((prev) => ({ ...prev, function: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(functionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    value={prospect.estimated_value || ""}
                    onChange={(e) =>
                      setProspect((prev) => ({
                        ...prev,
                        estimated_value: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={5}
                  value={prospect.notes || ""}
                  onChange={(e) =>
                    setProspect((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="next_action">Action</Label>
                  <Input
                    id="next_action"
                    value={prospect.next_action || ""}
                    onChange={(e) =>
                      setProspect((prev) => ({ ...prev, next_action: e.target.value }))
                    }
                    placeholder="e.g., Follow up email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_action_due">Due Date</Label>
                  <Input
                    id="next_action_due"
                    type="date"
                    value={prospect.next_action_due || ""}
                    onChange={(e) =>
                      setProspect((prev) => ({ ...prev, next_action_due: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={prospect.stage}
                onValueChange={(value: ProspectStage) =>
                  setProspect((prev) => ({ ...prev, stage: value }))
                }
              >
                <SelectTrigger className={stageColors[prospect.stage]}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent updates to this prospect</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.user?.full_name || "System"} &middot;{" "}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
