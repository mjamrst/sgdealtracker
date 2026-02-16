"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Sparkles, GripVertical, CalendarCheck } from "lucide-react";
import type { Prospect, ProspectStage } from "@/lib/types/database";

function hasUpcomingMeeting(meetingDate: string | null): boolean {
  if (!meetingDate) return false;
  return meetingDate >= new Date().toISOString().split("T")[0];
}

// Board column configuration
const boardColumns = [
  {
    id: "new_lead",
    title: "New Lead",
    description: "Identified as a potential prospect; no outreach yet.",
    stages: ["new_lead"] as ProspectStage[],
    color: "bg-gray-100 border-gray-300",
    headerColor: "bg-gray-200",
  },
  {
    id: "contacted",
    title: "Contacted",
    description: "Initial outreach sent; awaiting a response.",
    stages: ["contacted"] as ProspectStage[],
    color: "bg-teal-100 border-teal-300",
    headerColor: "bg-teal-200",
  },
  {
    id: "in_conversation",
    title: "In Conversation",
    description: "Actively engaged in dialogue about opportunities.",
    stages: ["in_conversation"] as ProspectStage[],
    color: "bg-blue-100 border-blue-300",
    headerColor: "bg-blue-200",
  },
  {
    id: "proposal_negotiation",
    title: "Proposal/Negotiation",
    description: "Proposal delivered; working through terms and details.",
    stages: ["proposal_negotiation"] as ProspectStage[],
    color: "bg-purple-100 border-purple-300",
    headerColor: "bg-purple-200",
  },
  {
    id: "closed_won",
    title: "Closed Won",
    description: "Deal signed and partnership confirmed.",
    stages: ["closed_won"] as ProspectStage[],
    color: "bg-green-100 border-green-300",
    headerColor: "bg-green-200",
  },
];

interface ProspectsBoardProps {
  prospects: (Prospect & { startup: { name: string } | null; owner: { id: string; full_name: string | null } | null })[];
  onStageChange: (prospectId: string, newStage: ProspectStage) => void;
  isAdmin: boolean;
}

export function ProspectsBoard({ prospects, onStageChange, isAdmin }: ProspectsBoardProps) {
  const [draggedProspect, setDraggedProspect] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ProspectStage | null>(null);

  const getProspectsForStage = (stage: ProspectStage) => {
    return prospects.filter((p) => p.stage === stage);
  };



  const handleDragStart = (e: React.DragEvent, prospectId: string) => {
    setDraggedProspect(prospectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: ProspectStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: ProspectStage) => {
    e.preventDefault();
    if (draggedProspect) {
      const prospect = prospects.find((p) => p.id === draggedProspect);
      if (prospect && prospect.stage !== stage) {
        onStageChange(draggedProspect, stage);
      }
    }
    setDraggedProspect(null);
    setDragOverStage(null);
  };

  const ProspectCard = ({ prospect }: { prospect: typeof prospects[0] }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, prospect.id)}
      className={`bg-white rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        draggedProspect === prospect.id ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <Link
            href={`/prospects/${prospect.id}`}
            className="font-medium text-sm hover:text-primary block truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {prospect.company_name}
          </Link>
          {prospect.contact_name && (
            <p className="text-xs text-muted-foreground truncate">{prospect.contact_name}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {prospect.source === "ai_generated" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
            {hasUpcomingMeeting(prospect.meeting_date) && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700"
                title={`Meeting: ${new Date(prospect.meeting_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
              >
                <CalendarCheck className="h-2.5 w-2.5" />
                Mtg
              </span>
            )}
            {prospect.estimated_value && (
              <span className="text-[10px] font-medium text-muted-foreground">
                ${prospect.estimated_value.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DropZone = ({ stage, children, className = "" }: { stage: ProspectStage; children: React.ReactNode; className?: string }) => (
    <div
      onDragOver={(e) => handleDragOver(e, stage)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, stage)}
      className={`min-h-[100px] rounded-lg p-2 transition-colors ${
        dragOverStage === stage ? "bg-primary/10 ring-2 ring-primary/30" : ""
      } ${className}`}
    >
      {children}
    </div>
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {boardColumns.map((column) => (
          <div
            key={column.id}
            className={`w-[280px] rounded-xl border-2 ${column.color} flex flex-col`}
          >
            {/* Column Header */}
            <div className={`px-3 py-2 ${column.headerColor} rounded-t-lg border-b`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <span className="text-xs text-muted-foreground bg-white/50 px-2 py-0.5 rounded-full">
                  {getProspectsForStage(column.stages[0]).length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{column.description}</p>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-2">
              <DropZone stage={column.stages[0]} className="space-y-2">
                {getProspectsForStage(column.stages[0]).map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} />
                ))}
                {getProspectsForStage(column.stages[0]).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No prospects
                  </p>
                )}
              </DropZone>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
