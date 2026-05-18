"use client";

import { useSnapshots, Snapshot } from "@/hooks/use-snapshots";
import SnapshotNotes from "./snapshot-notes";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    completed: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    failed: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {status}
    </span>
  );
}

function SnapshotCard({ snapshot }: { snapshot: Snapshot }) {
  const content = snapshot.content as Record<string, unknown> | null;

  return (
    <div className="border rounded-lg p-3 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="flex items-center justify-between mb-1">
        <StatusBadge status={snapshot.status} />
        <span className="text-[10px] text-zinc-400">
          {new Date(snapshot.created_at).toLocaleString()}
        </span>
      </div>
      {snapshot.status === "completed" && content && (
        <div className="mt-2 space-y-1">
          {content.title && (
            <p className="text-xs font-medium truncate">{content.title as string}</p>
          )}
          {content.description && (
            <p className="text-xs text-zinc-500 truncate">{content.description as string}</p>
          )}
          <p className="text-[10px] text-zinc-400">
            Status {content.status_code as number} · {((content.content_length as number) / 1024).toFixed(1)}KB
          </p>
        </div>
      )}
      {snapshot.status === "failed" && snapshot.error && (
        <p className="mt-1 text-xs text-red-500 truncate">{snapshot.error}</p>
      )}
      {snapshot.status === "pending" && (
        <p className="mt-1 text-xs text-zinc-400 animate-pulse">Processing...</p>
      )}
      {/* Notes section */}
      <SnapshotNotes snapshotId={snapshot.id} />
    </div>
  );
}

export default function SnapshotsPanel({ competitorId }: { competitorId: string }) {
  const { snapshots, loading } = useSnapshots(competitorId);

  if (loading) {
    return <p className="text-xs text-zinc-400 animate-pulse">Loading snapshots...</p>;
  }

  if (snapshots.length === 0) {
    return <p className="text-xs text-zinc-400">No snapshots yet.</p>;
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {snapshots.map((s) => (
        <SnapshotCard key={s.id} snapshot={s} />
      ))}
    </div>
  );
}
