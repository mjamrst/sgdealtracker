"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, RotateCcw, Archive, ChevronRight } from "lucide-react";
import type { Prospect } from "@/lib/types/database";

interface DeadLeadsListProps {
  initialProspects: (Prospect & { startup: { name: string } | null; owner: { id: string; full_name: string | null } | null })[];
}

export function DeadLeadsList({ initialProspects }: DeadLeadsListProps) {
  const [prospects, setProspects] = useState(initialProspects);
  const [search, setSearch] = useState("");
  const [reviving, setReviving] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const filteredProspects = prospects.filter((prospect) => {
    return (
      prospect.company_name.toLowerCase().includes(search.toLowerCase()) ||
      prospect.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      prospect.industry?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleRevive = async (prospectId: string) => {
    setReviving(prospectId);
    const { error } = await supabase
      .from("prospects")
      .update({ stage: "new_lead" })
      .eq("id", prospectId);

    if (error) {
      toast.error("Failed to revive prospect");
      setReviving(null);
      return;
    }

    setProspects((prev) => prev.filter((p) => p.id !== prospectId));
    toast.success("Prospect moved back to New Lead");
    setReviving(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl md:text-2xl font-semibold">Dead Leads</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Prospects that were closed/lost. Revive them to move back to your active pipeline.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dead leads..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredProspects.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 bg-card rounded-xl border">
            No dead leads found
          </div>
        ) : (
          filteredProspects.map((prospect) => (
            <div
              key={prospect.id}
              className="bg-card rounded-xl border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/prospects/${prospect.id}`}
                  className="flex-1 min-w-0 hover:text-primary"
                >
                  <h3 className="font-medium truncate">{prospect.company_name}</h3>
                  {prospect.contact_name && (
                    <p className="text-sm text-muted-foreground truncate">{prospect.contact_name}</p>
                  )}
                </Link>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {prospect.industry && <span>{prospect.industry}</span>}
                  <span>
                    Lost {new Date(prospect.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevive(prospect.id)}
                  disabled={reviving === prospect.id}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Revive
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="rounded-xl border bg-card overflow-x-auto hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Date Lost</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No dead leads found
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
                    <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {prospect.notes || "-"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {new Date(prospect.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevive(prospect.id)}
                      disabled={reviving === prospect.id}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Revive
                    </Button>
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
