create extension if not exists "pgcrypto";

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  home_code text not null,
  away_team text not null,
  away_code text not null,
  opening_date date not null,
  match_time text not null,
  auction_opening_date date not null default (timezone('America/Bogota', now()))::date,
  opening_time text not null,
  auction_closing_date date not null default (timezone('America/Bogota', now()))::date,
  closing_time text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches add column if not exists auction_opening_date date;
alter table public.matches add column if not exists auction_closing_date date;

update public.matches
set
  auction_opening_date = coalesce(auction_opening_date, opening_date),
  auction_closing_date = coalesce(auction_closing_date, opening_date)
where auction_opening_date is null
   or auction_closing_date is null;

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  name text not null,
  phone text not null,
  joined_at timestamptz not null default now(),
  unique (match_id, phone)
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  cell_key text not null,
  row_goal integer not null,
  col_goal integer not null,
  participant_id uuid not null references public.participants(id) on delete cascade,
  participant_name text not null,
  amount integer not null check (amount >= 1000),
  created_at timestamptz not null default now(),
  unique (match_id, cell_key)
);

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.matches enable row level security;
alter table public.participants enable row level security;
alter table public.bids enable row level security;
alter table public.app_admins enable row level security;

alter table public.matches replica identity full;
alter table public.participants replica identity full;
alter table public.bids replica identity full;

insert into public.matches (
  id,
  home_team,
  home_code,
  away_team,
  away_code,
  opening_date,
  match_time,
  auction_opening_date,
  opening_time,
  auction_closing_date,
  closing_time
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Colombia',
  'COL',
  'Corea del Sur',
  'KOR',
  (timezone('America/Bogota', now()))::date,
  '4:00 PM',
  (timezone('America/Bogota', now()))::date,
  '12:00 AM',
  (timezone('America/Bogota', now()))::date,
  '11:59 PM'
)
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Lectura propia de administradores" on public.app_admins;
create policy "Lectura propia de administradores"
on public.app_admins for select
using (auth.uid() = user_id);

drop policy if exists "Lectura publica de partidos" on public.matches;
create policy "Lectura publica de partidos"
on public.matches for select
using (true);

drop policy if exists "Creacion publica de partidos" on public.matches;
drop policy if exists "Creacion admin de partidos" on public.matches;
create policy "Creacion admin de partidos"
on public.matches for insert
with check (public.is_admin());

drop policy if exists "Actualizacion publica de partidos" on public.matches;
drop policy if exists "Actualizacion admin de partidos" on public.matches;
create policy "Actualizacion admin de partidos"
on public.matches for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Lectura publica de participantes" on public.participants;
create policy "Lectura publica de participantes"
on public.participants for select
using (true);

drop policy if exists "Inscripcion publica de participantes" on public.participants;
create policy "Inscripcion publica de participantes"
on public.participants for insert
with check (true);

drop policy if exists "Lectura publica de pujas" on public.bids;
create policy "Lectura publica de pujas"
on public.bids for select
using (true);

drop policy if exists "Creacion publica de pujas" on public.bids;
drop policy if exists "Actualizacion publica de pujas" on public.bids;

create or replace function public.place_bid(
  p_match_id uuid,
  p_cell_key text,
  p_row_goal integer,
  p_col_goal integer,
  p_participant_id uuid,
  p_amount integer
)
returns public.bids
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_participant public.participants%rowtype;
  v_opening_at timestamp;
  v_closing_at timestamp;
  v_now timestamp;
  v_bid public.bids%rowtype;
begin
  if p_amount < 1000 then
    raise exception 'La puja minima es 1000';
  end if;

  if p_row_goal < 0 or p_row_goal > 6 or p_col_goal < 0 or p_col_goal > 6 then
    raise exception 'Marcador fuera de rango';
  end if;

  select * into v_match from public.matches where id = p_match_id;
  if not found then
    raise exception 'Partido no encontrado';
  end if;

  v_opening_at := to_timestamp(
    to_char(coalesce(v_match.auction_opening_date, v_match.opening_date), 'YYYY-MM-DD') || ' ' || v_match.opening_time,
    'YYYY-MM-DD HH12:MI AM'
  )::timestamp;
  v_closing_at := to_timestamp(
    to_char(coalesce(v_match.auction_closing_date, v_match.opening_date), 'YYYY-MM-DD') || ' ' || v_match.closing_time,
    'YYYY-MM-DD HH12:MI AM'
  )::timestamp;
  v_now := timezone('America/Bogota', now());

  if v_now < v_opening_at then
    raise exception 'La subasta aun no esta abierta';
  end if;

  if v_now > v_closing_at then
    raise exception 'La subasta ya esta cerrada';
  end if;

  select * into v_participant from public.participants where id = p_participant_id and match_id = p_match_id;
  if not found then
    raise exception 'Participante no inscrito para este partido';
  end if;

  insert into public.bids (match_id, cell_key, row_goal, col_goal, participant_id, participant_name, amount)
  values (p_match_id, p_cell_key, p_row_goal, p_col_goal, p_participant_id, v_participant.name, p_amount)
  on conflict (match_id, cell_key)
  do update set
    participant_id = excluded.participant_id,
    participant_name = excluded.participant_name,
    amount = excluded.amount,
    created_at = now()
  where excluded.amount >= public.bids.amount + 1000
  returning * into v_bid;

  if v_bid.id is null then
    raise exception 'La puja debe superar la puja actual por al menos 1000';
  end if;

  return v_bid;
end;
$$;

grant execute on function public.place_bid(uuid, text, integer, integer, uuid, integer) to anon, authenticated;

create or replace function public.reset_auction(p_match_id uuid)
returns table(deleted_bids integer, deleted_participants integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_bids integer := 0;
  v_deleted_participants integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede limpiar la subasta';
  end if;

  delete from public.bids where match_id = p_match_id;
  get diagnostics v_deleted_bids = row_count;

  delete from public.participants where match_id = p_match_id;
  get diagnostics v_deleted_participants = row_count;

  update public.matches set updated_at = now() where id = p_match_id;

  return query select v_deleted_bids, v_deleted_participants;
end;
$$;

grant execute on function public.reset_auction(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table public.participants;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bids'
  ) then
    alter publication supabase_realtime add table public.bids;
  end if;
end $$;
