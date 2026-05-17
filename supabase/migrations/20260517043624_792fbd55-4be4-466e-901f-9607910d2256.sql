
-- set_updated_at: trigger only, lock down
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at := now(); return new; end $$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- handle_new_user: trigger only, lock down
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- has_role: only signed-in users may call directly; RLS engine still works
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
