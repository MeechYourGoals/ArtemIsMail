import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeaveTrip } from './useLeaveTrip';

const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useLeaveTrip', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('calls leave_trip RPC with tripId', async () => {
    mockRpc.mockResolvedValue({ data: { ok: true, archived: false }, error: null });

    const { result } = renderHook(() => useLeaveTrip(), { wrapper });

    result.current.mutate({ tripId: 'trip-123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRpc).toHaveBeenCalledWith('leave_trip', {
      p_trip_id: 'trip-123',
      p_transfer_to_user_id: null,
    });
  });

  it('passes transferToUserId when provided', async () => {
    mockRpc.mockResolvedValue({ data: { ok: true, archived: false }, error: null });

    const { result } = renderHook(() => useLeaveTrip(), { wrapper });

    result.current.mutate({
      tripId: 'trip-123',
      transferToUserId: 'user-456',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRpc).toHaveBeenCalledWith('leave_trip', {
      p_trip_id: 'trip-123',
      p_transfer_to_user_id: 'user-456',
    });
  });

  it('throws when RPC returns ok: false', async () => {
    mockRpc.mockResolvedValue({
      data: { ok: false, error: 'Not a member' },
      error: null,
    });

    const { result } = renderHook(() => useLeaveTrip(), { wrapper });

    result.current.mutate({ tripId: 'trip-123' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toContain('Not a member');
  });

  it('creator leaves, other members remain - trip persists (RPC returns ok)', async () => {
    mockRpc.mockResolvedValue({ data: { ok: true, archived: false }, error: null });

    const { result } = renderHook(() => useLeaveTrip(), { wrapper });

    result.current.mutate({ tripId: 'trip-creator-leaves' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ ok: true, archived: false });
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('last member leaves - trip archived', async () => {
    mockRpc.mockResolvedValue({ data: { ok: true, archived: true }, error: null });

    const { result } = renderHook(() => useLeaveTrip(), { wrapper });

    result.current.mutate({ tripId: 'trip-last-member' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ ok: true, archived: true });
  });
});
