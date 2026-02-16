import { getAuth } from "@/lib/supabase/queries";
import { ProspectsList } from "./prospects-list";

export default async function ProspectsPage() {
  const { profile, startupId, supabase } = await getAuth();

  // Run independent queries in parallel
  let prospects: any[] = [];
  let startups: { id: string; name: string }[] = [];
  let users: { id: string; full_name: string | null; email: string }[] = [];

  if (startupId) {
    const [prospectsRes, startupsRes, membersRes, adminsRes] = await Promise.all([
      supabase
        .from("prospects")
        .select("*, startup:startups(name), owner:profiles!prospects_owner_id_fkey(id, full_name)")
        .eq("startup_id", startupId)
        .neq("stage", "closed_lost")
        .order("updated_at", { ascending: false }),
      supabase
        .from("startups")
        .select("id, name")
        .eq("id", startupId),
      supabase
        .from("startup_members")
        .select("user_id")
        .eq("startup_id", startupId),
      supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin"),
    ]);

    prospects = prospectsRes.data || [];
    startups = startupsRes.data || [];

    const memberIds = (membersRes.data || []).map((m) => m.user_id);
    const adminIds = (adminsRes.data || []).map((a) => a.id);
    const allIds = [...new Set([...memberIds, ...adminIds])];

    if (allIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", allIds)
        .order("full_name", { ascending: true });
      users = data || [];
    }
  }

  return (
    <ProspectsList
      initialProspects={prospects || []}
      startups={startups || []}
      users={users || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
