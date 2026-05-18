"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function signInWithEmail(email: string) {
  const supabase = await createClient();

  // Get the public-facing origin from the request headers
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

