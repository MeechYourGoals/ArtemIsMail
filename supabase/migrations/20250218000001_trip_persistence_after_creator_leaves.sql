-- =============================================================================
-- Trip Persistence After Creator Leaves
-- Ensures trips persist when creator leaves; no cascades from membership changes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Create trips table if not exists (must exist before trip_members)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips') THEN
    CREATE TABLE public.trips (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      archived_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Add archived_at to existing trips
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'archived_at') THEN
      ALTER TABLE public.trips ADD COLUMN archived_at timestamptz;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Create/alter trip_members table with status and left_at
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_members') THEN
    CREATE TABLE public.trip_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'agent')),
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed', 'invited')),
      joined_at timestamptz NOT NULL DEFAULT now(),
      left_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(trip_id, user_id)
    );
    CREATE INDEX idx_trip_members_trip_id ON public.trip_members(trip_id);
    CREATE INDEX idx_trip_members_user_id ON public.trip_members(user_id);
    CREATE INDEX idx_trip_members_status ON public.trip_members(trip_id, status) WHERE status = 'active';
  END IF;
END $$;

-- Add status and left_at if table exists but columns are missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_members') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trip_members' AND column_name = 'status') THEN
      ALTER TABLE public.trip_members ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed', 'invited'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trip_members' AND column_name = 'left_at') THEN
      ALTER TABLE public.trip_members ADD COLUMN left_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trip_members' AND column_name = 'role') THEN
      ALTER TABLE public.trip_members ADD COLUMN role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'agent'));
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Remove dangerous ON DELETE CASCADE from trip-dependent tables
-- Replace with ON DELETE RESTRICT or SET NULL where appropriate.
-- Trips should NOT be deleted when a user leaves; only membership row changes.
-- -----------------------------------------------------------------------------
-- Note: We do NOT cascade from trips -> trip_members when a user leaves.
-- User "leaving" = updating trip_members.status to 'left', NOT deleting the trip.
-- The FK trips -> trip_members: trip_id in trip_members references trips.
-- When TRIP is deleted (explicit delete), we may cascade trip_members - that's fine.
-- When USER leaves, we only update trip_members row - no cascade involved.

-- Audit and fix: child tables of trips (messages, calendar_events, tasks, etc.)
-- These should reference trip_id and CASCADE when TRIP is deleted (explicit delete).
-- They should NOT depend on created_by or owner for existence.

-- Example pattern for tables that reference trips:
-- ON DELETE CASCADE from trips -> X means: when trip is deleted, delete X. (OK)
-- ON DELETE CASCADE from users -> trips would be bad (user delete nukes trips). We avoid that.

-- Ensure trip_members does NOT cascade from user_id in a way that deletes the trip.
-- trip_members.user_id -> auth.users: when user is deleted, we may want to soft-delete membership.
-- For now we keep ON DELETE CASCADE on user_id: if user account is deleted, their membership row goes.
-- That does NOT delete the trip - only the membership row.

-- -----------------------------------------------------------------------------
-- 3. Function: leave_trip - soft-delete membership, handle last-member/transfer
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_trip(
  p_trip_id uuid,
  p_user_id uuid DEFAULT auth.uid(),
  p_transfer_to_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member record;
  v_active_count int;
  v_admin_count int;
  v_new_admin_id uuid;
  v_is_last_member boolean;
BEGIN
  -- Get current membership
  SELECT * INTO v_member
  FROM trip_members
  WHERE trip_id = p_trip_id AND user_id = p_user_id AND status = 'active';

  IF v_member IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not a member or already left');
  END IF;

  -- Count active members
  SELECT count(*) INTO v_active_count
  FROM trip_members
  WHERE trip_id = p_trip_id AND status = 'active';

  IF v_active_count <= 1 THEN
    -- Last member: archive trip (Option A)
    UPDATE trips SET archived_at = now(), updated_at = now() WHERE id = p_trip_id;
    UPDATE trip_members SET status = 'left', left_at = now(), updated_at = now()
    WHERE trip_id = p_trip_id AND user_id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'archived', true);
  END IF;

  -- Count admins/owners
  SELECT count(*) INTO v_admin_count
  FROM trip_members
  WHERE trip_id = p_trip_id AND status = 'active' AND role IN ('owner', 'admin');

  -- If leaving user is admin/owner and is the ONLY admin/owner
  IF v_member.role IN ('owner', 'admin') AND v_admin_count <= 1 THEN
    IF p_transfer_to_user_id IS NOT NULL THEN
      -- Explicit transfer: promote target to admin
      UPDATE trip_members SET role = 'admin', updated_at = now()
      WHERE trip_id = p_trip_id AND user_id = p_transfer_to_user_id AND status = 'active';
      IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Transfer target not found or not active');
      END IF;
    ELSE
      -- No transfer: promote longest-tenured active member to admin
      SELECT user_id INTO v_new_admin_id
      FROM trip_members
      WHERE trip_id = p_trip_id AND status = 'active' AND user_id != p_user_id
      ORDER BY joined_at ASC
      LIMIT 1;
      IF v_new_admin_id IS NOT NULL THEN
        UPDATE trip_members SET role = 'admin', updated_at = now()
        WHERE trip_id = p_trip_id AND user_id = v_new_admin_id;
      END IF;
    END IF;
  END IF;

  -- Soft-delete membership
  UPDATE trip_members
  SET status = 'left', left_at = now(), updated_at = now()
  WHERE trip_id = p_trip_id AND user_id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'archived', false);
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Function: user_is_active_trip_member - helper for RLS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_is_active_trip_member(p_trip_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id AND user_id = p_user_id AND status = 'active'
  );
$$;

COMMENT ON FUNCTION public.leave_trip IS 'Soft-deletes membership (status=left). Archives trip if last member. Auto-promotes admin if sole admin leaves.';
COMMENT ON FUNCTION public.user_is_active_trip_member IS 'Returns true if user has active membership in trip.';
