"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface InviteData {
  email: string;
  startup: {
    name: string;
  };
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchInvite() {
      const { data, error } = await supabase
        .from("invites")
        .select("email, startup:startups(name)")
        .eq("token", token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        toast.error("Invalid or expired invite");
        router.push("/login");
        return;
      }

      const inviteData = data as unknown as { email: string; startup: { name: string } | null };
      setInvite({
        email: inviteData.email,
        startup: inviteData.startup || { name: "Unknown" },
      });
      setLoading(false);
    }

    fetchInvite();
  }, [token, router, supabase]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    setSubmitting(true);

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setSubmitting(false);
      return;
    }

    // Mark invite as accepted (the trigger will handle adding to startup_members)
    const { error: updateError } = await (supabase
      .from("invites") as ReturnType<typeof supabase.from>)
      .update({ accepted_at: new Date().toISOString() })
      .eq("token", token);

    if (updateError) {
      toast.error("Failed to accept invite");
      setSubmitting(false);
      return;
    }

    if (authData.user && !authData.session) {
      toast.success("Account created! Check your email to confirm.");
      router.push("/login");
    } else {
      toast.success("Welcome to " + invite.startup.name + "!");
      router.push("/dashboard");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading invite...</div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Join {invite.startup.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as a team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invite.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Joining..." : "Accept Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
