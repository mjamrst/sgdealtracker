"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/types/database";

interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  startup_id: string;
  role: MemberRole;
}

export async function createUserWithPassword(params: CreateUserParams) {
  // Verify the requester is an admin
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized - admin only" };
  }

  const adminClient = createAdminClient();

  // Create the user in auth.users
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: params.full_name,
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user" };
  }

  // Update the profile with the full name (trigger should have created it)
  await adminClient
    .from("profiles")
    .update({ full_name: params.full_name })
    .eq("id", authData.user.id);

  // Add user to startup_members
  const { error: memberError } = await adminClient
    .from("startup_members")
    .insert({
      startup_id: params.startup_id,
      user_id: authData.user.id,
      role: params.role,
    });

  if (memberError) {
    return { error: memberError.message };
  }

  return { success: true, userId: authData.user.id };
}

export async function getTeamMembers() {
  const supabase = await createClient();

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", members: [] };
  }

  // Get all non-admin profiles with their startup memberships
  const { data: members, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      last_sign_in_at,
      created_at,
      startup_members (
        startup:startups (
          id,
          name
        ),
        role
      )
    `)
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, members: [] };
  }

  return { members: members || [] };
}
