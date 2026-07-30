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
        when jsonb_typeof(data->'items') = 'array' then jsonb_set(
          data,
          '{items}',
          (
            select coalesce(jsonb_agg(item), '[]'::jsonb)
            from jsonb_array_elements(data->'items') as item
            where coalesce(item->>'slug', '') not in ('seo-digital-marketing', 'devops-integrations')
          )
        )
        else data
      end,
      published_data = case
        when jsonb_typeof(published_data->'items') = 'array' then jsonb_set(
          published_data,
          '{items}',
          (
            select coalesce(jsonb_agg(item), '[]'::jsonb)
            from jsonb_array_elements(published_data->'items') as item
            where coalesce(item->>'slug', '') not in ('seo-digital-marketing', 'devops-integrations')
          )
        )
        else published_data
      end,
      updated_at = now()
    where id = 'col_services';

    update public.site_content
    set
      data = case
        when jsonb_typeof(data->'items') = 'array' then jsonb_set(
          data,
          '{items}',
          (
            select coalesce(jsonb_agg(
              case
                when jsonb_typeof(plan->'features') = 'array' then jsonb_set(
                  plan,
                  '{features}',
                  (
                    select coalesce(jsonb_agg(to_jsonb(feature)), '[]'::jsonb)
                    from jsonb_array_elements_text(plan->'features') as feature
                    where feature !~* '(seo|payment gateway|ai chatbot|ai integration|devops|integration)'
                  )
                )
                else plan
              end
            ), '[]'::jsonb)
            from jsonb_array_elements(data->'items') as plan
          )
        )
        else data
      end,
      published_data = case
        when jsonb_typeof(published_data->'items') = 'array' then jsonb_set(
          published_data,
          '{items}',
          (
            select coalesce(jsonb_agg(
              case
                when jsonb_typeof(plan->'features') = 'array' then jsonb_set(
                  plan,
                  '{features}',
                  (
                    select coalesce(jsonb_agg(to_jsonb(feature)), '[]'::jsonb)
                    from jsonb_array_elements_text(plan->'features') as feature
                    where feature !~* '(seo|payment gateway|ai chatbot|ai integration|devops|integration)'
                  )
                )
                else plan
              end
            ), '[]'::jsonb)
            from jsonb_array_elements(published_data->'items') as plan
          )
        )
        else published_data
      end,
      updated_at = now()
    where id = 'col_pricing';

    update public.site_content
    set
      data = case
        when jsonb_typeof(data->'items') = 'array' then jsonb_set(
          data,
          '{items}',
          (
            select coalesce(jsonb_agg(item), '[]'::jsonb)
            from jsonb_array_elements(data->'items') as item
            where coalesce(item->>'slug', '') <> 'seo-fundamentals-2026'
              and coalesce(item->>'category', '') <> 'Growth'
          )
        )
        else data
      end,
      published_data = case
        when jsonb_typeof(published_data->'items') = 'array' then jsonb_set(
          published_data,
          '{items}',
          (
            select coalesce(jsonb_agg(item), '[]'::jsonb)
            from jsonb_array_elements(published_data->'items') as item
            where coalesce(item->>'slug', '') <> 'seo-fundamentals-2026'
              and coalesce(item->>'category', '') <> 'Growth'
          )
        )
        else published_data
      end,
      updated_at = now()
    where id = 'col_blog';

    update public.site_content
    set
      data = case
        when jsonb_typeof(data->'items') = 'array' then jsonb_set(
          data,
          '{items}',
          (
            select coalesce(jsonb_agg(item), '[]'::jsonb)
            from jsonb_array_elements(data->'items') as item
            where coalesce(item->>'slug', '') not in ('devops-engineer', 'growth-marketer')
          )
        )
        else data
      end,
      published_data = case
        when jsonb_typeof(published_data->'items') = 'array' then jsonb_set(
          published_data,
          '{items}',
          (
            select coalesce(jsonb_agg(item), '[]'::jsonb)
            from jsonb_array_elements(published_data->'items') as item
            where coalesce(item->>'slug', '') not in ('devops-engineer', 'growth-marketer')
          )
        )
        else published_data
      end,
      updated_at = now()
    where id = 'col_jobs';

    update public.site_content
    set
      data = case
        when jsonb_typeof(data->'items') = 'array' then jsonb_set(
          data,
          '{items}',
          (
            select coalesce(jsonb_agg(
              case
                when item->>'role' = 'Growth Lead' then jsonb_set(
                  item,
                  '{role}',
                  to_jsonb('Client Success Lead'::text)
                )
                else item
              end
            ), '[]'::jsonb)
            from jsonb_array_elements(data->'items') as item
          )
        )
        else data
      end,
      published_data = case
        when jsonb_typeof(published_data->'items') = 'array' then jsonb_set(
          published_data,
          '{items}',
          (
            select coalesce(jsonb_agg(
              case
                when item->>'role' = 'Growth Lead' then jsonb_set(
                  item,
                  '{role}',
                  to_jsonb('Client Success Lead'::text)
                )
                else item
              end
            ), '[]'::jsonb)
            from jsonb_array_elements(published_data->'items') as item
          )
        )
        else published_data
      end,
      updated_at = now()
    where id = 'col_team';

    update public.site_content
    set
      data = case
        when jsonb_typeof(data->'items') = 'array' then jsonb_set(
          data,
          '{items}',
          (
            select coalesce(jsonb_agg(
              case
                when item->>'body' ilike '%SEO%' then jsonb_set(
                  item,
                  '{body}',
                  to_jsonb('Performance, accessibility and product quality baked in from the start — not bolted on.'::text)
                )
                else item
              end
            ), '[]'::jsonb)
            from jsonb_array_elements(data->'items') as item
          )
        )
        else data
      end,
      published_data = case
        when jsonb_typeof(published_data->'items') = 'array' then jsonb_set(
          published_data,
          '{items}',
          (
            select coalesce(jsonb_agg(
              case
                when item->>'body' ilike '%SEO%' then jsonb_set(
                  item,
                  '{body}',
                  to_jsonb('Performance, accessibility and product quality baked in from the start — not bolted on.'::text)
                )
                else item
              end
            ), '[]'::jsonb)
            from jsonb_array_elements(published_data->'items') as item
          )
        )
        else published_data
      end,
      updated_at = now()
    where id = 'col_values';
  end if;
end $$;
