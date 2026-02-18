import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { LeaveTripResult } from '@/types/database';

export interface LeaveTripOptions {
  tripId: string;
  transferToUserId?: string | null;
}

async function leaveTripRpc(options: LeaveTripOptions): Promise<LeaveTripResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.rpc('leave_trip', {
    p_trip_id: options.tripId,
    p_transfer_to_user_id: options.transferToUserId ?? null,
  } as any);

  if (error) {
    throw new Error(error.message);
  }

  const result = data as LeaveTripResult;
  if (!result.ok) {
    throw new Error(result.error ?? 'Failed to leave trip');
  }

  return result;
}

export function useLeaveTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveTripRpc,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ['tripMembers', variables.tripId] });
    },
  });
}
