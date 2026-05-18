import Modal from "./modal";
import type { Competitor } from "@/types";

const inputClass = "w-full border rounded-lg px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10";
const btnPrimary = "px-4 py-1.5 text-sm rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium disabled:opacity-50 shadow-sm";
const btnSecondary = "px-3 py-1.5 text-sm rounded-lg border dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors";

export function AddModal({
  onClose,
  onSubmit,
  pending,
  error,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  error: string;
}) {
  return (
    <Modal open={true} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Add Competitor</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Name</label>
          <input name="name" placeholder="e.g. Acme Corp" required className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Homepage URL</label>
          <input name="homepage_url" type="url" placeholder="https://example.com" required className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Notes (optional)</label>
          <textarea name="notes" placeholder="Anything worth noting..." rows={2} className={inputClass} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditModal({
  competitor,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  competitor: Competitor;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  error: string;
}) {
  return (
    <Modal open={true} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Edit Competitor</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Name</label>
          <input name="name" defaultValue={competitor.name} required className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Homepage URL</label>
          <input name="homepage_url" type="url" defaultValue={competitor.homepage_url} required className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 mb-1 block">Notes (optional)</label>
          <textarea name="notes" defaultValue={competitor.notes ?? ""} rows={2} className={inputClass} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteModal({
  competitor,
  onClose,
  onConfirm,
  pending,
}: {
  competitor: Competitor;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Modal open={true} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-2">Remove Competitor</h2>
      <p className="text-sm text-zinc-500 mb-5">
        Remove <strong className="text-zinc-900 dark:text-zinc-100">{competitor.name}</strong>? This can&apos;t be undone.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>Cancel</button>
        <button onClick={onConfirm} disabled={pending} className="px-4 py-1.5 text-sm rounded-lg bg-red-600 text-white font-medium disabled:opacity-50 shadow-sm">
          {pending ? "Removing..." : "Remove"}
        </button>
      </div>
    </Modal>
  );
}



