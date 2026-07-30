-- Trim the CMS social object to the only platform rendered on the public site
-- (Instagram). Twitter, LinkedIn and GitHub were never surfaced in the footer,
-- so they are removed from both the draft (`data`) and published
-- (`published_data`) JSON of the singleton settings row. All other keys are
-- preserved — only the unused social sub-keys are stripped.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'site_content'
  ) then
    update public.site_content
    set
      data = case
        when jsonb_typeof(data->'social') = 'object'
          then jsonb_set(data, '{social}', (data->'social') - 'twitter' - 'linkedin' - 'github')
        else data
      end,
      published_data = case
        when jsonb_typeof(published_data->'social') = 'object'
          then jsonb_set(published_data, '{social}', (published_data->'social') - 'twitter' - 'linkedin' - 'github')
        else published_data
      end,
      updated_at = now()
    where id = 'main';
  end if;
end $$;
