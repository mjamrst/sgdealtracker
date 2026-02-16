import { getAuth } from "@/lib/supabase/queries";
import { ProductsList } from "./products-list";

export default async function ProductsPage() {
  const { profile, startupId, supabase } = await getAuth();

  let products: any[] = [];
  let startups: { id: string; name: string }[] = [];

  if (startupId) {
    const [productsRes, startupsRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, startup:startups(name)")
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false }),
      supabase
        .from("startups")
        .select("id, name")
        .eq("id", startupId),
    ]);

    products = productsRes.data || [];
    startups = startupsRes.data || [];
  }

  return (
    <ProductsList
      initialProducts={products || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
