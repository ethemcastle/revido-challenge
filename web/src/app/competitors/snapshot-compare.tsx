"use client";

import { useState } from "react";
import { diffLines, Change } from "diff";
import { useSnapshots, Snapshot } from "@/hooks/use-snapshots";

export default function SnapshotCompare({ competitorId }: { competitorId: string }) {
  const { snapshots, loading } = useSnapshots(competitorId);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [view, setView] = useState<"side" | "diff">("diff");

  const completed = snapshots.filter((s) => s.status === "completed");

  if (loading) {
    return <p className="text-xs text-zinc-400 animate-pulse">Loading...</p>;
  }

  if (completed.length < 2) {
    return (
      <p className="text-xs text-zinc-400">
        Need at least 2 completed snapshots to compare. ({completed.length} available)
      </p>
    );
  }

  const snapshotA = completed.find((s) => s.id === selectedA) ?? null;
  const snapshotB = completed.find((s) => s.id === selectedB) ?? null;

  const formatDate = (s: Snapshot) =>
    new Date(s.created_at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const toMarkdown = (snapshot: Snapshot | null): string => {
    if (!snapshot?.content) return "";
    const c = snapshot.content as Record<string, unknown>;
    const lines: string[] = [];
    if (c.title) lines.push(`# ${c.title}`, "");
    if (c.description) lines.push(c.description as string, "");
    lines.push(`- **Status:** ${c.status_code}`);
    lines.push(`- **Size:** ${((c.content_length as number) / 1024).toFixed(1)} KB`);
    lines.push(`- **Fetched:** ${c.fetched_at}`);
    return lines.join("\n");
  };

  const textA = toMarkdown(snapshotA);
  const textB = toMarkdown(snapshotB);
  const changes: Change[] = textA && textB ? diffLines(textA, textB) : [];

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Snapshot A (older)</label>
          <select
            value={selectedA ?? ""}
            onChange={(e) => setSelectedA(e.target.value || null)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">Select snapshot...</option>
            {completed.map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === selectedB}>
                {formatDate(s)} — {String((s.content as Record<string, unknown>)?.title || "Untitled")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Snapshot B (newer)</label>
          <select
            value={selectedB ?? ""}
            onChange={(e) => setSelectedB(e.target.value || null)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">Select snapshot...</option>
            {completed.map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === selectedA}>
                {formatDate(s)} — {String((s.content as Record<string, unknown>)?.title || "Untitled")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View toggle */}
      {snapshotA && snapshotB && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setView("diff")}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${view === "diff" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              Unified Diff
            </button>
            <button
              onClick={() => setView("side")}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${view === "side" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              Side by Side
            </button>
          </div>

          {view === "diff" ? (
            <DiffView changes={changes} />
          ) : (
            <SideBySideView textA={textA} textB={textB} />
          )}
        </>
      )}
    </div>
  );
}

function DiffView({ changes }: { changes: Change[] }) {
  return (
    <div className="border rounded-lg overflow-hidden dark:border-zinc-800 font-mono text-xs">
      <div className="bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-400 border-b dark:border-zinc-800">
        <span className="text-red-500">— removed</span>
        <span className="mx-2">·</span>
        <span className="text-green-500">+ added</span>
      </div>
      <pre className="p-3 overflow-x-auto max-h-[300px] overflow-y-auto">
        {changes.map((change, i) => {
          const lines = change.value.split("\n").filter((_, idx, arr) =>
            idx < arr.length - 1 || arr[idx] !== ""
          );
          return lines.map((line, j) => (
            <div
              key={`${i}-${j}`}
              className={`px-2 py-0.5 rounded-sm ${
                change.added
                  ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                  : change.removed
                  ? "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span className="select-none mr-2 text-zinc-300 dark:text-zinc-600">
                {change.added ? "+" : change.removed ? "−" : " "}
              </span>
              {line}
            </div>
          ));
        })}
      </pre>
    </div>
  );
}

function SideBySideView({ textA, textB }: { textA: string; textB: string }) {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");
  const maxLines = Math.max(linesA.length, linesB.length);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="border rounded-lg dark:border-zinc-800 overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] font-medium text-zinc-500 border-b dark:border-zinc-800">
          Snapshot A
        </div>
        <pre className="p-3 text-xs font-mono overflow-x-auto max-h-[250px] overflow-y-auto">
          {Array.from({ length: maxLines }, (_, i) => (
            <div key={i} className={`py-0.5 ${linesA[i] !== linesB[i] ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}>
              {linesA[i] ?? ""}
            </div>
          ))}
        </pre>
      </div>
      <div className="border rounded-lg dark:border-zinc-800 overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] font-medium text-zinc-500 border-b dark:border-zinc-800">
          Snapshot B
        </div>
        <pre className="p-3 text-xs font-mono overflow-x-auto max-h-[250px] overflow-y-auto">
          {Array.from({ length: maxLines }, (_, i) => (
            <div key={i} className={`py-0.5 ${linesA[i] !== linesB[i] ? "bg-green-50/50 dark:bg-green-950/20" : ""}`}>
              {linesB[i] ?? ""}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
