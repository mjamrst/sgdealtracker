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

  // Get prospects
  const { data: prospects } = await supabase
    .from("prospects")
    .select("*, startup:startups(name)")
    .in("startup_id", startupIds.length > 0 ? startupIds : ["none"])
    .order("updated_at", { ascending: false });

  // Get startups for the dropdown
  const { data: startups } = await supabase
    .from("startups")
    .select("id, name")
    .in("id", startupIds.length > 0 ? startupIds : ["none"]);

  return (
    <ProspectsList
      initialProspects={prospects || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
