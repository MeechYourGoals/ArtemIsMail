# Trip Persistence After Creator Leaves – Deliverables

## Summary

Trips persist when the creator leaves. Leaving soft-deletes only the user's membership (`status = 'left'`). Trip record, other members, chats, calendar, tasks, polls, places, media remain intact.

---

## Files Changed (with rationale)

| File | Rationale |
|------|-----------|
| `supabase/migrations/20250218000001_trip_persistence_after_creator_leaves.sql` | Migration: trip_members with status/left_at, archived_at on trips, leave_trip() function |
| `supabase/migrations/20250218000002_trip_persistence_rls.sql` | RLS: membership-based access, not created_by alone |
| `src/lib/supabase.ts` | Supabase client |
| `src/types/database.ts` | Trip, TripMember, LeaveTripResult types |
| `src/hooks/useLeaveTrip.ts` | leaveTrip mutation calling leave_trip RPC |
| `src/hooks/useTripMembers.ts` | Fetch active trip members |
| `src/hooks/useCurrentUser.ts` | Current auth user |
| `src/components/LeaveTripModal.tsx` | Confirm modal, transfer-admin UI |
| `src/components/LeaveTripButton.tsx` | Entry point for Leave Trip flow |
| `src/components/DeleteTripModal.tsx` | Explicit "Delete Trip" with confirm text (elevated permission) |
| `src/hooks/useLeaveTrip.test.ts` | Unit tests for leaveTrip |
| `src/components/LeaveTripModal.test.tsx` | Unit tests for modal/transfer flow |
| `tests/regression/creator_leaves_trip_persists.test.ts` | Regression test placeholder |

---

## Migration SQL

**Migration 1** (`20250218000001_trip_persistence_after_creator_leaves.sql`):
- Creates `trips` if missing (with `archived_at`)
- Creates `trip_members` with `status`, `left_at`, `role`
- Adds `archived_at` to trips
- `leave_trip(p_trip_id, p_user_id, p_transfer_to_user_id)` – soft-delete membership, archive if last member, auto-promote admin
- `user_is_active_trip_member(p_trip_id, p_user_id)` – RLS helper

**Migration 2** (`20250218000002_trip_persistence_rls.sql`):
- RLS on `trips`: SELECT by active membership or creator (bootstrap) or former member (archived)
- RLS on `trip_members`: SELECT by active membership or own row
- UPDATE/DELETE policies for admins
- Template policies for `messages`, `calendar_events`, `tasks` (if tables exist)

---

## RLS Policies

- **trips_select_members**: Active member, creator (bootstrap), or former member (archived) can SELECT
- **trips_update_active_member**: Active member can UPDATE
- **trips_delete**: Only admin/owner can DELETE (explicit "Delete Trip")
- **trip_members_select**: Active member of trip or own row
- **trip_members_update**: Own row (for leave) or admin
- **trip_members_delete**: Admin only (optional; we prefer soft-delete)

---

## Frontend Changes

- **LeaveTripButton**: Renders "Leave Trip" and opens modal
- **LeaveTripModal**: Confirm text "leave", transfer-admin dropdown when sole admin, calls `leave_trip` RPC
- **useLeaveTrip**: Mutation that invalidates trips/tripMembers queries on success

---

## Tests

### Run

```bash
npm install
npm test
```

### Unit tests

- `useLeaveTrip.test.ts`: RPC args, ok/error handling, creator leaves (archived: false), last member (archived: true)
- `LeaveTripModal.test.tsx`: Confirm flow, transfer UI when sole admin, no transfer when not admin

### Regression

- `creator_leaves_trip_persists.test.ts`: Documents expected behavior; full RLS tests require Supabase.

---

## Edge Cases Handled

1. **Last member leaves**: Trip gets `archived_at`; no deletion
2. **Sole admin leaves**: Auto-promote longest-tenured member OR require transfer (we use transfer UI)
3. **Malicious nuke**: Leaving never deletes; explicit "Delete Trip" with admin + confirm required
4. **Remaining members**: Access via `user_is_active_trip_member`; no "Trip deleted" for them

---

## Apply Migrations

```bash
supabase db push
# or
supabase migration up
```
