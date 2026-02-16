import { getAuth } from "@/lib/supabase/queries";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const { startupId, supabase } = await getAuth();

  let meetings: {
    id: string;
    company_name: string;
    contact_name: string | null;
    meeting_date: string;
    stage: string;
    estimated_value: number | null;
  }[] = [];

  if (startupId) {
    const { data } = await supabase
      .from("prospects")
      .select("id, company_name, contact_name, meeting_date, stage, estimated_value")
      .eq("startup_id", startupId)
      .neq("stage", "closed_lost")
      .not("meeting_date", "is", null)
      .order("meeting_date", { ascending: true });

    meetings = (data || []) as typeof meetings;
  }

  return <CalendarView meetings={meetings} />;
}
