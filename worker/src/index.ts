import "dotenv/config";
import { supabase } from "./supabase";
import { SHARED_WORKSPACE_ID } from "./constants";

const POLL_INTERVAL = 5000; // 5 seconds

async function processItems() {
  const { data: items, error } = await supabase
    .from("my_items")
    .select("*")
    .eq("workspace_id", SHARED_WORKSPACE_ID)
    .eq("status", "pending")
    .limit(10);

  if (error) {
    console.error("Error fetching items:", error.message);
    return;
  }

  for (const item of items ?? []) {
    console.log(`Processing item: ${item.id}`);

    // TODO: Do your processing work here (API calls, parsing, etc.)

    const { error: updateError } = await supabase
      .from("my_items")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (updateError) {
      console.error(`Error updating item ${item.id}:`, updateError.message);
    } else {
      console.log(`Completed item: ${item.id}`);
    }
  }
}

async function main() {
  console.log("Worker started. Polling every", POLL_INTERVAL, "ms");

  while (true) {
    await processItems();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

main().catch((err) => {
  console.error("Worker crashed:", err);
  process.exit(1);
});
