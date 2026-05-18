"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Competitor } from "@/types";

export function useCompetitorsRealtime(initial: Competitor[]) {
  const [items, setItems] = useState<Competitor[]>(initial);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("competitors-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competitors" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => {
              if (prev.some((c) => c.id === (payload.new as Competitor).id)) return prev;
              return [payload.new as Competitor, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((c) => (c.id === (payload.new as Competitor).id ? (payload.new as Competitor) : c))
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((c) => c.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return items;
}

