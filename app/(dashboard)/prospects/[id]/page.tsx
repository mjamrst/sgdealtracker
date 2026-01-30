import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProspectDetail } from "./prospect-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("*, startup:startups(id, name), owner:profiles!prospects_owner_id_fkey(id, full_name)")
    .eq("id", id)
    .single();

  if (error || !prospect) {
    notFound();
  }

  // Get activity log for this prospect
  const { data: activities } = await supabase
    .from("activity_log")
    .select("*, user:profiles(full_name)")
    .eq("prospect_id", id)
    .order("created_at", { ascending: false });

  // Get all users for owner dropdown
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  return (
    <ProspectDetail
      prospect={prospect}
      activities={activities || []}
      users={users || []}
    />
  );
}
