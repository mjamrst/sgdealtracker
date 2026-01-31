import { createClient } from "@/lib/supabase/server";
import { ProductsList } from "./products-list";

export default async function ProductsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's profile by ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user?.id || "")
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

  // Get products
  let products: any[] = [];
  if (startupIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("*, startup:startups(name)")
      .in("startup_id", startupIds)
      .order("created_at", { ascending: false });
    products = data || [];
  }

  // Get startups for the dropdown
  let startups: { id: string; name: string }[] = [];
  if (startupIds.length > 0) {
    const { data } = await supabase
      .from("startups")
      .select("id, name")
      .in("id", startupIds);
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
