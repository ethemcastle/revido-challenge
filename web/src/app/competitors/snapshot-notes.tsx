"use client";

import { useState } from "react";
import { useSnapshotNotes } from "@/hooks/use-snapshot-notes";
import { createClient } from "@/utils/supabase/client";

export default function SnapshotNotes({ snapshotId }: { snapshotId: string }) {
  const { notes, setNotes, loading } = useSnapshotNotes(snapshotId);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!body.trim()) return;
    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Not authenticated");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("snapshot_notes").insert({
      snapshot_id: snapshotId,
      body: body.trim(),
      user_id: user.id,
      workspace_id: "00000000-0000-0000-0000-000000000001",
    });

    if (error) {
      console.error("Failed to save note:", error.message);
      alert("Failed to save note: " + error.message);
    } else {
      setBody("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Optimistic removal
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    const supabase = createClient();
    const { error } = await supabase.from("snapshot_notes").delete().eq("id", noteId);
    if (error) {
      console.error("Failed to delete note:", error.message);
    }
  };

  if (loading) {
    return <p className="text-[10px] text-zinc-400 animate-pulse">Loading notes...</p>;
  }

  return (
    <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
      {notes.length > 0 && (
        <div className="space-y-1.5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2 text-xs bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-md px-2.5 py-1.5"
            >
              <p className="flex-1 whitespace-pre-wrap">{note.body}</p>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">
                  {new Date(note.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button
                  onClick={(e) => handleDelete(note.id, e)}
                  className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 border rounded-md px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="px-2.5 py-1.5 text-xs rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium disabled:opacity-40"
        >
          {submitting ? "..." : "Post"}
        </button>
      </form>
    </div>
  );
}

