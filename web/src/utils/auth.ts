"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Returns the authenticated user or an error object.
 * Use at the top of every server action.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, supabase, error: "Not authenticated" as const };
  }
  return { user, supabase, error: null };
}

