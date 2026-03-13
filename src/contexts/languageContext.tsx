"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const LANG_KEY = "rls-example-lang";

const translations = {
  pt: {
    auth: {
      loading: "Carregando...",
      signOut: "Sair",
      loginSecure: "Login direto e seguro com Supabase",
      loginRequired:
        "Este passo é obrigatório: o RLS usa seu usuário logado para filtrar as notas.",
      signIn: "Entrar",
      createAccount: "Criar conta",
      signInWithGoogle: "Entrar com Google",
      or: "ou",
      email: "E-mail",
      password: "Senha",
      emailPlaceholder: "seu@email.com",
      noAccount: "Não tem conta? Criar conta",
      hasAccount: "Já tem conta? Entrar",
    },
    header: {
      appName: "Validação RLS",
      account: "Conta",
      signOut: "Sair",
    },
    notes: {
      title: "Validação RLS",
      mock: "Mock",
      mockDesc:
        "Modo mock: só exibe a interface. O PoC do RLS acontece com Supabase real e usuário autenticado: o frontend usa .select('*') sem filtro e o banco devolve apenas as linhas do auth.uid().",
      howProvesRls: "Como isso prova o RLS?",
      bullet1: "O frontend chama .select('*') sem .eq('user_id', …)",
      bullet2: "O banco aplica a política: só linhas onde auth.uid() = user_id",
      bullet3: "Cada usuário vê apenas suas notas; o app não filtra no código",
      howToValidate:
        "Como validar: saia, entre com outra conta e crie notas. Volte ao primeiro usuário: a lista deve ser diferente. Se cada um vê só as próprias notas, o RLS está ativo no seu esquema.",
      tableCurrent: "Tabela atual",
      useMyTable: "Usar minha tabela",
      close: "Fechar",
      tableHint:
        "Sua tabela no Supabase deve ter colunas: id, user_id (uuid), content (text) e RLS com policy auth.uid() = user_id.",
      tablePlaceholder: "nome_da_tabela",
      apply: "Aplicar",
      newNotePlaceholder: "Nova nota...",
      save: "Salvar",
      notesSection: "Notas",
      noNotes: "Nenhuma nota ainda.",
      loadingNotes: "Carregando notas...",
      fetchErrorTitle: "Erro ao carregar notas",
      fetchErrorHint: 'Verifique se a tabela "{table}" existe e se o RLS está ativo. Você pode usar "Usar minha tabela" para outro nome.',
      retry: "Tentar novamente",
      insertErrorTitle: "Erro ao salvar",
      supabaseNotConfigured: "Supabase não configurado",
      supabaseNotConfiguredHint:
        "Copie .env.example para .env.local na raiz do projeto, preencha com os valores do painel do Supabase e reinicie o servidor.",
      rlsBadgeValid: "RLS ativo",
      rlsBadgeInvalid: "RLS inconsistente",
      rlsBadgeUnverifiable: "RLS não verificável",
      rlsBadgeTooltipValid: "Todos os registros retornados pertencem à sua conta.",
      rlsBadgeTooltipInvalid: "Há registros de outro usuário; o RLS pode estar inativo.",
      rlsBadgeTooltipUnverifiable: "Sem registros para validar; crie registros e confira.",
    },
    onboarding: {
      title: "Configurar o RLS no Supabase",
      subtitle:
        "Siga os passos abaixo para criar a tabela e testar o isolamento por usuário.",
      step1Title: "1. Rodar o SQL no Supabase",
      step1Desc:
        "No painel do Supabase, abra SQL Editor → New query. Cole o script abaixo e execute (Run).",
      copySql: "Copiar SQL",
      copied: "Copiado",
      step2Title: "2. Ou usar sua própria tabela",
      step2Desc:
        "Escolha a forma que for mais conveniente: só o nome da tabela ou colar o SQL para detectar nome e colunas.",
      step2Option1: "Opção 1 — Só o nome da tabela",
      step2Option1Hint: "Se a tabela já tem a estrutura padrão (id, user_id, content).",
      step2Option2: "Opção 2 — Colar SQL (CREATE TABLE)",
      step2Option2Hint: "Detectamos automaticamente o nome da tabela e as colunas.",
      step2Extract: "Extrair estrutura",
      step2ExtractOk: "Estrutura extraída: tabela e colunas detectados.",
      step2ExtractError: "Não foi possível identificar uma tabela no SQL. Cole um CREATE TABLE válido.",
      step3Title: "3. Validar o RLS",
      step3Desc:
        "Depois de rodar o SQL (ou usar sua tabela): crie algumas notas aqui. Saia (Sair no topo), entre com outra conta e crie outras notas. Volte ao primeiro usuário. Cada um deve ver só as próprias notas — isso prova que o RLS está ativo.",
      next: "Próximo",
      complete: "Concluir",
    },
  },
  en: {
    auth: {
      loading: "Loading...",
      signOut: "Sign out",
      loginSecure: "Direct, secure login with Supabase",
      loginRequired:
        "This step is required: RLS uses your logged-in user to filter notes.",
      signIn: "Sign in",
      createAccount: "Create account",
      signInWithGoogle: "Sign in with Google",
      or: "or",
      email: "Email",
      password: "Password",
      emailPlaceholder: "you@example.com",
      noAccount: "Don't have an account? Create account",
      hasAccount: "Already have an account? Sign in",
    },
    header: {
      appName: "RLS Validation",
      account: "Account",
      signOut: "Sign out",
    },
    notes: {
      title: "RLS Validation",
      mock: "Mock",
      mockDesc:
        "Mock mode: interface only. The RLS PoC runs with real Supabase and an authenticated user: the frontend uses .select('*') with no filter and the database returns only rows for auth.uid().",
      howProvesRls: "How does this prove RLS?",
      bullet1: "The frontend calls .select('*') with no .eq('user_id', …)",
      bullet2: "The database applies the policy: only rows where auth.uid() = user_id",
      bullet3: "Each user sees only their notes; the app does not filter in code",
      howToValidate:
        "How to validate: sign out, sign in with another account and create notes. Sign back in as the first user. Each should see only their own notes — that proves RLS is active on your schema.",
      tableCurrent: "Current table",
      useMyTable: "Use my table",
      close: "Close",
      tableHint:
        "Your Supabase table must have columns: id, user_id (uuid), content (text) and RLS with policy auth.uid() = user_id.",
      tablePlaceholder: "table_name",
      apply: "Apply",
      newNotePlaceholder: "New note...",
      save: "Save",
      notesSection: "Notes",
      noNotes: "No notes yet.",
      loadingNotes: "Loading notes...",
      fetchErrorTitle: "Error loading notes",
      fetchErrorHint: 'Check that the table "{table}" exists and RLS is enabled. You can use "Use my table" for a different name.',
      retry: "Try again",
      insertErrorTitle: "Error saving",
      supabaseNotConfigured: "Supabase not configured",
      supabaseNotConfiguredHint:
        "Copy .env.example to .env.local in the project root, fill in your Supabase dashboard values, and restart the server.",
      rlsBadgeValid: "RLS active",
      rlsBadgeInvalid: "RLS inconsistent",
      rlsBadgeUnverifiable: "RLS unverifiable",
      rlsBadgeTooltipValid: "All returned rows belong to your account.",
      rlsBadgeTooltipInvalid: "Some rows belong to another user; RLS may be off.",
      rlsBadgeTooltipUnverifiable: "No rows to validate; create records and check.",
    },
    onboarding: {
      title: "Set up RLS in Supabase",
      subtitle:
        "Follow the steps below to create the table and test per-user isolation.",
      step1Title: "1. Run the SQL in Supabase",
      step1Desc:
        "In the Supabase dashboard, open SQL Editor → New query. Paste the script below and run it.",
      copySql: "Copy SQL",
      copied: "Copied",
      step2Title: "2. Or use your own table",
      step2Desc:
        "Choose whatever is most convenient: table name only, or paste SQL to detect name and columns.",
      step2Option1: "Option 1 — Table name only",
      step2Option1Hint: "If the table already has the default structure (id, user_id, content).",
      step2Option2: "Option 2 — Paste SQL (CREATE TABLE)",
      step2Option2Hint: "We detect the table name and columns automatically.",
      step2Extract: "Extract structure",
      step2ExtractOk: "Structure extracted: table and columns detected.",
      step2ExtractError: "Could not identify a table in the SQL. Paste a valid CREATE TABLE.",
      step3Title: "3. Validate RLS",
      step3Desc:
        "After running the SQL (or using your table): create some notes here. Sign out (top right), sign in with another account and create more notes. Sign back in as the first user. Each should see only their own notes — that proves RLS is active.",
      next: "Next",
      complete: "Complete",
    },
  },
} as const;

export type Lang = keyof typeof translations;

export type T = (typeof translations)["pt"];
export type AuthT = T["auth"];

type ContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
};

const defaultValue: ContextValue = {
  lang: "pt",
  setLang: () => {},
  t: translations.pt as T,
};

const LanguageContext = createContext<ContextValue>(defaultValue);

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "pt";
  const stored = localStorage.getItem(LANG_KEY) as Lang | null;
  if (stored === "pt" || stored === "en") return stored;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith("pt") ? "pt" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) setLangState(getInitialLang());
  }, [mounted]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, l);
  }, []);

  const value: ContextValue = {
    lang,
    setLang,
    t: translations[lang],
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx ?? defaultValue;
}
