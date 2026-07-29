-- =====================================================================
-- Customer auth hardening: roles + profile fields
-- =====================================================================
-- Context: the client portal already has a working auth system built on
-- Supabase Auth, a `profiles` table, a `user_roles` table and the
-- `app_role` enum (admin / editor / viewer). This migration EXTENDS that
-- system without duplicating it:
--   1. Adds the customer-facing roles `customer` and `manager` to app_role.
--   2. Adds the profile columns the registration form now collects, plus
--      lightweight account bookkeeping (status, login_count, last_login).
-- It creates NO new tables and touches NO existing policies, so the admin
-- panel, existing portal and current auth flow keep working unchanged.
-- =====================================================================

-- 1) New role values. ADD VALUE IF NOT EXISTS is idempotent and safe to
--    re-run. The values are only *added* here (not used in this migration),
--    which satisfies Postgres' "can't use a new enum value in the same
--    transaction it was created" rule.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- 2) Profile columns for the extended registration form + account state.
--    All are nullable or have safe defaults so existing rows stay valid.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp          text,
  ADD COLUMN IF NOT EXISTS country_code      text,
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status            text    NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS login_count       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login        timestamptz;

-- Guard the status column against typos / unexpected values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('active', 'suspended', 'pending'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.whatsapp IS 'WhatsApp number (may differ from phone)';
COMMENT ON COLUMN public.profiles.country_code IS 'Dialing code captured at registration, e.g. +91';
COMMENT ON COLUMN public.profiles.newsletter_opt_in IS 'Whether the customer opted into the newsletter';
COMMENT ON COLUMN public.profiles.status IS 'Account state: active | suspended | pending';
COMMENT ON COLUMN public.profiles.login_count IS 'Number of successful password logins';
COMMENT ON COLUMN public.profiles.last_login IS 'Timestamp of the most recent successful login';
