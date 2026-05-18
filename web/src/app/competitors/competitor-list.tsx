"use client";

import { useState } from "react";
import { addCompetitor, deleteCompetitor, updateCompetitor, triggerSnapshot } from "./actions";
import { useCompetitorsRealtime } from "@/hooks/use-competitors-realtime";
import { AddModal, EditModal, DeleteModal } from "./competitor-modals";
import SnapshotsPanel from "./snapshots-panel";
import SnapshotCompare from "./snapshot-compare";
import type { Competitor } from "@/types";

export default function CompetitorList({ competitors }: { competitors: Competitor[] }) {
  const items = useCompetitorsRealtime(competitors);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [deleting, setDeleting] = useState<Competitor | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<"snapshots" | "compare">("snapshots");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError("");
    const result = await addCompetitor(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else {
      setShowAdd(false);
      setPending(false);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setPending(true);
    setError("");
    const result = await updateCompetitor(editing.id, new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else {
      setEditing(null);
      setPending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setPending(true);
    await deleteCompetitor(deleting.id);
    setDeleting(null);
    setPending(false);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitors</h1>
          <p className="text-sm text-zinc-500 mt-1">{items.length} tracked</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError(""); }}
          className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity"
        >
          + Add Competitor
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl dark:border-zinc-700">
          <p className="text-zinc-400 text-sm">No competitors yet.</p>
          <button
            onClick={() => { setShowAdd(true); setError(""); }}
            className="cursor-pointer mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Add your first competitor →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div
              key={c.id}
              className="group rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all bg-white dark:bg-zinc-900/50 overflow-hidden"
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                {/* Avatar / Icon */}
                <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 uppercase">
                  {c.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <span className="text-xs text-zinc-400 truncate block">
                    {c.homepage_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </div>

                {/* Notes badge */}
                {c.notes && (
                  <span className="hidden sm:inline-block max-w-[140px] truncate text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-md">
                    {c.notes}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={async () => { await triggerSnapshot(c.id); setExpandedId(c.id); }}
                    className="cursor-pointer px-2.5 py-1.5 text-xs rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors font-medium"
                  >
                    Scan
                  </button>
                  <button
                    onClick={() => { setEditing(c); setError(""); }}
                    className="cursor-pointer px-2.5 py-1.5 text-xs rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    className="cursor-pointer px-2.5 py-1.5 text-xs rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Expandable panel */}
              {expandedId === c.id && (
                <div className="border-t dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-4 px-4 pt-3">
                    <button
                      onClick={() => setExpandedTab("snapshots")}
                      className={`cursor-pointer text-xs font-medium pb-2 border-b-2 transition-colors ${expandedTab === "snapshots" ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}
                    >
                      Snapshots
                    </button>
                    <button
                      onClick={() => setExpandedTab("compare")}
                      className={`cursor-pointer text-xs font-medium pb-2 border-b-2 transition-colors ${expandedTab === "compare" ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}
                    >
                      Compare
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    {expandedTab === "snapshots" ? (
                      <SnapshotsPanel competitorId={c.id} />
                    ) : (
                      <SnapshotCompare competitorId={c.id} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} pending={pending} error={error} />}
      {editing && <EditModal competitor={editing} onClose={() => setEditing(null)} onSubmit={handleEdit} pending={pending} error={error} />}
      {deleting && <DeleteModal competitor={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} pending={pending} />}
    </>
  );
}

