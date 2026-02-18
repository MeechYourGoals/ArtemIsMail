import { useState } from 'react';
import { useLeaveTrip } from '@/hooks/useLeaveTrip';
import { useTripMembers } from '@/hooks/useTripMembers';
import type { TripMember } from '@/types/database';

export interface LeaveTripModalProps {
  tripId: string;
  tripName: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function isSoleAdmin(members: TripMember[], currentUserId: string): boolean {
  const admins = members.filter((m) => m.role === 'owner' || m.role === 'admin');
  return admins.length === 1 && admins[0]!.user_id === currentUserId;
}

function canTransfer(members: TripMember[], currentUserId: string): boolean {
  const others = members.filter((m) => m.user_id !== currentUserId && m.status === 'active');
  return others.length > 0;
}

export function LeaveTripModal({
  tripId,
  tripName,
  currentUserId,
  isOpen,
  onClose,
  onSuccess,
}: LeaveTripModalProps) {
  const [transferToUserId, setTransferToUserId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const leaveTrip = useLeaveTrip();
  const { data: members = [] } = useTripMembers(tripId, { enabled: isOpen });

  const soleAdmin = isSoleAdmin(members, currentUserId);
  const showTransfer = soleAdmin && canTransfer(members, currentUserId);
  const transferCandidates = members.filter(
    (m) => m.user_id !== currentUserId && m.status === 'active'
  );

  const needsTransfer = showTransfer && !transferToUserId;
  const canConfirm = !needsTransfer && confirmText.toLowerCase() === 'leave';

  const handleLeave = async () => {
    if (needsTransfer) return;
    try {
      const result = await leaveTrip.mutateAsync({
        tripId,
        transferToUserId: transferToUserId ?? undefined,
      });
      onClose();
      onSuccess?.();
      if (result.archived) {
        // Trip was archived (last member left) - navigate away if needed
      }
    } catch {
      // Error surfaced via leaveTrip.error
    }
  };

  const handleClose = () => {
    setTransferToUserId(null);
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-trip-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="leave-trip-title" className="text-lg font-semibold text-gray-900 dark:text-white">
          Leave Trip
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to leave &quot;{tripName}&quot;? You will lose access to this trip
          immediately.
        </p>

        {showTransfer && (
          <div className="mt-4">
            <label
              htmlFor="transfer-admin"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              You are the only admin. Transfer admin to:
            </label>
            <select
              id="transfer-admin"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              value={transferToUserId ?? ''}
              onChange={(e) => setTransferToUserId(e.target.value || null)}
              required={showTransfer}
            >
              <option value="">Select a member...</option>
              {transferCandidates.map((m) => (
                <option key={m.id} value={m.user_id}>
                  Member (joined {new Date(m.joined_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="confirm-leave"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Type &quot;leave&quot; to confirm:
          </label>
          <input
            id="confirm-leave"
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="leave"
            autoComplete="off"
          />
        </div>

        {leaveTrip.error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {leaveTrip.error.message}
          </p>
        )}

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
            onClick={handleLeave}
            disabled={!canConfirm || leaveTrip.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {leaveTrip.isPending ? 'Leaving...' : 'Leave Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
