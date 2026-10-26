create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url text check (char_length(avatar_url) <= 500),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create type public.backlog_status as enum ('want', 'playing', 'finished', 'dropped');

create table public.backlog_entries (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  game_slug text not null check (char_length(game_slug) between 1 and 200),
  status public.backlog_status not null,
  game jsonb not null check (jsonb_typeof(game) = 'object' and pg_column_size(game) <= 8192),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

grant select on public.profiles to anon, authenticated;
grant update (username, display_name, avatar_url, is_public) on public.profiles to authenticated;
grant select on public.backlog_entries to anon, authenticated;
grant insert, update, delete on public.backlog_entries to authenticated;

alter table public.profiles enable row level security;
alter table public.backlog_entries enable row level security;

create policy "public profiles and your own are visible"
  on public.profiles for select to anon, authenticated
  using (is_public or id = (select auth.uid()));

create policy "you can edit your own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "public backlogs and your own are visible"
  on public.backlog_entries for select to anon, authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );

create policy "you can add to your own backlog"
  on public.backlog_entries for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "you can change your own backlog"
  on public.backlog_entries for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "you can remove from your own backlog"
  on public.backlog_entries for delete to authenticated
  using (user_id = (select auth.uid()));

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  base text;
  candidate text;
  failed_constraint text;
begin
  base := left(regexp_replace(lower(coalesce(
    meta ->> 'user_name',
    meta ->> 'preferred_username',
    split_part(new.email, '@', 1),
    ''
  )), '[^a-z0-9_]', '', 'g'), 20);
  if char_length(base) < 3 then
    base := 'player';
  end if;
  candidate := base;

  loop
    begin
      insert into public.profiles (id, username, display_name, avatar_url)
      values (
        new.id,
        candidate,
        left(coalesce(nullif(trim(meta ->> 'full_name'), ''), nullif(trim(meta ->> 'name'), ''), candidate), 50),
        left(meta ->> 'avatar_url', 500)
      );
      return new;
    exception when unique_violation then
      get stacked diagnostics failed_constraint = constraint_name;
      if failed_constraint <> 'profiles_username_key' then
        raise;
      end if;
      candidate := base || floor(random() * 10000)::int;
    end;
  end loop;
end;
$$;

-- only the trigger should run it, never the public api
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
