import { createClient } from "@/lib/supabase/server";
import { SettingsPage } from "./settings-page";

export default async function Settings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id || "")
    .single();

  const isAdmin = profile?.role === "admin";

  // Get startups (admin sees all, founders see their own)
  let startups: { id: string; name: string; description: string | null }[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("startups")
      .select("id, name, description")
      .order("name");
    startups = data || [];
  } else if (profile) {
    const { data: memberships } = await supabase
      .from("startup_members")
      .select("startup:startups(id, name, description)")
      .eq("user_id", profile.id);
    startups = memberships?.map((m) => m.startup as unknown as typeof startups[0]).filter(Boolean) || [];
  }

  // Get pending invites (admin only)
  let invites: {
    id: string;
    email: string;
    token: string;
    expires_at: string;
    startup: { name: string } | null;
  }[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("invites")
      .select("id, email, token, expires_at, startup:startups(name)")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invites = (data || []).map((d: any) => ({
      ...d,
      startup: Array.isArray(d.startup) ? d.startup[0] || null : d.startup
    }));
  }

  return (
    <SettingsPage
      profile={profile}
      isAdmin={isAdmin}
      startups={startups}
      invites={invites}
    />
  );
}
