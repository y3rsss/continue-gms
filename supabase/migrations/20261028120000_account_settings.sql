-- check if username is taken
create function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where username = lower(name));
$$;

-- deleting the auth user cascades to the profile and the backlog
create function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke execute on function public.username_available(text) from public, anon;
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.username_available(text) to authenticated;
grant execute on function public.delete_account() to authenticated;
