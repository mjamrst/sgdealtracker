import { getAuth } from "@/lib/supabase/queries";
import { SettingsPage } from "./settings-page";

export default async function Settings() {
  const { profile, supabase } = await getAuth();

  const isAdmin = profile?.role === "admin";

  // Get startups (admin sees all, founders see their own)
  let startups: { id: string; name: string; description: string | null }[] = [];
  let invites: {
    id: string;
    email: string;
    token: string;
    expires_at: string;
    startup: { name: string } | null;
  }[] = [];
  let teamMembers: {
    id: string;
    email: string;
    full_name: string | null;
    last_sign_in_at: string | null;
    created_at: string;
    startup_members: { startup: { id: string; name: string } | null }[];
  }[] = [];

  if (isAdmin) {
    // Admin: run all three queries in parallel
    const [startupsRes, invitesRes, teamRes] = await Promise.all([
      supabase
        .from("startups")
        .select("id, name, description")
        .order("name"),
      supabase
        .from("invites")
        .select("id, email, token, expires_at, startup:startups(name)")
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          last_sign_in_at,
          created_at,
          startup_members (
            startup:startups (id, name)
          )
        `)
        .neq("role", "admin")
        .order("created_at", { ascending: false }),
    ]);

    startups = startupsRes.data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invites = (invitesRes.data || []).map((d: any) => ({
      ...d,
      startup: Array.isArray(d.startup) ? d.startup[0] || null : d.startup
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teamMembers = (teamRes.data || []).map((d: any) => ({
      ...d,
      startup_members: (d.startup_members || []).map((sm: any) => ({
        ...sm,
        startup: Array.isArray(sm.startup) ? sm.startup[0] || null : sm.startup
      }))
    }));
  } else if (profile) {
    const { data: memberships } = await supabase
      .from("startup_members")
      .select("startup:startups(id, name, description)")
      .eq("user_id", profile.id);
    startups = memberships?.map((m) => m.startup as unknown as typeof startups[0]).filter(Boolean) || [];
  }

  return (
    <SettingsPage
      profile={profile}
      isAdmin={isAdmin}
      startups={startups}
      invites={invites}
      teamMembers={teamMembers}
    />
  );
}
