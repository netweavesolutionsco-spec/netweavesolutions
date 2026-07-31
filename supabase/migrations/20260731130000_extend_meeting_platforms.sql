-- ============================================================================
-- Extend project_meetings platform options
-- ----------------------------------------------------------------------------
-- Widen the meeting platform set to also allow Google Calendar and Phone Call
-- so the client can pick, and the Admin Panel can display, every supported
-- platform. Existing values remain valid.
-- ============================================================================

alter table public.project_meetings
  drop constraint if exists project_meetings_platform_check;
alter table public.project_meetings
  add constraint project_meetings_platform_check
  check (platform is null or platform in (
    'google_meet', 'microsoft_teams', 'zoom', 'google_calendar', 'phone_call', 'other'
  ));

comment on column public.project_meetings.platform is
  'Meeting platform requested by the client: google_meet | microsoft_teams | zoom | google_calendar | phone_call | other.';
