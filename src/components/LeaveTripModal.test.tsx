import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaveTripModal } from './LeaveTripModal';

const mockMutate = vi.fn();

vi.mock('@/hooks/useLeaveTrip', () => ({
  useLeaveTrip: () => ({
    mutateAsync: mockMutate,
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

const mockFetchMembers = vi.fn();

vi.mock('@/hooks/useTripMembers', () => ({
  useTripMembers: (_tripId: string, opts?: { enabled?: boolean }) => {
    if (opts?.enabled === false) return { data: [] };
    return { data: mockFetchMembers() };
  },
}));

function renderModal(props: Partial<React.ComponentProps<typeof LeaveTripModal>> = {}) {
  const queryClient = new QueryClient();
  const defaultProps: React.ComponentProps<typeof LeaveTripModal> = {
    tripId: 'trip-1',
    tripName: 'Test Trip',
    currentUserId: 'user-creator',
    isOpen: true,
    onClose: vi.fn(),
    ...props,
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <LeaveTripModal {...defaultProps} />
    </QueryClientProvider>
  );
}

describe('LeaveTripModal', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockMutate.mockResolvedValue({ ok: true, archived: false });
    mockFetchMembers.mockReturnValue([
      {
        id: 'm1',
        trip_id: 'trip-1',
        user_id: 'user-creator',
        role: 'owner',
        status: 'active',
        joined_at: '2024-01-01',
      },
      {
        id: 'm2',
        trip_id: 'trip-1',
        user_id: 'user-other',
        role: 'member',
        status: 'active',
        joined_at: '2024-01-02',
      },
    ]);
  });

  it('shows confirm modal with trip name', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Leave Trip/ })).toBeInTheDocument();
    expect(screen.getByText(/Test Trip/)).toBeInTheDocument();
  });

  it('requires typing "leave" to confirm', () => {
    mockFetchMembers.mockReturnValue([
      { id: 'm1', user_id: 'user-creator', role: 'member', status: 'active', joined_at: '2024-01-01' },
      { id: 'm2', user_id: 'user-admin', role: 'admin', status: 'active', joined_at: '2024-01-02' },
    ]);
    renderModal();
    const leaveBtn = screen.getByRole('button', { name: /Leave Trip/ });
    expect(leaveBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('leave'), { target: { value: 'leave' } });
    expect(leaveBtn).not.toBeDisabled();
  });

  it('shows transfer admin UI when user is sole admin and others remain', () => {
    mockFetchMembers.mockReturnValue([
      { id: 'm1', user_id: 'user-creator', role: 'owner', status: 'active', joined_at: '2024-01-01' },
      { id: 'm2', user_id: 'user-other', role: 'member', status: 'active', joined_at: '2024-01-02' },
    ]);
    renderModal();
    expect(screen.getByText(/Transfer admin to/)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not show transfer when user is not sole admin', () => {
    mockFetchMembers.mockReturnValue([
      { id: 'm1', user_id: 'user-creator', role: 'member', status: 'active', joined_at: '2024-01-01' },
      { id: 'm2', user_id: 'user-admin', role: 'admin', status: 'active', joined_at: '2024-01-02' },
    ]);
    renderModal();
    expect(screen.queryByText(/Transfer admin to/)).not.toBeInTheDocument();
  });

  it('calls leaveTrip with transferToUserId when transfer selected', async () => {
    mockFetchMembers.mockReturnValue([
      { id: 'm1', user_id: 'user-creator', role: 'owner', status: 'active', joined_at: '2024-01-01' },
      { id: 'm2', user_id: 'user-other', role: 'member', status: 'active', joined_at: '2024-01-02' },
    ]);
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'user-other' } });
    fireEvent.change(screen.getByPlaceholderText('leave'), { target: { value: 'leave' } });
    fireEvent.click(screen.getByRole('button', { name: /Leave Trip/ }));

    expect(mockMutate).toHaveBeenCalledWith({
      tripId: 'trip-1',
      transferToUserId: 'user-other',
    });
  });
});
