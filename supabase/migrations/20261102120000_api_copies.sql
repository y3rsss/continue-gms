create table public.api_copies (
  key text primary key check (char_length(key) between 1 and 300),
  body jsonb not null,
  saved_at timestamptz not null default now()
);

create index api_copies_saved_at on public.api_copies (saved_at desc);

grant select, insert, update, delete on public.api_copies to service_role;

alter table public.api_copies enable row level security;

-- keeps the newest 2000 copies
create function public.save_api_copy(copy_key text, copy_body jsonb)
returns void
language sql
set search_path = ''
as $$
  insert into public.api_copies (key, body, saved_at)
  values (copy_key, copy_body, now())
  on conflict (key) do update set body = excluded.body, saved_at = excluded.saved_at;

  delete from public.api_copies
  where key in (select key from public.api_copies order by saved_at desc offset 2000);
$$;

revoke execute on function public.save_api_copy(text, jsonb) from public, anon, authenticated;
grant execute on function public.save_api_copy(text, jsonb) to service_role;
