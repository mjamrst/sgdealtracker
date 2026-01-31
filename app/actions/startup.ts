"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setCurrentStartup(startupId: string) {
  const cookieStore = await cookies();
  cookieStore.set("current_startup_id", startupId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  revalidatePath("/", "layout");
}
