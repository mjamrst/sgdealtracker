import { getAuth } from "@/lib/supabase/queries";
import { SalesScriptsList } from "./sales-scripts-list";

export default async function SalesScriptsPage() {
  const { profile, startupId, supabase } = await getAuth();

  let salesScripts: any[] = [];
  let startups: { id: string; name: string }[] = [];

  if (startupId) {
    const [scriptsRes, startupsRes] = await Promise.all([
      supabase
        .from("sales_scripts")
        .select("*, startup:startups(name)")
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false }),
      supabase
        .from("startups")
        .select("id, name")
        .eq("id", startupId),
    ]);

    salesScripts = scriptsRes.data || [];
    startups = startupsRes.data || [];
  }

  return (
    <SalesScriptsList
      initialScripts={salesScripts || []}
      startups={startups || []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
