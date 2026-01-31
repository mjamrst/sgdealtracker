import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { MaterialsList } from "./materials-list";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's profile by ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user?.id || "")
    .single();

  // Get current startup from cookie
  const currentStartupId = cookieStore.get("current_startup_id")?.value;

  // Verify user has access to this startup
  let hasAccess = false;
  if (currentStartupId) {
    if (profile?.role === "admin") {
      hasAccess = true;
    } else if (profile) {
      const { data: membership } = await supabase
        .from("startup_members")
        .select("id")
        .eq("user_id", profile.id)
        .eq("startup_id", currentStartupId)
        .single();
      hasAccess = !!membership;
    }
  }

  const startupId = hasAccess ? currentStartupId : null;

  // Get materials with versions for current startup only
  let materials: any[] = [];
  if (startupId) {
    const { data } = await supabase
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
      .order("created_at", { ascending: false });
    materials = data || [];
  }

  // Get current startup for the form
  let startups: { id: string; name: string }[] = [];
  if (startupId) {
    const { data } = await supabase
      .from("startups")
      .select("id, name")
      .eq("id", startupId);
    startups = data || [];
  }

  return (
    <MaterialsList
      initialMaterials={materials || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
