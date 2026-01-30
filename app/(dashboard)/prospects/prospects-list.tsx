"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Filter } from "lucide-react";
import type { Prospect, ProspectStage, ProspectFunction } from "@/lib/types/database";

const stageLabels: Record<ProspectStage, string> = {
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
  intro_made: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  responded_yes: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  responded_no: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  meeting_scheduled: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  demo_completed_yes: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
  demo_completed_no: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  proposal_sent: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  closed_won: "bg-green-100 text-green-700 hover:bg-green-200",
  closed_lost: "bg-red-100 text-red-700 hover:bg-red-200",
};

const functionLabels: Record<ProspectFunction, string> = {
  marketing: "Marketing",
  insights: "Insights",
  partnerships: "Partnerships",
  other: "Other",
};

interface ProspectsListProps {
  initialProspects: (Prospect & { startup: { name: string } | null })[];
  startups: { id: string; name: string }[];
  isAdmin: boolean;
}

export function ProspectsList({ initialProspects, startups, isAdmin }: ProspectsListProps) {
  const [prospects, setProspects] = useState(initialProspects);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [functionFilter, setFunctionFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProspect, setNewProspect] = useState({
    startup_id: startups[0]?.id || "",
    company_name: "",
    contact_name: "",
    contact_email: "",
    industry: "",
    function: "other" as ProspectFunction,
    estimated_value: "",
    notes: "",
    next_action: "",
    next_action_due: "",
  });
  const router = useRouter();
  const supabase = createClient();

  const filteredProspects = prospects.filter((prospect) => {
    const matchesSearch =
      prospect.company_name.toLowerCase().includes(search.toLowerCase()) ||
      prospect.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      prospect.industry?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "all" || prospect.stage === stageFilter;
    const matchesFunction = functionFilter === "all" || prospect.function === functionFilter;
    return matchesSearch && matchesStage && matchesFunction;
  });

  const handleStageChange = async (prospectId: string, newStage: ProspectStage) => {
    const { error } = await supabase
      .from("prospects")
      .update({ stage: newStage })
      .eq("id", prospectId);

    if (error) {
      toast.error("Failed to update stage");
      return;
    }

    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, stage: newStage } : p))
    );
    toast.success("Stage updated");
  };

  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("prospects")
      .insert({
        startup_id: newProspect.startup_id,
        company_name: newProspect.company_name,
        contact_name: newProspect.contact_name || null,
        contact_email: newProspect.contact_email || null,
        industry: newProspect.industry || null,
        function: newProspect.function,
        estimated_value: newProspect.estimated_value ? parseFloat(newProspect.estimated_value) : null,
        notes: newProspect.notes || null,
        next_action: newProspect.next_action || null,
        next_action_due: newProspect.next_action_due || null,
      })
      .select("*, startup:startups(name)")
      .single();

    if (error) {
      toast.error("Failed to create prospect");
      return;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      startup_id: newProspect.startup_id,
      prospect_id: data.id,
      user_id: (await supabase.auth.getUser()).data.user?.id || "",
      action_type: "prospect_created",
      description: `Created prospect ${newProspect.company_name}`,
    });

    setProspects((prev) => [data, ...prev]);
    setIsDialogOpen(false);
    setNewProspect({
      startup_id: startups[0]?.id || "",
      company_name: "",
      contact_name: "",
      contact_email: "",
      industry: "",
      function: "other",
      estimated_value: "",
      notes: "",
      next_action: "",
      next_action_due: "",
    });
    toast.success("Prospect created");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prospects</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Prospect
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Prospect</DialogTitle>
              <DialogDescription>
                Enter the details for the new prospect
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProspect} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {startups.length > 1 && (
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="startup">Startup</Label>
                    <Select
                      value={newProspect.startup_id}
                      onValueChange={(value) =>
                        setNewProspect((prev) => ({ ...prev, startup_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select startup" />
                      </SelectTrigger>
                      <SelectContent>
                        {startups.map((startup) => (
                          <SelectItem key={startup.id} value={startup.id}>
                            {startup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={newProspect.company_name}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, company_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={newProspect.contact_name}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, contact_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newProspect.contact_email}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, contact_email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={newProspect.industry}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, industry: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="function">Function</Label>
                  <Select
                    value={newProspect.function}
                    onValueChange={(value: ProspectFunction) =>
                      setNewProspect((prev) => ({ ...prev, function: value }))
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
                    value={newProspect.estimated_value}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, estimated_value: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_action">Next Action</Label>
                  <Input
                    id="next_action"
                    value={newProspect.next_action}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, next_action: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_action_due">Due Date</Label>
                  <Input
                    id="next_action_due"
                    type="date"
                    value={newProspect.next_action_due}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, next_action_due: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={newProspect.notes}
                    onChange={(e) =>
                      setNewProspect((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Prospect</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prospects..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(stageLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={functionFilter} onValueChange={setFunctionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Function" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Functions</SelectItem>
            {Object.entries(functionLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No prospects found
                </TableCell>
              </TableRow>
            ) : (
              filteredProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell>
                    <Link
                      href={`/prospects/${prospect.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {prospect.company_name}
                    </Link>
                    {isAdmin && prospect.startup && (
                      <p className="text-xs text-muted-foreground">{prospect.startup.name}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{prospect.contact_name || "-"}</p>
                      {prospect.contact_email && (
                        <p className="text-xs text-muted-foreground">{prospect.contact_email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{prospect.industry || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{functionLabels[prospect.function]}</Badge>
                  </TableCell>
                  <TableCell>
                    {prospect.estimated_value
                      ? `$${prospect.estimated_value.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={prospect.stage}
                      onValueChange={(value: ProspectStage) =>
                        handleStageChange(prospect.id, value)
                      }
                    >
                      <SelectTrigger className={`w-[160px] border-0 ${stageColors[prospect.stage]}`}>
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
                  </TableCell>
                  <TableCell>
                    {prospect.next_action ? (
                      <div>
                        <p className="text-sm">{prospect.next_action}</p>
                        {prospect.next_action_due && (
                          <p className="text-xs text-muted-foreground">
                            Due{" "}
                            {new Date(prospect.next_action_due).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
