"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/utils/auth";

export async function addCompetitor(formData: FormData) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return { error: authError };

  const name = (formData.get("name") as string)?.trim();
  const homepage_url = (formData.get("homepage_url") as string)?.trim();
  const notes = (formData.get("notes") as string) || null;

  if (!name) return { error: "Name is required" };
  if (!homepage_url) return { error: "Homepage URL is required" };

  // Check name uniqueness
  const { data: existing } = await supabase
    .from("competitors")
    .select("id")
    .ilike("name", name)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "A competitor with this name already exists" };
  }

  // Verify URL is reachable
  try {
    const res = await fetch(homepage_url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      return { error: `URL returned status ${res.status}. Please check the URL.` };
    }
  } catch {
    return { error: "Could not reach the URL. Please verify it exists." };
  }

  const { error } = await supabase.from("competitors").insert({
    name,
    homepage_url,
    notes,
    created_by_user_id: user!.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/competitors");
  return { success: true };
}

export async function deleteCompetitor(id: string) {
  const { supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return { error: authError };

  const { error } = await supabase.from("competitors").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/competitors");
  return { success: true };
}

export async function updateCompetitor(id: string, formData: FormData) {
  const { supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return { error: authError };

  const name = (formData.get("name") as string)?.trim();
  const homepage_url = (formData.get("homepage_url") as string)?.trim();
  const notes = (formData.get("notes") as string) || null;

  if (!name) return { error: "Name is required" };
  if (!homepage_url) return { error: "Homepage URL is required" };

  // Check name uniqueness (exclude self)
  const { data: existing } = await supabase
    .from("competitors")
    .select("id")
    .ilike("name", name)
    .neq("id", id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "A competitor with this name already exists" };
  }

  const { error } = await supabase
    .from("competitors")
    .update({ name, homepage_url, notes })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/competitors");
  return { success: true };
}

export async function triggerSnapshot(competitorId: string) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return { error: authError };

  const { error } = await supabase.from("snapshots").insert({
    competitor_id: competitorId,
    status: "pending",
    triggered_by: user!.id,
  });

  if (error) return { error: error.message };
  return { success: true };
}
