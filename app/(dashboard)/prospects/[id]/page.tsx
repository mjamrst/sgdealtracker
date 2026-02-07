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

  // Get users for owner dropdown: startup members + admins
  let users: { id: string; full_name: string | null; email: string }[] = [];
  if (prospect.startup_id) {
    const { data: members } = await supabase
      .from("startup_members")
      .select("user_id")
      .eq("startup_id", prospect.startup_id);
    const memberIds = (members || []).map((m) => m.user_id);

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    const adminIds = (admins || []).map((a) => a.id);

    const allIds = [...new Set([...memberIds, ...adminIds])];

    if (allIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", allIds)
        .order("full_name", { ascending: true });
      users = data || [];
    }
  }

  return (
    <ProspectDetail
      prospect={prospect}
      activities={activities || []}
      users={users || []}
    />
  );
}
