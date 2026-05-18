"use client";

import { useActionState } from "react";
import { addCompetitor } from "./actions";

export default function AddCompetitorForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await addCompetitor(formData);
    },
    null
  );

  return (
    <form action={formAction} className="border rounded-lg p-4 space-y-3 dark:border-zinc-700">
      <h2 className="font-medium">Add Competitor</h2>

      <input
        name="name"
        type="text"
        placeholder="Competitor name *"
        required
        className="w-full border rounded-md px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      <input
        name="homepage_url"
        type="url"
        placeholder="Homepage URL *"
        required
        className="w-full border rounded-md px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      <textarea
        name="notes"
        placeholder="Notes (optional)"
        rows={2}
        className="w-full border rounded-md px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add Competitor"}
      </button>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

