-- =============================================================================
-- RLS Policies: Membership-based access (NOT created_by alone)
-- Remaining members retain access after creator leaves.
-- =============================================================================

-- Enable RLS on trips and trip_members
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- trips: access based on active membership
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "trips_select_active_member" ON public.trips;
DROP POLICY IF EXISTS "trips_select_members" ON public.trips;
-- Trips: SELECT - active members OR creator (bootstrap) OR former members (archived retention)
CREATE POLICY "trips_select_members" ON public.trips
  FOR SELECT
  USING (
    public.user_is_active_trip_member(id, auth.uid())
    OR (created_by = auth.uid() AND archived_at IS NULL)
    OR (
      archived_at IS NOT NULL
      AND EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trips.id AND user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "trips_insert" ON public.trips;
CREATE POLICY "trips_insert" ON public.trips
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trips_update_active_member" ON public.trips;
CREATE POLICY "trips_update_active_member" ON public.trips
  FOR UPDATE
  USING (public.user_is_active_trip_member(id, auth.uid()))
  WITH CHECK (public.user_is_active_trip_member(id, auth.uid()));

-- Delete: only with explicit "Delete Trip" - require admin/owner
DROP POLICY IF EXISTS "trips_delete" ON public.trips;
CREATE POLICY "trips_delete" ON public.trips
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_id = trips.id AND user_id = auth.uid() AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- trip_members: members can read active members of their trips
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "trip_members_select" ON public.trip_members;
CREATE POLICY "trip_members_select" ON public.trip_members
  FOR SELECT
  USING (
    public.user_is_active_trip_member(trip_id, auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "trip_members_insert" ON public.trip_members;
CREATE POLICY "trip_members_insert" ON public.trip_members
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins/owners can update (e.g. change role); user can update own row for leave
DROP POLICY IF EXISTS "trip_members_update" ON public.trip_members;
CREATE POLICY "trip_members_update" ON public.trip_members
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_members.trip_id AND tm.user_id = auth.uid()
        AND tm.status = 'active' AND tm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "trip_members_delete" ON public.trip_members;
-- No direct DELETE policy - we use soft-delete (status=left) via leave_trip function
-- Only allow delete for admins (e.g. remove member) - optional
CREATE POLICY "trip_members_delete" ON public.trip_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_members.trip_id AND tm.user_id = auth.uid()
        AND tm.status = 'active' AND tm.role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- Child tables (messages, calendar_events, tasks, etc.) - template policies
-- Apply similar pattern: access via user_is_active_trip_member(trip_id, auth.uid())
-- -----------------------------------------------------------------------------
-- Example for messages (if table exists):
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "messages_trip_member" ON public.messages;
    CREATE POLICY "messages_trip_member" ON public.messages
      FOR ALL
      USING (public.user_is_active_trip_member(trip_id, auth.uid()))
      WITH CHECK (public.user_is_active_trip_member(trip_id, auth.uid()));
  END IF;
END $$;

-- Example for calendar_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN
    ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "calendar_events_trip_member" ON public.calendar_events;
    CREATE POLICY "calendar_events_trip_member" ON public.calendar_events
      FOR ALL
      USING (public.user_is_active_trip_member(trip_id, auth.uid()))
      WITH CHECK (public.user_is_active_trip_member(trip_id, auth.uid()));
  END IF;
END $$;

-- Example for tasks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tasks_trip_member" ON public.tasks;
    CREATE POLICY "tasks_trip_member" ON public.tasks
      FOR ALL
      USING (public.user_is_active_trip_member(trip_id, auth.uid()))
      WITH CHECK (public.user_is_active_trip_member(trip_id, auth.uid()));
  END IF;
END $$;
