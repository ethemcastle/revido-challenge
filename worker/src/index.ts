import "dotenv/config";
import { supabase } from "./supabase";
import { SHARED_WORKSPACE_ID } from "./constants";

const POLL_INTERVAL = 5000; // 5 seconds

async function processSnapshots() {
  const { data: snapshots, error } = await supabase
    .from("snapshots")
    .select("*, competitors(name, homepage_url)")
    .eq("workspace_id", SHARED_WORKSPACE_ID)
    .eq("status", "pending")
    .limit(10);

  if (error) {
    console.error("Error fetching snapshots:", error.message);
    return;
  }

  for (const snapshot of snapshots ?? []) {
    console.log(`Processing snapshot: ${snapshot.id} for competitor ${snapshot.competitors?.name}`);

    try {
      const url = snapshot.competitors?.homepage_url;
      if (!url) throw new Error("No homepage URL");

      // Fetch the competitor's homepage
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const html = await res.text();

      // Extract basic info (title, description, status)
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);

      const content = {
        title: titleMatch?.[1]?.trim() || null,
        description: descMatch?.[1]?.trim() || null,
        status_code: res.status,
        fetched_at: new Date().toISOString(),
        content_length: html.length,
      };

      const { error: updateError } = await supabase
        .from("snapshots")
        .update({ status: "completed", content })
        .eq("id", snapshot.id);

      if (updateError) {
        console.error(`Error updating snapshot ${snapshot.id}:`, updateError.message);
      } else {
        console.log(`Completed snapshot: ${snapshot.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Snapshot ${snapshot.id} failed:`, message);

      await supabase
        .from("snapshots")
        .update({ status: "failed", error: message })
        .eq("id", snapshot.id);
    }
  }
}

async function main() {
  console.log("Worker started. Polling every", POLL_INTERVAL, "ms");

  while (true) {
    await processSnapshots();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

main().catch((err) => {
  console.error("Worker crashed:", err);
  process.exit(1);
});
