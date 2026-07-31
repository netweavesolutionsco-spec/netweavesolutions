-- ============================================================================
-- Add meeting_link column to project_meetings
-- ----------------------------------------------------------------------------
-- Stores the meeting URL (Google Meet, Zoom, Teams, etc.) provided by clients
-- when scheduling meetings through the client portal.
-- ============================================================================

alter table public.project_meetings
  add column if not exists meeting_link text;

comment on column public.project_meetings.meeting_link is
  'The meeting URL provided by the client (Google Meet, Zoom, Microsoft Teams, etc.)';
