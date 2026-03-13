# Passo a passo: testar o RLS no Supabase

English? [Jump to ENG](#english-eng)

---

## Português (PT-BR)

Objetivo: rodar o app conectado ao Supabase, criar conta, entrar e criar notas. O RLS no banco garante que cada usuário vê só as próprias notas; o frontend usa `.select('*')` sem filtro — quem filtra é o banco via `auth.uid()`. Para o Supabase saber quem é o usuário, é obrigatório **criar conta** e **entrar** (login). O app já tem tela de Entrar e Criar conta.

Siga a ordem abaixo. Se pular algum passo, o teste não fecha.

---

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (ou crie uma conta).
2. No dashboard, clique em **New project**.
3. Preencha:
   - **Name:** qualquer (ex.: `rls-poc`).
   - **Database password:** crie uma senha e guarde (você não usa no app; é só do banco).
   - **Region:** escolha a mais próxima.
4. Clique em **Create new project** e espere terminar (alguns segundos).

---

## 2. Criar a tabela e ativar o RLS

1. No menu lateral do Supabase, clique em **SQL Editor**.
2. Clique em **New query**.
3. Apague qualquer texto que estiver no editor e cole **todo** o bloco abaixo (é o mesmo do arquivo `supabase/migrations/001_create_notes_rls.sql`):

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

4. Clique em **Run** (ou Ctrl+Enter).
5. Confira: deve aparecer mensagem de sucesso. Se der erro, copie a mensagem e confira se colou o SQL inteiro, sem cortar.

Sem esse passo a tabela `notes` não existe e o app não consegue listar nem salvar notas.

---

## 3. Deixar login por e-mail/senha ativo (sem confirmar e-mail)

1. No menu lateral, abra **Authentication**.
2. Clique em **Providers**.
3. Na seção **Email**:
   - **Enable Email provider** deve estar **ligado** (ativado).
   - **Enable email confirmations** deixe **desligado** (só para teste; assim você não precisa clicar em link no e-mail para ativar a conta).
4. Se houver botão **Save**, clique para salvar.

Se a confirmação de e-mail estiver ligada, você precisaria abrir o link que o Supabase manda no e-mail antes de conseguir entrar no app.

---

## 4. Pegar URL e chave do projeto e configurar o app

1. No Supabase, no menu lateral, clique no ícone de **engrenagem** (Project Settings).
2. No menu de configurações, clique em **API** (ou **API Keys**).
3. Na página você verá:
   - **Project URL** — copie esse valor (em General ou na mesma página).
   - Chave para o frontend: use a **Publishable key** (nome "Publishable key", chave que começa com `sb_publishable_...`). Em painéis mais antigos pode aparecer como **anon** / **public** (chave que começa com `eyJ...`). Para o app use sempre a chave **pública** (nunca a Secret key).
4. No seu projeto (pasta do `rlsExample`), crie ou edite o arquivo **`.env.local`** na raiz (ao lado de `package.json`).
5. Deixe o conteúdo assim (trocando pelos valores que você copiou):

```
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Troque `https://seu-projeto.supabase.co` pela **Project URL**.
- Troque `eyJ...` pela **Publishable key** (ou anon public, dependendo do painel).
- **NEXT_PUBLIC_MOCK_MODE** tem que ser `false` para usar o Supabase de verdade.

6. Salve o arquivo e **reinicie** o servidor do Next.js (pare com Ctrl+C e rode de novo `npm run dev`). O Next.js só lê o `.env.local` ao subir.

---

## 5. Abrir o app, criar conta e entrar

1. No navegador, abra **http://localhost:3000** (com o servidor rodando).
2. Você deve ver a tela de **Entrar** / **Criar conta**.
3. Clique em **“Não tem conta? Criar conta”** e preencha:
   - um e-mail (pode ser qualquer um, ex.: `teste@teste.com`);
   - uma senha (mínimo 6 caracteres).
4. Clique em **Criar conta**. Se tudo estiver certo, o app redireciona para a tela **Notas Secretas**.
5. Se já tiver criado conta antes, use **“Já tem conta? Entrar”**, coloque o mesmo e-mail e senha e clique em **Entrar**.

Sem estar logado, o banco não sabe quem você é (`auth.uid()` fica nulo) e o RLS não devolve nenhuma nota; por isso o login é obrigatório.

---

## 6. Criar notas e conferir no Supabase

1. Na tela **Notas Secretas**, digite um texto no campo e clique em **Salvar**. Repita e crie 2 ou 3 notas.
2. As notas devem aparecer na lista na hora.
3. Para conferir no banco: no Supabase, abra **Table Editor** no menu lateral e selecione a tabela **notes**. Você deve ver as linhas que acabou de criar, com a coluna **user_id** preenchida. Em **Authentication** > **Users** você vê o ID do usuário; o `user_id` das notas deve bater com esse ID.

Isso mostra que as notas estão sendo salvas e associadas ao usuário logado.

---

## 7. Provar que o RLS separa um usuário do outro

1. Ainda logado com o primeiro usuário, anote mentalmente as notas que aparecem (só dele).
2. No app, clique em **Sair** (no topo).
3. Na tela de login, clique em **“Não tem conta? Criar conta”** e crie uma **segunda** conta com **outro e-mail** (ex.: `outro@teste.com`) e outra senha. Entre com ela.
4. Crie 1 ou 2 notas com esse segundo usuário. A lista deve mostrar **só** as notas desse segundo usuário — as notas do primeiro **não** aparecem.
5. Clique em **Sair** de novo e entre com o **primeiro** e-mail e senha. A lista deve voltar a mostrar só as notas do primeiro usuário.

O frontend em todos os casos usa a mesma query: `.select('*')`, sem filtrar por `user_id`. Quem restringe as linhas é o RLS no banco, usando `auth.uid() = user_id`. Esse é o teste de que o RLS está funcionando.

---

## Resumo em tabela

| Passo | Onde | O que fazer |
|-------|------|-------------|
| 1 | Supabase Dashboard | Criar novo projeto (nome, senha do DB, região). |
| 2 | Supabase > SQL Editor | Colar e rodar o SQL da tabela `notes` + RLS + políticas. |
| 3 | Supabase > Authentication > Providers | Email ativo; desligar “Enable email confirmations”. |
| 4 | Supabase > Settings > API + projeto | Copiar URL e anon key; colar em `.env.local` com `NEXT_PUBLIC_MOCK_MODE=false`; reiniciar o servidor. |
| 5 | Navegador (localhost:3000) | Criar conta e entrar (ou só entrar se já tiver conta). |
| 6 | App | Criar notas; opcional: conferir em Table Editor > notes. |
| 7 | App | Sair, criar outro usuário, entrar, ver só as notas dele; voltar ao primeiro e ver só as notas do primeiro. |

---

## Se der erro

- **“Supabase não configurado”** no app: confira o passo 4 (`.env.local` com URL e anon key corretos e `NEXT_PUBLIC_MOCK_MODE=false`) e se reiniciou o servidor.
- **Erro ao rodar o SQL:** confira se colou o SQL inteiro (tabela + `alter table` + as duas `create policy`) e rode de novo.
- **Não consigo criar conta / entrar:** confira o passo 3 (Email provider ativo e confirmação de e-mail desligada).
- **Lista de notas vazia mesmo logado:** confira se o passo 2 foi executado (tabela `notes` existe e RLS está ativo) e se não há erro no console do navegador (F12).

---

---

## English (ENG)

Goal: run the app connected to Supabase, create an account, sign in, and create notes. RLS in the database ensures each user only sees their own notes; the frontend uses `.select('*')` with no filter — the database filters via `auth.uid()`. For Supabase to know who the user is, you must **create an account** and **sign in**. The app already has Sign in and Create account screens.

Follow the steps in order. Skipping a step can break the test.

---

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. On the dashboard, click **New project**.
3. Fill in:
   - **Name:** anything (e.g. `rls-poc`).
   - **Database password:** choose a password and save it (you don’t use it in the app; it’s for the DB only).
   - **Region:** pick the closest one.
4. Click **Create new project** and wait for it to finish (a few seconds).

---

### 2. Create the table and enable RLS

1. In the Supabase left menu, click **SQL Editor**.
2. Click **New query**.
3. Clear the editor and paste the **entire** block below (same as `supabase/migrations/001_create_notes_rls.sql`):

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

4. Click **Run** (or Ctrl+Enter).
5. You should see a success message. If there’s an error, check that you pasted the full SQL (table + alter + both policies).

Without this step the `notes` table doesn’t exist and the app can’t list or save notes.

---

### 3. Enable email/password login (no email confirmation)

1. In the left menu, open **Authentication**.
2. Click **Providers**.
3. Under **Email**:
   - **Enable Email provider** should be **on**.
   - **Enable email confirmations** should be **off** (for testing only; so you don’t need to click a link in email to activate the account).
4. If there’s a **Save** button, click it.

If email confirmation is on, you’d have to open the link Supabase sends before you can sign in.

---

### 4. Get project URL and key and configure the app

1. In Supabase, click the **gear** icon (Project Settings) in the left menu.
2. Click **API** (or **API Keys**) in the settings menu.
3. On the page you’ll see:
   - **Project URL** — copy it (under General or on the same page).
   - Key for the frontend: use the **Publishable key** (starts with `sb_publishable_...`). On older dashboards it may appear as **anon** / **public** (key starting with `eyJ...`). In the app always use the **public** key (never the Secret key).
4. In your project folder (`rlsExample`), create or edit **`.env.local`** at the root (next to `package.json`).
5. Set its contents to (replacing with your actual values):

```
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Replace `https://your-project.supabase.co` with your **Project URL**.
- Replace `eyJ...` with your **Publishable key** (or anon public, depending on the dashboard).
- **NEXT_PUBLIC_MOCK_MODE** must be `false` to use real Supabase.

6. Save the file and **restart** the Next.js server (Ctrl+C, then `npm run dev` again). Next.js only reads `.env.local` at startup.

---

### 5. Open the app, create account, and sign in

1. In the browser, open **http://localhost:3000** (with the server running).
2. You should see the **Sign in** / **Create account** screen.
3. Click **“Don’t have an account? Create account”** and enter:
   - an email (any, e.g. `test@test.com`);
   - a password (at least 6 characters).
4. Click **Create account**. If everything is correct, the app goes to the **Secret Notes** screen.
5. If you already have an account, use **“Already have an account? Sign in”**, enter the same email and password, and click **Sign in**.

Without being signed in, the database doesn’t know who you are (`auth.uid()` is null) and RLS returns no notes; that’s why sign-in is required.

---

### 6. Create notes and check in Supabase

1. On the **Secret Notes** screen, type in the input and click **Save**. Repeat to create 2–3 notes.
2. The notes should appear in the list immediately.
3. To verify in the DB: in Supabase, open **Table Editor** and select the **notes** table. You should see the rows you created, with **user_id** set. Under **Authentication** > **Users** you can see the user ID; the notes’ `user_id` should match.

That confirms notes are saved and tied to the signed-in user.

---

### 7. Prove RLS isolates one user from another

1. Still signed in as the first user, note which notes are shown (only theirs).
2. In the app, click **Sign out** (at the top).
3. On the login screen, click **“Don’t have an account? Create account”** and create a **second** account with a **different email** (e.g. `other@test.com`) and password. Sign in with it.
4. Create 1–2 notes as this second user. The list should show **only** that user’s notes — the first user’s notes should **not** appear.
5. Click **Sign out** again and sign in with the **first** email and password. The list should show only the first user’s notes again.

The frontend always uses the same query: `.select('*')`, with no `user_id` filter. RLS in the database restricts rows using `auth.uid() = user_id`. That’s the proof RLS is working.

---

### Summary table

| Step | Where | What to do |
|------|--------|------------|
| 1 | Supabase Dashboard | Create new project (name, DB password, region). |
| 2 | Supabase > SQL Editor | Paste and run the `notes` table + RLS + policies SQL. |
| 3 | Supabase > Authentication > Providers | Email on; turn off “Enable email confirmations”. |
| 4 | Supabase > Settings > API + project | Copy URL and anon key; put in `.env.local` with `NEXT_PUBLIC_MOCK_MODE=false`; restart server. |
| 5 | Browser (localhost:3000) | Create account and sign in (or just sign in if you already have one). |
| 6 | App | Create notes; optionally check Table Editor > notes. |
| 7 | App | Sign out, create another user, sign in, see only their notes; sign back in as first user and see only their notes. |

---

### If something fails

- **“Supabase not configured”** in the app: check step 4 (`.env.local` with correct URL and anon key, `NEXT_PUBLIC_MOCK_MODE=false`) and that you restarted the server.
- **Error when running SQL:** make sure you pasted the full SQL (table + alter + both create policy) and run again.
- **Can’t create account / sign in:** check step 3 (Email provider on, email confirmation off).
- **Notes list empty while signed in:** check that step 2 was done (table `notes` exists and RLS is enabled) and that there are no errors in the browser console (F12).
