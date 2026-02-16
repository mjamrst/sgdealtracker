import { getAuth } from "@/lib/supabase/queries";
import { DeadLeadsList } from "./dead-leads-list";

export default async function DeadLeadsPage() {
  const { startupId, supabase } = await getAuth();

  let prospects: any[] = [];
  if (startupId) {
    const { data } = await supabase
      .from("prospects")
      .select("*, startup:startups(name), owner:profiles!prospects_owner_id_fkey(id, full_name)")
      .eq("startup_id", startupId)
      .eq("stage", "closed_lost")
      .order("updated_at", { ascending: false });
    prospects = data || [];
  }

  return <DeadLeadsList initialProspects={prospects} />;
}
