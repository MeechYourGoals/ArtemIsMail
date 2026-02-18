import { useState } from 'react';

export interface DeleteTripModalProps {
  tripId: string;
  tripName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tripId: string) => Promise<void>;
  isDeleting?: boolean;
}

const CONFIRM_TEXT = 'delete trip';

export function DeleteTripModal({
  tripId,
  tripName,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteTripModalProps) {
  const [confirmText, setConfirmText] = useState('');

  const canConfirm = confirmText.toLowerCase() === CONFIRM_TEXT;

  const handleDelete = async () => {
    if (!canConfirm || isDeleting) return;
    await onConfirm(tripId);
    setConfirmText('');
    onClose();
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-trip-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-trip-title" className="text-lg font-semibold text-red-600 dark:text-red-400">
          Delete Trip
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          This will permanently delete &quot;{tripName}&quot; and all its data. This action cannot
          be undone.
        </p>
        <div className="mt-4">
          <label
            htmlFor="confirm-delete"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Type &quot;{CONFIRM_TEXT}&quot; to confirm:
          </label>
          <input
            id="confirm-delete"
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_TEXT}
            autoComplete="off"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canConfirm || isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
