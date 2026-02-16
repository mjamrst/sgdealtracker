import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "./server";
import type { Profile } from "@/lib/types/database";

export const getAuth = cache(async () => {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null as Profile | null, startupId: null, supabase };
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  const currentStartupId = cookieStore.get("current_startup_id")?.value;

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

  const startupId = hasAccess ? currentStartupId! : null;

  return { user, profile, startupId, supabase };
});
