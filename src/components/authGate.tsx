"use client";

import { useLanguage, type AuthT, type Lang } from "@/contexts/languageContext";
import { createClient } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

const isMockMode = () =>
  typeof process.env.NEXT_PUBLIC_MOCK_MODE !== "undefined" &&
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

type User = { id: string; email?: string } | null;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  const mockMode = isMockMode();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (mockMode || !supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: d }) => {
      setUser(d.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase, mockMode]);

  if (mockMode || !supabase) return <>{children}</>;
  if (authLoading) {
    return (
      <div className="flex items-center gap-2 text-textSecondary">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
        <span>{t.auth.loading}</span>
      </div>
    );
  }
  if (!user) {
    return (
      <AuthForm supabase={supabase} lang={lang} setLang={setLang} t={t.auth} />
    );
  }
  return <>{children}</>;
}

function AuthForm({
  supabase,
  lang,
  setLang,
  t,
}: {
  supabase: ReturnType<typeof createClient>;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: AuthT;
}) {
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeLang(l: Lang) {
    setLang(l);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === "entrar") {
      const { error: err } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase!.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setError(null);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-xl border border-border bg-surfaceElevated p-6 shadow-sm dark:border-border dark:bg-surfaceElevated">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 dark:border-border dark:bg-surface">
        <span className="shrink-0 text-accent" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <div className="min-w-0 text-xs text-textSecondary">
          <p className="font-medium text-textPrimary">{t.loginSecure}</p>
          <p className="mt-0.5">{t.loginRequired}</p>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-textPrimary">
        {mode === "entrar" ? t.signIn : t.createAccount}
      </h2>
      <button
        type="button"
        onClick={() => {
          supabase!.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
          });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surfaceElevated py-2.5 text-sm font-medium text-textPrimary transition hover:bg-border dark:border-border dark:bg-surfaceElevated dark:hover:bg-border"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {t.signInWithGoogle}
      </button>
      <p className="text-center text-xs text-textSecondary">{t.or}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-textPrimary">
          {t.email}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          required
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-textPrimary placeholder:text-textSecondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-border dark:bg-surface dark:focus:border-accent dark:focus:ring-accent"
        />
        <label className="block text-sm font-medium text-textPrimary">
          {t.password}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-textPrimary placeholder:text-textSecondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-border dark:bg-surface dark:focus:border-accent dark:focus:ring-accent"
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-accent dark:hover:opacity-90"
        >
          {loading ? "..." : mode === "entrar" ? t.signIn : t.createAccount}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "entrar" ? "cadastrar" : "entrar"));
          setError(null);
        }}
        className="w-full text-center text-sm text-textSecondary underline hover:text-textPrimary"
      >
        {mode === "entrar" ? t.noAccount : t.hasAccount}
      </button>
      <div className="flex justify-center pt-2">
        <div className="flex gap-0.5 rounded-lg border border-border bg-surface p-0.5 dark:border-border dark:bg-surface">
          <button
            type="button"
            onClick={() => changeLang("pt")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
              lang === "pt"
                ? "bg-accent text-white dark:bg-accent dark:text-white"
                : "text-textSecondary hover:text-textPrimary dark:hover:text-textPrimary"
            }`}
            aria-pressed={lang === "pt"}
          >
            PT
          </button>
          <button
            type="button"
            onClick={() => changeLang("en")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
              lang === "en"
                ? "bg-accent text-white dark:bg-accent dark:text-white"
                : "text-textSecondary hover:text-textPrimary dark:hover:text-textPrimary"
            }`}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
