import { createClient } from "@/lib/supabase/server";
import { MaterialsList } from "./materials-list";

export default async function MaterialsPage() {
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

  // Get materials with versions
  const { data: materials } = await supabase
    .from("materials")
    .select(`
      *,
      startup:startups(name),
      versions:material_versions(
        id,
        version_number,
        file_name,
        file_path,
        uploaded_at,
        uploaded_by
      )
    `)
    .in("startup_id", startupIds.length > 0 ? startupIds : ["none"])
    .order("created_at", { ascending: false });

  // Get startups for the dropdown
  const { data: startups } = await supabase
    .from("startups")
    .select("id, name")
    .in("id", startupIds.length > 0 ? startupIds : ["none"]);

  return (
    <MaterialsList
      initialMaterials={materials || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
