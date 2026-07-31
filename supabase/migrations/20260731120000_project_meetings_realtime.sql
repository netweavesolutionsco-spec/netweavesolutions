-- ============================================================================
-- Enable Supabase Realtime for project_meetings
-- ----------------------------------------------------------------------------
-- The Admin Panel (MeetingRequestsPage) subscribes to a postgres_changes channel
-- on public.project_meetings so new client meeting requests and status changes
-- appear instantly, with no page refresh. Realtime only streams changes for
-- tables in the `supabase_realtime` publication, so the table must be added to
-- it. Admin/editor RLS already grants SELECT on all rows, so RLS-scoped realtime
-- authorises staff subscribers.
--
-- REPLICA IDENTITY FULL makes UPDATE/DELETE events carry the full old row so the
-- client can reconcile changes rather than only the primary key.
-- ============================================================================

alter table public.project_meetings replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_meetings'
  ) then
    alter publication supabase_realtime add table public.project_meetings;
  end if;
end
$$;
