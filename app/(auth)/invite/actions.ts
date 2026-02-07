"use server";

import { createAdminClient } from "@/lib/supabase/admin";

interface AcceptInviteParams {
  token: string;
  password: string;
  fullName: string;
}

export async function acceptInvite({ token, password, fullName }: AcceptInviteParams) {
  const adminClient = createAdminClient();

  // 1. Look up the invite by token
  const { data: invite, error: inviteError } = await adminClient
    .from("invites")
    .select("id, email, startup_id")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (inviteError || !invite) {
    return { error: "Invalid or expired invite" };
  }

  // 2. Create the auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    return { error: authError.message };
  }

  // 3. Update the profile with full_name
  await adminClient
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", authData.user.id);

  // 4. Insert into startup_members
  const { error: memberError } = await adminClient
    .from("startup_members")
    .insert({
      startup_id: invite.startup_id,
      user_id: authData.user.id,
    });

  if (memberError) {
    console.warn("Failed to add user to startup_members:", memberError.message);
    return { error: "Account created but failed to join startup. Contact an admin." };
  }

  // 5. Mark invite as accepted
  const { error: updateError } = await adminClient
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateError) {
    console.warn("Failed to mark invite as accepted:", updateError.message);
  }

  return { success: true };
}
