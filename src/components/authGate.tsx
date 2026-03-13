"use client";

import { createClient } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

const isMockMode = () =>
  typeof process.env.NEXT_PUBLIC_MOCK_MODE !== "undefined" &&
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

type User = { id: string; email?: string } | null;

export function AuthGate({ children }: { children: React.ReactNode }) {
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
        <span>Carregando...</span>
      </div>
    );
  }
  if (!user) {
    return (
      <AuthForm supabase={supabase} />
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surfaceElevated px-4 py-3 dark:border-border dark:bg-surfaceElevated">
        <span className="truncate text-sm text-textSecondary">
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-textPrimary transition hover:bg-border dark:border-border dark:hover:bg-border"
        >
          Sair
        </button>
      </div>
      {children}
    </div>
  );
}

function AuthForm({ supabase }: { supabase: ReturnType<typeof createClient> }) {
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <h2 className="text-lg font-semibold text-textPrimary">
        {mode === "entrar" ? "Entrar" : "Criar conta"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-textPrimary placeholder:text-textSecondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-border dark:bg-surface dark:focus:border-accent dark:focus:ring-accent"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
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
          {loading ? "..." : mode === "entrar" ? "Entrar" : "Criar conta"}
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
        {mode === "entrar"
          ? "Não tem conta? Criar conta"
          : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
