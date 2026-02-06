-- TABELA DE PERFIS (Jogadores)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  avatar_seed text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) para Profiles
alter table public.profiles enable row level security;

-- Política: Qualquer um pode criar um perfil (Anônimo)
create policy "Enable insert for everyone" on public.profiles for insert with check (true);

-- Política: Qualquer um pode ler perfis (Necessário para ver oponentes)
create policy "Enable select for everyone" on public.profiles for select using (true);


-- TABELA DE SALAS (Rooms)
create table public.rooms (
  code text primary key, -- Código de 4 letras
  host_id uuid references public.profiles(id),
  game_type text not null, -- 'knucklebones', 'duel_grimoire', 'bug_derby'
  status text default 'waiting', -- 'waiting', 'playing', 'finished'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para Rooms
alter table public.rooms enable row level security;

-- Política: Qualquer um pode criar e ler salas
create policy "Enable all access for rooms" on public.rooms for all using (true);


-- TABELA DE PARTIDAS (Histórico)
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_code text references public.rooms(code),
  game_type text not null,
  winner_id uuid references public.profiles(id),
  played_at timestamp with time zone default timezone('utc'::text, now()) not null,
  details jsonb -- Dados extras (placar final, etc)
);

-- Habilitar RLS para Matches
alter table public.matches enable row level security;

create policy "Enable read access for all matches" on public.matches for select using (true);
create policy "Enable insert for matches" on public.matches for insert with check (true);

-- REALTIME
-- Adicionar tabelas à publicação 'supabase_realtime' para ouvir mudanças
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.matches;
