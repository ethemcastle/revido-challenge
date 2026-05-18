"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type Snapshot = {
  id: string;
  competitor_id: string;
  workspace_id: string;
  status: string;
  content: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
};

export function useSnapshots(competitorId?: string) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetch = async () => {
      let query = supabase
        .from("snapshots")
        .select("*")
        .order("created_at", { ascending: false });

      if (competitorId) {
        query = query.eq("competitor_id", competitorId);
      }

      const { data } = await query;
      setSnapshots(data ?? []);
      setLoading(false);
    };

    fetch();

    // Realtime subscription
    const filter = competitorId
      ? `competitor_id=eq.${competitorId}`
      : undefined;

    const channel = supabase
      .channel(`snapshots-${competitorId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "snapshots",
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSnapshots((prev) => [payload.new as Snapshot, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setSnapshots((prev) =>
              prev.map((s) =>
                s.id === (payload.new as Snapshot).id ? (payload.new as Snapshot) : s
              )
            );
          } else if (payload.eventType === "DELETE") {
            setSnapshots((prev) =>
              prev.filter((s) => s.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitorId]);

  return { snapshots, loading };
}

