export type TripMemberRole = 'owner' | 'admin' | 'member' | 'agent';
export type TripMemberStatus = 'active' | 'left' | 'removed' | 'invited';

export interface Trip {
  id: string;
  name: string;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: TripMemberRole;
  status: TripMemberStatus;
  joined_at: string;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveTripResult {
  ok: boolean;
  error?: string;
  archived?: boolean;
}

export interface Database {
  public: {
    Tables: {
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip> };
      trip_members: { Row: TripMember; Insert: Partial<TripMember>; Update: Partial<TripMember> };
    };
    Functions: {
      leave_trip: {
        Args: { p_trip_id: string; p_user_id?: string; p_transfer_to_user_id?: string | null };
        Returns: LeaveTripResult;
      };
      user_is_active_trip_member: {
        Args: { p_trip_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
  };
}
