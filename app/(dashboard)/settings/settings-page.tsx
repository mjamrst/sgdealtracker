"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Plus, Send, Copy, Trash2, Building2, Users, Mail, UserPlus, Clock } from "lucide-react";
import type { Profile, MemberRole } from "@/lib/types/database";
import { createUserWithPassword } from "./actions";

interface SettingsPageProps {
  profile: Profile | null;
  isAdmin: boolean;
  startups: { id: string; name: string; description: string | null }[];
  invites: {
    id: string;
    email: string;
    token: string;
    expires_at: string;
    startup: { name: string } | null;
  }[];
  teamMembers: {
    id: string;
    email: string;
    full_name: string | null;
    last_sign_in_at: string | null;
    created_at: string;
    startup_members: { startup: { id: string; name: string } | null; role: string }[];
  }[];
}

export function SettingsPage({ profile, isAdmin, startups, invites: initialInvites, teamMembers: initialTeamMembers }: SettingsPageProps) {
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
  });
  const [saving, setSaving] = useState(false);
  const [invites, setInvites] = useState(initialInvites);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isStartupDialogOpen, setIsStartupDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    startup_id: startups[0]?.id || "",
    role: "founder" as MemberRole,
  });
  const [startupData, setStartupData] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    full_name: "",
    startup_id: startups[0]?.id || "",
    role: "founder" as MemberRole,
  });
  const router = useRouter();
  const supabase = createClient();

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profileData.full_name })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to save profile");
      setSaving(false);
      return;
    }

    toast.success("Profile saved");
    setSaving(false);
    router.refresh();
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("invites")
      .insert({
        email: inviteData.email,
        startup_id: inviteData.startup_id,
        role: inviteData.role,
        invited_by: user.id,
      })
      .select("id, email, token, expires_at, startup:startups(name)")
      .single();

    if (error) {
      toast.error("Failed to create invite");
      return;
    }

    // Transform the data to match the expected type
    const newInvite = {
      id: data.id,
      email: data.email,
      token: data.token,
      expires_at: data.expires_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startup: Array.isArray((data as any).startup) ? (data as any).startup[0] || null : (data as any).startup,
    };

    setInvites((prev) => [newInvite, ...prev]);
    setIsInviteDialogOpen(false);
    setInviteData({
      email: "",
      startup_id: startups[0]?.id || "",
      role: "founder",
    });
    toast.success("Invite created");
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard");
  };

  const handleDeleteInvite = async (inviteId: string) => {
    const { error } = await supabase.from("invites").delete().eq("id", inviteId);

    if (error) {
      toast.error("Failed to delete invite");
      return;
    }

    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    toast.success("Invite deleted");
  };

  const handleCreateStartup = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("startups")
      .insert({
        name: startupData.name,
        description: startupData.description || null,
        category: startupData.category || null,
      })
      .select("id, name, description")
      .single();

    if (error) {
      toast.error("Failed to create startup");
      return;
    }

    setIsStartupDialogOpen(false);
    setStartupData({ name: "", description: "", category: "" });
    toast.success("Startup created");
    router.refresh();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    const result = await createUserWithPassword({
      email: newUserData.email,
      password: newUserData.password,
      full_name: newUserData.full_name,
      startup_id: newUserData.startup_id,
      role: newUserData.role,
    });

    if (result.error) {
      toast.error(result.error);
      setCreatingUser(false);
      return;
    }

    setIsCreateUserDialogOpen(false);
    setNewUserData({
      email: "",
      password: "",
      full_name: "",
      startup_id: startups[0]?.id || "",
      role: "founder",
    });
    setCreatingUser(false);
    toast.success("User created successfully");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="team">Team & Invites</TabsTrigger>}
          {isAdmin && <TabsTrigger value="startups">Startups</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={profile?.role === "admin" ? "Admin" : "Founder"} disabled className="bg-muted" />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="team">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Invite Team Members</CardTitle>
                    <CardDescription>
                      Send invites to founders to join their startups
                    </CardDescription>
                  </div>
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invite to join a startup
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSendInvite} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email *</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteData.email}
                            onChange={(e) =>
                              setInviteData((prev) => ({ ...prev, email: e.target.value }))
                            }
                            placeholder="founder@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-startup">Startup</Label>
                          <Select
                            value={inviteData.startup_id}
                            onValueChange={(value) =>
                              setInviteData((prev) => ({ ...prev, startup_id: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select startup" />
                            </SelectTrigger>
                            <SelectContent>
                              {startups.map((startup) => (
                                <SelectItem key={startup.id} value={startup.id}>
                                  {startup.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Role</Label>
                          <Select
                            value={inviteData.role}
                            onValueChange={(value: MemberRole) =>
                              setInviteData((prev) => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="founder">Founder</SelectItem>
                              <SelectItem value="team">Team Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsInviteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Send Invite</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {invites.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No pending invites</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Startup</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invites.map((invite) => (
                          <TableRow key={invite.id}>
                            <TableCell>{invite.email}</TableCell>
                            <TableCell>{invite.startup?.name || "-"}</TableCell>
                            <TableCell>
                              {new Date(invite.expires_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleCopyInviteLink(invite.token)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Invite</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this invite?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteInvite(invite.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Team Members Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage users and view their activity
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Create a user account with a password
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-name">Full Name *</Label>
                          <Input
                            id="user-name"
                            value={newUserData.full_name}
                            onChange={(e) =>
                              setNewUserData((prev) => ({ ...prev, full_name: e.target.value }))
                            }
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-email">Email *</Label>
                          <Input
                            id="user-email"
                            type="email"
                            value={newUserData.email}
                            onChange={(e) =>
                              setNewUserData((prev) => ({ ...prev, email: e.target.value }))
                            }
                            placeholder="user@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-password">Password *</Label>
                          <Input
                            id="user-password"
                            type="password"
                            value={newUserData.password}
                            onChange={(e) =>
                              setNewUserData((prev) => ({ ...prev, password: e.target.value }))
                            }
                            placeholder="Minimum 6 characters"
                            minLength={6}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-startup">Startup</Label>
                          <Select
                            value={newUserData.startup_id}
                            onValueChange={(value) =>
                              setNewUserData((prev) => ({ ...prev, startup_id: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select startup" />
                            </SelectTrigger>
                            <SelectContent>
                              {startups.map((startup) => (
                                <SelectItem key={startup.id} value={startup.id}>
                                  {startup.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-role">Role</Label>
                          <Select
                            value={newUserData.role}
                            onValueChange={(value: MemberRole) =>
                              setNewUserData((prev) => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="founder">Founder</SelectItem>
                              <SelectItem value="team">Team Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateUserDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={creatingUser}>
                            {creatingUser ? "Creating..." : "Create User"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No team members yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Startup</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Last Sign In</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.full_name || "-"}
                            </TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              {member.startup_members.length > 0
                                ? member.startup_members
                                    .map((sm) => sm.startup?.name)
                                    .filter(Boolean)
                                    .join(", ")
                                : "-"}
                            </TableCell>
                            <TableCell className="capitalize">
                              {member.startup_members.length > 0
                                ? member.startup_members[0]?.role || "-"
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {member.last_sign_in_at ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  {new Date(member.last_sign_in_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Never</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="startups">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Startups</CardTitle>
                  <CardDescription>Manage the startups you advise</CardDescription>
                </div>
                <Dialog open={isStartupDialogOpen} onOpenChange={setIsStartupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Startup
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Startup</DialogTitle>
                      <DialogDescription>Add a new startup to track</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateStartup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="startup-name">Name *</Label>
                        <Input
                          id="startup-name"
                          value={startupData.name}
                          onChange={(e) =>
                            setStartupData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startup-description">Description</Label>
                        <Textarea
                          id="startup-description"
                          value={startupData.description}
                          onChange={(e) =>
                            setStartupData((prev) => ({ ...prev, description: e.target.value }))
                          }
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startup-category">Category</Label>
                        <Input
                          id="startup-category"
                          value={startupData.category}
                          onChange={(e) =>
                            setStartupData((prev) => ({ ...prev, category: e.target.value }))
                          }
                          placeholder="e.g., Consumer Insights, FinTech"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsStartupDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Create Startup</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {startups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No startups yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {startups.map((startup) => (
                      <Card key={startup.id} className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{startup.name}</CardTitle>
                        </CardHeader>
                        {startup.description && (
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground">
                              {startup.description}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
