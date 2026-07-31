-- Update the "Meet Our Core Team" section to the current four members.
-- The public About page reads team data from site_content row 'col_team'
-- (falling back to the code default in frontend/src/data/team.ts when the
-- row is absent). This migration upserts the row so any previously
-- CMS-published/stale team list is corrected in the database, keeping the
-- names stable across refresh, rebuild, redeploy and login.
do $$
declare
  team_items jsonb := '[
    { "name": "Siddharth Kumar", "initials": "SK" },
    { "name": "Anish Kumar",     "initials": "AK" },
    { "name": "Shivam Kumar",    "initials": "SK" },
    { "name": "Geetanshu",       "initials": "GE" }
  ]'::jsonb;
  team_payload jsonb := jsonb_build_object('items', team_items);
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'site_content'
  ) then
    insert into public.site_content (id, data, published_data)
    values ('col_team', team_payload, team_payload)
    on conflict (id) do update
      set data = excluded.data,
          published_data = excluded.published_data,
          updated_at = now();
  end if;
end $$;
