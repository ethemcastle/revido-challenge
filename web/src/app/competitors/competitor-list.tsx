"use client";

import { useState, useEffect } from "react";
import { addCompetitor, deleteCompetitor, updateCompetitor } from "./actions";
import { createClient } from "@/utils/supabase/client";
import Modal from "./modal";

type Competitor = {
  id: string;
  name: string;
  homepage_url: string;
  notes: string | null;
  created_at: string;
};

export default function CompetitorList({ competitors }: { competitors: Competitor[] }) {
  const [items, setItems] = useState<Competitor[]>(competitors);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [deleting, setDeleting] = useState<Competitor | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // Sync server-rendered data
  useEffect(() => {
    setItems(competitors);
  }, [competitors]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("competitors-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competitors" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [payload.new as Competitor, ...prev]);
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
          className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity"
        >
          + Add Competitor
        </button>
      </div>

      {/* List */}
      {competitors.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl dark:border-zinc-700">
          <p className="text-zinc-400 text-sm">No competitors yet.</p>
          <button
            onClick={() => { setShowAdd(true); setError(""); }}
            className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Add your first competitor →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div
              key={c.id}
              className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all bg-white dark:bg-zinc-900/50"
            >
              {/* Avatar / Icon */}
              <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 uppercase">
                {c.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{c.name}</p>
                <a
                  href={c.homepage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 hover:text-blue-500 transition-colors truncate block"
                >
                  {c.homepage_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>

              {/* Notes badge */}
              {c.notes && (
                <span className="hidden sm:inline-block max-w-[140px] truncate text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-md">
                  {c.notes}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditing(c); setError(""); }}
                  className="px-2.5 py-1.5 text-xs rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="px-2.5 py-1.5 text-xs rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal open={true} onClose={() => setShowAdd(false)}>
          <h2 className="text-lg font-semibold mb-4">Add Competitor</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Name</label>
              <input
                name="name"
                placeholder="e.g. Acme Corp"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Homepage URL</label>
              <input
                name="homepage_url"
                type="url"
                placeholder="https://example.com"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Notes (optional)</label>
              <textarea
                name="notes"
                placeholder="Anything worth noting..."
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg border dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button type="submit" disabled={pending} className="px-4 py-1.5 text-sm rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium disabled:opacity-50 shadow-sm">
                {pending ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal open={true} onClose={() => setEditing(null)}>
          <h2 className="text-lg font-semibold mb-4">Edit Competitor</h2>
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Name</label>
              <input
                name="name"
                defaultValue={editing.name}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Homepage URL</label>
              <input
                name="homepage_url"
                type="url"
                defaultValue={editing.homepage_url}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Notes (optional)</label>
              <textarea
                name="notes"
                defaultValue={editing.notes ?? ""}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm rounded-lg border dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button type="submit" disabled={pending} className="px-4 py-1.5 text-sm rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium disabled:opacity-50 shadow-sm">
                {pending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleting && (
        <Modal open={true} onClose={() => setDeleting(null)}>
          <h2 className="text-lg font-semibold mb-2">Remove Competitor</h2>
          <p className="text-sm text-zinc-500 mb-5">
            Remove <strong className="text-zinc-900 dark:text-zinc-100">{deleting.name}</strong>? This can't be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleting(null)} className="px-3 py-1.5 text-sm rounded-lg border dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={pending} className="px-4 py-1.5 text-sm rounded-lg bg-red-600 text-white font-medium disabled:opacity-50 shadow-sm">
              {pending ? "Removing..." : "Remove"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

