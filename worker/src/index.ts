import "dotenv/config";
import { supabase } from "./supabase";
import { SHARED_WORKSPACE_ID } from "./constants";
import FirecrawlApp from "@mendable/firecrawl-js";

const POLL_INTERVAL = 5000;
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY ?? "" });

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

      // Use Firecrawl for JS-rendered pages; fall back to basic fetch if no API key
      let content: Record<string, unknown>;

      if (process.env.FIRECRAWL_API_KEY) {
        const result = await firecrawl.v1.scrapeUrl(url, { formats: ["markdown"] });
        if (!result.success) {
          throw new Error(result.error || "Firecrawl scrape failed");
        }
        content = {
          title: result.metadata?.title || null,
          description: result.metadata?.description || null,
          status_code: result.metadata?.statusCode ?? 200,
          markdown: result.markdown || null,
          fetched_at: new Date().toISOString(),
          source: "firecrawl",
        };
      } else {
        // Fallback: basic fetch (won't work on JS-heavy sites)
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
        content = {
          title: titleMatch?.[1]?.trim() || null,
          description: descMatch?.[1]?.trim() || null,
          status_code: res.status,
          content_length: html.length,
          fetched_at: new Date().toISOString(),
          source: "fetch",
        };
      }

      const { error: updateError } = await supabase
        .from("snapshots")
        .update({ status: "completed", content, completed_at: new Date().toISOString() })
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
  console.log("Firecrawl:", process.env.FIRECRAWL_API_KEY ? "enabled" : "disabled (using fetch fallback)");

  while (true) {
    await processSnapshots();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

main().catch((err) => {
  console.error("Worker crashed:", err);
  process.exit(1);
});
