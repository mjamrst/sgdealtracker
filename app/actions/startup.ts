"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setCurrentStartup(startupId: string) {
  const supabase = await createClient();

  // Verify the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if user is admin or has membership for this startup
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let hasAccess = false;
  if (profile?.role === "admin") {
    hasAccess = true;
  } else {
    const { data: membership } = await supabase
      .from("startup_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("startup_id", startupId)
      .single();
    hasAccess = !!membership;
  }

  if (!hasAccess) return;

  const cookieStore = await cookies();
  cookieStore.set("current_startup_id", startupId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  revalidatePath("/", "layout");
}
