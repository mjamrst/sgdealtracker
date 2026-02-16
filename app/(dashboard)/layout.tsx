import { redirect } from "next/navigation";
import { getAuth } from "@/lib/supabase/queries";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, supabase } = await getAuth();

  if (!user) {
    redirect("/login");
  }

  const userProfile = profile || {
    email: user.email || "",
    full_name: null,
    role: "founder",
  };

  // Get user's startups for the sidebar
  let startups: { id: string; name: string }[] = [];

  if (userProfile.role === "admin") {
    const { data } = await supabase
      .from("startups")
      .select("id, name")
      .order("name");
    startups = (data || []) as { id: string; name: string }[];
  } else {
    const { data: memberships } = await supabase
      .from("startup_members")
      .select("startup_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const startupIds = memberships.map(m => m.startup_id);
      const { data: startupData } = await supabase
        .from("startups")
        .select("id, name")
        .in("id", startupIds)
        .order("name");
      startups = (startupData || []) as { id: string; name: string }[];
    }
  }

  // Get current startup from cookie
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const currentStartupId = cookieStore.get("current_startup_id")?.value;
  const currentStartup = startups.find(s => s.id === currentStartupId) || startups[0] || null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        user={userProfile}
        startups={startups}
        currentStartup={currentStartup}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
