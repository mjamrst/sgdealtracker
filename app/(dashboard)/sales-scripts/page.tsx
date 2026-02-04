import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SalesScriptsList } from "./sales-scripts-list";

export default async function SalesScriptsPage() {
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

  // Get sales scripts for current startup only
  let salesScripts: any[] = [];
  if (startupId) {
    const { data } = await supabase
      .from("sales_scripts")
      .select("*, startup:startups(name)")
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false });
    salesScripts = data || [];
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
    <SalesScriptsList
      initialScripts={salesScripts || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
