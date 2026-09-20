create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  educador_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  contato text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.sessoes (
  id uuid primary key default gen_random_uuid(),
  educador_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  iniciada_em timestamptz not null,
  finalizada_em timestamptz,
  nota text,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.leituras (
  id uuid primary key default gen_random_uuid(),
  educador_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  sessao_id uuid not null references public.sessoes(id) on delete cascade,
  tipo text not null check (tipo in ('borg','omni','dor','fc')),
  valor real not null,
  registrada_em timestamptz not null,
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_sessoes_cliente on public.sessoes(cliente_id);
create index if not exists idx_leituras_sessao on public.leituras(sessao_id);
create index if not exists idx_clientes_educador on public.clientes(educador_id);
create index if not exists idx_sessoes_educador on public.sessoes(educador_id);
create index if not exists idx_leituras_educador on public.leituras(educador_id);

alter table public.clientes enable row level security;
alter table public.sessoes enable row level security;
alter table public.leituras enable row level security;

drop policy if exists "clientes_own" on public.clientes;
create policy "clientes_own" on public.clientes for all
  using (educador_id = auth.uid()) with check (educador_id = auth.uid());

drop policy if exists "sessoes_own" on public.sessoes;
create policy "sessoes_own" on public.sessoes for all
  using (educador_id = auth.uid()) with check (educador_id = auth.uid());

drop policy if exists "leituras_own" on public.leituras;
create policy "leituras_own" on public.leituras for all
  using (educador_id = auth.uid()) with check (educador_id = auth.uid());

grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.sessoes to authenticated;
grant select, insert, update, delete on public.leituras to authenticated;
