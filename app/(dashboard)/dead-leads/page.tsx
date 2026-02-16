import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DeadLeadsList } from "./dead-leads-list";

export default async function DeadLeadsPage() {
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

  // Get closed_lost prospects for current startup only
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
