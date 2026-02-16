import { getAuth } from "@/lib/supabase/queries";
import { MaterialsList } from "./materials-list";

export default async function MaterialsPage() {
  const { profile, startupId, supabase } = await getAuth();

  let materials: any[] = [];
  let startups: { id: string; name: string }[] = [];

  if (startupId) {
    const [materialsRes, startupsRes] = await Promise.all([
      supabase
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
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false }),
      supabase
        .from("startups")
        .select("id, name")
        .eq("id", startupId),
    ]);

    materials = materialsRes.data || [];
    startups = startupsRes.data || [];
  }

  return (
    <MaterialsList
      initialMaterials={materials || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
