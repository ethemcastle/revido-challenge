"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type SnapshotNote = {
  id: string;
  snapshot_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export function useSnapshotNotes(snapshotId: string) {
  const [notes, setNotes] = useState<SnapshotNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchNotes = async () => {
      const { data } = await supabase
        .from("snapshot_notes")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("created_at", { ascending: true });
      setNotes(data ?? []);
      setLoading(false);
    };

    fetchNotes();

    const channel = supabase
      .channel(`snapshot-notes-${snapshotId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "snapshot_notes",
          filter: `snapshot_id=eq.${snapshotId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotes((prev) => {
              if (prev.some((n) => n.id === (payload.new as SnapshotNote).id)) return prev;
              return [...prev, payload.new as SnapshotNote];
            });
          } else if (payload.eventType === "DELETE") {
            setNotes((prev) => prev.filter((n) => n.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [snapshotId]);

  return { notes, setNotes, loading };
}

