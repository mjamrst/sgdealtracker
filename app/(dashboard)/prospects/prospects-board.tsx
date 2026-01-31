"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Sparkles, GripVertical } from "lucide-react";
import type { Prospect, ProspectStage } from "@/lib/types/database";

// Board column configuration
const boardColumns = [
  {
    id: "new",
    title: "New",
    stages: ["new"] as ProspectStage[],
    color: "bg-gray-100 border-gray-300",
    headerColor: "bg-gray-200",
  },
  {
    id: "intro",
    title: "Intro Made",
    stages: ["intro_made"] as ProspectStage[],
    color: "bg-slate-100 border-slate-300",
    headerColor: "bg-slate-200",
  },
  {
    id: "response",
    title: "Response",
    stages: ["responded_yes", "responded_no"] as ProspectStage[],
    color: "bg-blue-50 border-blue-200",
    headerColor: "bg-blue-100",
    subSections: [
      { stage: "responded_yes" as ProspectStage, label: "Yes", color: "bg-blue-100 border-blue-300" },
      { stage: "responded_no" as ProspectStage, label: "No", color: "bg-orange-100 border-orange-300" },
    ],
  },
  {
    id: "meeting",
    title: "Meeting Scheduled",
    stages: ["meeting_scheduled"] as ProspectStage[],
    color: "bg-purple-100 border-purple-300",
    headerColor: "bg-purple-200",
  },
  {
    id: "demo",
    title: "Demo",
    stages: ["demo_completed_yes", "demo_completed_no"] as ProspectStage[],
    color: "bg-cyan-50 border-cyan-200",
    headerColor: "bg-cyan-100",
    subSections: [
      { stage: "demo_completed_yes" as ProspectStage, label: "Completed (Yes)", color: "bg-cyan-100 border-cyan-300" },
      { stage: "demo_completed_no" as ProspectStage, label: "Completed (No)", color: "bg-amber-100 border-amber-300" },
    ],
  },
  {
    id: "proposal",
    title: "Proposal Sent",
    stages: ["proposal_sent"] as ProspectStage[],
    color: "bg-indigo-100 border-indigo-300",
    headerColor: "bg-indigo-200",
  },
  {
    id: "closed",
    title: "Closed",
    stages: ["closed_won", "closed_lost"] as ProspectStage[],
    color: "bg-gray-50 border-gray-200",
    headerColor: "bg-gray-100",
    subSections: [
      { stage: "closed_won" as ProspectStage, label: "Won", color: "bg-green-100 border-green-300" },
      { stage: "closed_lost" as ProspectStage, label: "Lost", color: "bg-red-100 border-red-300" },
    ],
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

  const getProspectsForStages = (stages: ProspectStage[]) => {
    return prospects.filter((p) => stages.includes(p.stage));
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
                  {getProspectsForStages(column.stages).length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-2">
              {column.subSections ? (
                // Render subsections
                <div className="space-y-3">
                  {column.subSections.map((sub) => (
                    <div key={sub.stage} className={`rounded-lg border ${sub.color}`}>
                      <div className="px-2 py-1 border-b bg-white/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{sub.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {getProspectsForStage(sub.stage).length}
                          </span>
                        </div>
                      </div>
                      <DropZone stage={sub.stage} className="space-y-2">
                        {getProspectsForStage(sub.stage).map((prospect) => (
                          <ProspectCard key={prospect.id} prospect={prospect} />
                        ))}
                        {getProspectsForStage(sub.stage).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Drop here
                          </p>
                        )}
                      </DropZone>
                    </div>
                  ))}
                </div>
              ) : (
                // Render single stage column
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
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
