-- ============================================================================
-- Enable Supabase Realtime for notification feeds
-- ----------------------------------------------------------------------------
-- The Admin Panel (AdminUIContext) subscribes to a postgres_changes channel on
-- public.admin_notifications so the bell + drawer update instantly, with no page
-- refresh. That subscription silently delivered nothing because the table was
-- never added to the `supabase_realtime` publication — realtime only streams
-- changes for tables in that publication. This migration fixes that.
--
-- REPLICA IDENTITY FULL makes UPDATE/DELETE events carry the full old row so the
-- client can reconcile (e.g. a read_at flip or a delete) rather than only the
-- primary key. admin_notifications rows are small, so the WAL cost is negligible.
--
-- client_notifications is added too for completeness. The client portal itself
-- polls via the backend (portal clients hold no browser Supabase session, so
-- RLS-scoped realtime cannot authorise them), but staff tooling and future
-- surfaces can rely on the stream being available.
-- ============================================================================

alter table public.admin_notifications replica identity full;
alter table public.client_notifications replica identity full;

do $$
begin
  -- add_table is idempotent-unfriendly across reruns, so guard each add.
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_notifications'
  ) then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'client_notifications'
  ) then
    alter publication supabase_realtime add table public.client_notifications;
  end if;
end
$$;
