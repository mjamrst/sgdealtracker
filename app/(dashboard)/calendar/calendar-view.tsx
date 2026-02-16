"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface Meeting {
  id: string;
  company_name: string;
  contact_name: string | null;
  meeting_date: string;
  stage: string;
  estimated_value: number | null;
}

const stagePillColors: Record<string, string> = {
  new_lead: "bg-gray-100 text-gray-700 border-gray-200",
  contacted: "bg-teal-100 text-teal-700 border-teal-200",
  in_conversation: "bg-blue-100 text-blue-700 border-blue-200",
  proposal_negotiation: "bg-purple-100 text-purple-700 border-purple-200",
  closed_won: "bg-green-100 text-green-700 border-green-200",
};

const stageDotColors: Record<string, string> = {
  new_lead: "bg-gray-400",
  contacted: "bg-teal-500",
  in_conversation: "bg-blue-500",
  proposal_negotiation: "bg-purple-500",
  closed_won: "bg-green-500",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarView({ meetings }: { meetings: Meeting[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    for (const m of meetings) {
      const dateKey = m.meeting_date.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(m);
    }
    return map;
  }, [meetings]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const calendarDays = useMemo(() => {
    const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // Next month leading days
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth, currentYear, daysInMonth, firstDay, prevMonthDays, totalCells]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const isViewingCurrentMonth =
    currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-muted-foreground">Meetings across your pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-36 text-center">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isViewingCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border overflow-hidden">
        {calendarDays.map((cell, idx) => {
          const dateStr = `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          const dayMeetings = meetingsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const MAX_VISIBLE = 2;

          return (
            <div
              key={idx}
              className={`min-h-[5rem] md:min-h-[6.5rem] p-1.5 md:p-2 bg-card ${
                !cell.isCurrentMonth ? "bg-muted/30" : ""
              }`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium leading-none ${
                    isToday
                      ? "flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground"
                      : cell.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {cell.day}
                </span>
              </div>

              {/* Meeting pills — desktop */}
              <div className="hidden md:flex flex-col gap-0.5">
                {dayMeetings.slice(0, MAX_VISIBLE).map((m) => (
                  <Link
                    key={m.id}
                    href={`/prospects/${m.id}`}
                    className={`block text-[11px] leading-tight px-1.5 py-0.5 rounded border truncate hover:opacity-80 transition-opacity ${
                      stagePillColors[m.stage] || stagePillColors.new_lead
                    }`}
                  >
                    {m.company_name}
                  </Link>
                ))}
                {dayMeetings.length > MAX_VISIBLE && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{dayMeetings.length - MAX_VISIBLE} more
                  </span>
                )}
              </div>

              {/* Meeting dots — mobile */}
              <div className="flex md:hidden flex-wrap gap-1 mt-0.5">
                {dayMeetings.slice(0, 4).map((m) => (
                  <Link
                    key={m.id}
                    href={`/prospects/${m.id}`}
                    className={`block h-2 w-2 rounded-full ${
                      stageDotColors[m.stage] || stageDotColors.new_lead
                    }`}
                  />
                ))}
                {dayMeetings.length > 4 && (
                  <span className="text-[9px] text-muted-foreground leading-none">
                    +{dayMeetings.length - 4}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.entries({
          new_lead: "New Lead",
          contacted: "Contacted",
          in_conversation: "In Conversation",
          proposal_negotiation: "Proposal/Negotiation",
          closed_won: "Closed Won",
        }).map(([stage, label]) => (
          <div key={stage} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${stageDotColors[stage]}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
