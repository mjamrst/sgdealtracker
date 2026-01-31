import { createClient } from "@/lib/supabase/server";
import { ProspectsList } from "./prospects-list";

export default async function ProspectsPage() {
  const supabase = await createClient();

  // Get user's startups
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .single();

  let startupIds: string[] = [];

  if (profile?.role === "admin") {
    const { data: allStartups } = await supabase
      .from("startups")
      .select("id");
    startupIds = allStartups?.map(s => s.id) || [];
  } else if (profile) {
    const { data: memberships } = await supabase
      .from("startup_members")
      .select("startup_id")
      .eq("user_id", profile.id);
    startupIds = memberships?.map(m => m.startup_id) || [];
  }

  // Get prospects with owner info
  let prospects: any[] = [];
  if (startupIds.length > 0) {
    const { data } = await supabase
      .from("prospects")
      .select("*, startup:startups(name), owner:profiles!prospects_owner_id_fkey(id, full_name)")
      .in("startup_id", startupIds)
      .order("updated_at", { ascending: false });
    prospects = data || [];
  }

  // Get startups for the dropdown
  let startups: { id: string; name: string }[] = [];
  if (startupIds.length > 0) {
    const { data } = await supabase
      .from("startups")
      .select("id, name")
      .in("id", startupIds);
    startups = data || [];
  }

  // Get all users for owner dropdown
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  return (
    <ProspectsList
      initialProspects={prospects || []}
      startups={startups || []}
      users={users || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
