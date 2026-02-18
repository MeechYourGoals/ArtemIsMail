import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TripMember } from '@/types/database';

async function fetchTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TripMember[];
}

export function useTripMembers(tripId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['tripMembers', tripId],
    queryFn: () => fetchTripMembers(tripId!),
    enabled: !!tripId && (options?.enabled ?? true),
  });
}
