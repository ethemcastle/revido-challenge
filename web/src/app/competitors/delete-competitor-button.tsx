"use client";

import { deleteCompetitor } from "./actions";
import { useState } from "react";

export default function DeleteCompetitorButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Remove this competitor?")) return;
    setLoading(true);
    await deleteCompetitor(id);
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {loading ? "..." : "Remove"}
    </button>
  );
}

