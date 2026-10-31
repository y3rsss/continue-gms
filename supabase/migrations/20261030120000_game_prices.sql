create table public.game_prices (
  game_slug text primary key check (char_length(game_slug) between 1 and 200),
  itad_id uuid,
  offers jsonb not null default '[]' check (jsonb_typeof(offers) = 'array'),
  lowest jsonb check (jsonb_typeof(lowest) = 'object'),
  checked_at timestamptz not null default now()
);

grant select, insert, update on public.game_prices to service_role;

alter table public.game_prices enable row level security;
