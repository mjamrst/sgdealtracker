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
import { Plus, Search, Filter, X, ChevronRight, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Prospect, ProspectStage, ProspectFunction, ProspectSource } from "@/lib/types/database";

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
  new: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  intro_made: "bg-slate-200 text-slate-800 hover:bg-slate-300",
  responded_yes: "bg-blue-200 text-blue-800 hover:bg-blue-300",
  responded_no: "bg-orange-200 text-orange-800 hover:bg-orange-300",
  meeting_scheduled: "bg-purple-200 text-purple-800 hover:bg-purple-300",
  demo_completed_yes: "bg-cyan-200 text-cyan-800 hover:bg-cyan-300",
  demo_completed_no: "bg-amber-200 text-amber-800 hover:bg-amber-300",
  proposal_sent: "bg-indigo-200 text-indigo-800 hover:bg-indigo-300",
  closed_won: "bg-green-200 text-green-800 hover:bg-green-300",
  closed_lost: "bg-red-200 text-red-800 hover:bg-red-300",
};

const stageBadgeColors: Record<ProspectStage, string> = {
  new: "bg-gray-200 text-gray-800",
  intro_made: "bg-slate-200 text-slate-800",
  responded_yes: "bg-blue-200 text-blue-800",
  responded_no: "bg-orange-200 text-orange-800",
  meeting_scheduled: "bg-purple-200 text-purple-800",
  demo_completed_yes: "bg-cyan-200 text-cyan-800",
  demo_completed_no: "bg-amber-200 text-amber-800",
  proposal_sent: "bg-indigo-200 text-indigo-800",
  closed_won: "bg-green-200 text-green-800",
  closed_lost: "bg-red-200 text-red-800",
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

interface ProspectsListProps {
  initialProspects: (Prospect & { startup: { name: string } | null; owner: { id: string; full_name: string | null } | null })[];
  startups: { id: string; name: string }[];
  users: { id: string; full_name: string | null; email: string }[];
  isAdmin: boolean;
}

export function ProspectsList({ initialProspects, startups, users, isAdmin }: ProspectsListProps) {
  const [prospects, setProspects] = useState(initialProspects);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [functionFilter, setFunctionFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
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
    owner_id: "",
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
    const matchesIndustry = industryFilter === "all" || prospect.industry === industryFilter;
    return matchesSearch && matchesStage && matchesFunction && matchesIndustry;
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

  const handleFunctionChange = async (prospectId: string, newFunction: ProspectFunction) => {
    const { error } = await supabase
      .from("prospects")
      .update({ function: newFunction })
      .eq("id", prospectId);

    if (error) {
      toast.error("Failed to update function");
      return;
    }

    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, function: newFunction } : p))
    );
    toast.success("Function updated");
  };

  const handleIndustryChange = async (prospectId: string, newIndustry: string) => {
    const { error } = await supabase
      .from("prospects")
      .update({ industry: newIndustry })
      .eq("id", prospectId);

    if (error) {
      toast.error("Failed to update industry");
      return;
    }

    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, industry: newIndustry } : p))
    );
    toast.success("Industry updated");
  };

  const handleOwnerChange = async (prospectId: string, newOwnerId: string | null) => {
    const { error } = await supabase
      .from("prospects")
      .update({ owner_id: newOwnerId })
      .eq("id", prospectId);

    if (error) {
      toast.error("Failed to update owner");
      return;
    }

    const newOwner = newOwnerId ? users.find(u => u.id === newOwnerId) : null;
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, owner_id: newOwnerId, owner: newOwner ? { id: newOwner.id, full_name: newOwner.full_name } : null } : p))
    );
    toast.success("Owner updated");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProspects.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (prospectId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(prospectId);
    } else {
      newSelected.delete(prospectId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStageChange = async (newStage: ProspectStage) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);

    const { error } = await supabase
      .from("prospects")
      .update({ stage: newStage })
      .in("id", Array.from(selectedIds));

    if (error) {
      toast.error("Failed to update prospects");
      setBulkUpdating(false);
      return;
    }

    setProspects((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, stage: newStage } : p))
    );
    toast.success(`Updated ${selectedIds.size} prospect${selectedIds.size > 1 ? "s" : ""}`);
    setSelectedIds(new Set());
    setBulkUpdating(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
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
        owner_id: newProspect.owner_id || null,
        source: "manual",
      })
      .select("*, startup:startups(name), owner:profiles!prospects_owner_id_fkey(id, full_name)")
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
      owner_id: "",
    });
    toast.success("Prospect created");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Prospects</h1>
          <p className="text-sm text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Prospect
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Prospect</DialogTitle>
              <DialogDescription>
                Enter the details for the new prospect
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProspect} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {startups.length > 1 && (
                  <div className="sm:col-span-2 space-y-2">
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
                  <Select
                    value={newProspect.industry}
                    onValueChange={(value) =>
                      setNewProspect((prev) => ({ ...prev, industry: value }))
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
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Select
                    value={newProspect.owner_id}
                    onValueChange={(value) =>
                      setNewProspect((prev) => ({ ...prev, owner_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-2">
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
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Prospect</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search prospects..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="h-4 w-4 mr-2 shrink-0" />
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
          <SelectTrigger className="w-[calc(50%-4px)] sm:w-[140px]">
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
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-[calc(50%-4px)] sm:w-[180px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-muted-foreground hidden sm:inline">Change stage to:</span>
            <Select
              onValueChange={(value: ProspectStage) => handleBulkStageChange(value)}
              disabled={bulkUpdating}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stageLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredProspects.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 bg-card rounded-xl border">
            No prospects found
          </div>
        ) : (
          filteredProspects.map((prospect) => (
            <Link
              key={prospect.id}
              href={`/prospects/${prospect.id}`}
              className="block bg-card rounded-xl border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{prospect.company_name}</h3>
                  {prospect.contact_name && (
                    <p className="text-sm text-muted-foreground truncate">{prospect.contact_name}</p>
                  )}
                  {isAdmin && prospect.startup && (
                    <p className="text-xs text-muted-foreground">{prospect.startup.name}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageBadgeColors[prospect.stage]}`}>
                  {stageLabels[prospect.stage]}
                </span>
                {prospect.source === "ai_generated" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </span>
                )}
                {prospect.industry && (
                  <span className="text-xs text-muted-foreground">
                    {prospect.industry}
                  </span>
                )}
                {prospect.estimated_value && (
                  <span className="text-xs font-medium">
                    ${prospect.estimated_value.toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={filteredProspects.length > 0 && selectedIds.size === filteredProspects.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Industry</TableHead>
              <TableHead className="hidden lg:table-cell">Function</TableHead>
              <TableHead className="hidden xl:table-cell">Owner</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="hidden xl:table-cell">Next Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No prospects found
                </TableCell>
              </TableRow>
            ) : (
              filteredProspects.map((prospect) => (
                <TableRow key={prospect.id} className={selectedIds.has(prospect.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(prospect.id)}
                      onCheckedChange={(checked) => handleSelectOne(prospect.id, checked as boolean)}
                    />
                  </TableCell>
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
                  <TableCell className="hidden lg:table-cell">
                    <Select
                      value={prospect.industry || ""}
                      onValueChange={(value) => handleIndustryChange(prospect.id, value)}
                    >
                      <SelectTrigger className="w-[160px] border-0 bg-transparent hover:bg-muted">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Select
                      value={prospect.function}
                      onValueChange={(value: ProspectFunction) => handleFunctionChange(prospect.id, value)}
                    >
                      <SelectTrigger className="w-[120px] border-0 bg-secondary/50 hover:bg-secondary">
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
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {prospect.source === "ai_generated" ? (
                      <div className="flex items-center gap-1.5 text-purple-600">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">AI Generated</span>
                      </div>
                    ) : (
                      <Select
                        value={prospect.owner_id || "unassigned"}
                        onValueChange={(value) => handleOwnerChange(prospect.id, value === "unassigned" ? null : value)}
                      >
                        <SelectTrigger className="w-[130px] border-0 bg-transparent hover:bg-muted">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                      <SelectTrigger className={`w-[150px] border-0 ${stageColors[prospect.stage]}`}>
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
                  <TableCell className="hidden xl:table-cell">
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
