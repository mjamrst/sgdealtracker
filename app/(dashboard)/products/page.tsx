import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ProductsList } from "./products-list";

export default async function ProductsPage() {
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

  // Get products for current startup only
  let products: any[] = [];
  if (startupId) {
    const { data } = await supabase
      .from("products")
      .select("*, startup:startups(name)")
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false });
    products = data || [];
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
    <ProductsList
      initialProducts={products || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
