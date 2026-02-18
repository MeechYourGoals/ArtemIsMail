import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LeaveTripModal } from './LeaveTripModal';

export interface LeaveTripButtonProps {
  tripId: string;
  tripName: string;
  className?: string;
  onSuccess?: () => void;
}

export function LeaveTripButton({ tripId, tripName, className, onSuccess }: LeaveTripButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useCurrentUser();

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className ?? 'text-sm text-red-600 hover:text-red-700 dark:text-red-400'}
        aria-label="Leave trip"
      >
        Leave Trip
      </button>
      <LeaveTripModal
        tripId={tripId}
        tripName={tripName}
        currentUserId={user.id}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}
