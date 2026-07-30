alter table public.support_requests
  add column if not exists assigned_to text;

grant insert on public.client_notifications to authenticated;

drop policy if exists client_notifications_staff_insert on public.client_notifications;
create policy client_notifications_staff_insert
  on public.client_notifications
  for insert
  to authenticated
  with check (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'editor')
  );
