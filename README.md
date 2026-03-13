# Row-Level Security Proof of Concept

---

## English (ENG)

### Overview

This project is a minimal proof of concept for Row-Level Security (RLS) using Next.js and Supabase. The security boundary is enforced at the database layer: policies restrict which rows each user can read and write based on `auth.uid()`. The frontend can therefore call a plain `.select('*')` on the `notes` table without applying any `user_id` filter in application code. The database returns only the rows the current user is allowed to see.

### Database Setup

Run the following in the Supabase SQL Editor (or via the Supabase CLI) to create the `notes` table, enable RLS, and attach the policies:

```sql
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null
);

alter table public.notes enable row level security;

create policy "users_select_own_notes"
  on public.notes
  for select
  using (auth.uid() = user_id);

create policy "users_insert_own_notes"
  on public.notes
  for insert
  with check (auth.uid() = user_id);
```

### Core Logic

The client never sends a `WHERE user_id = ?` in the query. RLS evaluates `auth.uid()` on each request and applies the policy conditions server-side. SELECT returns only rows where `user_id` matches the authenticated user; INSERT is allowed only when the row’s `user_id` equals `auth.uid()`. Keeping this logic in the database reduces the risk of leaking data if the frontend is wrong or bypassed, and keeps the application code simple.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key (Settings > API) |

Copy `.env.example` to `.env.local` and fill in the values from your Supabase project.

### How to Run

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with your Supabase URL and anon key, then:

```bash
npm run dev
```

Open http://localhost:3000. The "Secret Notes" UI lists and creates notes; visibility and insertability are enforced by RLS. Ensure users are authenticated (e.g. via Supabase Auth) for the policies to apply.

---

---

## Português (PT-BR)

### Visão geral

Este projeto é uma prova de conceito mínima de Row-Level Security (RLS) com Next.js e Supabase. A restrição de acesso é aplicada no banco: políticas limitam quais linhas cada usuário pode ler e inserir com base em `auth.uid()`. O frontend pode assim usar um `.select('*')` simples na tabela `notes` sem filtrar por `user_id` no código. O banco devolve apenas as linhas permitidas para o usuário autenticado.

### Configuração do banco

Execute o script abaixo no SQL Editor do Supabase (ou via CLI do Supabase) para criar a tabela `notes`, ativar RLS e criar as políticas:

```sql
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null
);

alter table public.notes enable row level security;

create policy "users_select_own_notes"
  on public.notes
  for select
  using (auth.uid() = user_id);

create policy "users_insert_own_notes"
  on public.notes
  for insert
  with check (auth.uid() = user_id);
```

### Lógica central

O cliente não envia `WHERE user_id = ?` na query. O RLS usa `auth.uid()` em cada requisição e aplica as condições da política no servidor. O SELECT retorna só linhas em que `user_id` é o usuário autenticado; o INSERT só é aceito quando o `user_id` da linha é igual a `auth.uid()`. Manter essa regra no banco reduz o risco de vazamento se o frontend errar ou for contornado e mantém o código da aplicação simples.

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto no Supabase (Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima/pública do Supabase (Settings > API) |

Copie `.env.example` para `.env.local` e preencha com os dados do seu projeto no Supabase.

### Como executar

```bash
npm install
cp .env.example .env.local
```

Edite `.env.local` com a URL e a anon key do Supabase e execute:

```bash
npm run dev
```

Acesse http://localhost:3000. A interface "Notas Secretas" lista e cria notas; a visibilidade e a permissão de inserção são garantidas pelo RLS. Usuários precisam estar autenticados (ex.: via Supabase Auth) para as políticas valerem.
