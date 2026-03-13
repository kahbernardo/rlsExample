"use client";

import { createClient } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type Note = {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
};

const mockNotes: Note[] = [
  {
    id: "mock-1",
    created_at: new Date().toISOString(),
    user_id: "mock-user",
    content: "Exemplo de nota (modo mock)",
  },
  {
    id: "mock-2",
    created_at: new Date().toISOString(),
    user_id: "mock-user",
    content: "Adicione notas pelo formulário para testar a interface.",
  },
];

const isMockMode = () =>
  typeof process.env.NEXT_PUBLIC_MOCK_MODE !== "undefined" &&
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export function SecretNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mockMode = isMockMode();
  const supabase = useMemo(() => (mockMode ? null : createClient()), [mockMode]);

  useEffect(() => {
    if (mockMode) {
      setNotes(mockNotes);
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    async function fetchNotes() {
      const { data, error } = await supabase.from("notes").select("*");
      if (!error) setNotes(data ?? []);
      setLoading(false);
    }
    fetchNotes();
  }, [supabase, mockMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (mockMode) {
      setSubmitting(true);
      setNotes((prev) => [
        ...prev,
        {
          id: `mock-${Date.now()}`,
          created_at: new Date().toISOString(),
          user_id: "mock-user",
          content: content.trim(),
        },
      ]);
      setContent("");
      setSubmitting(false);
      return;
    }
    if (!supabase) return;
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      await supabase
        .from("notes")
        .insert({ content: content.trim(), user_id: userId });
      setContent("");
      const { data } = await supabase.from("notes").select("*");
      if (data) setNotes(data);
    }
    setSubmitting(false);
  }

  if (!mockMode && !supabase) {
    return (
      <div className="rounded-xl border border-border bg-surfaceElevated p-5 text-textPrimary shadow-sm dark:border-border dark:bg-surfaceElevated">
        <p className="font-medium">Supabase não configurado</p>
        <p className="mt-1 text-sm text-textSecondary">
          Copie .env.example para .env.local na raiz do projeto, preencha com
          os valores do painel do Supabase e reinicie o servidor.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-textSecondary">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
        <span>Carregando notas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
            Notas Secretas
          </h1>
          {mockMode && (
            <span className="rounded-md border border-border bg-surfaceElevated px-2 py-0.5 text-xs font-medium text-textSecondary dark:border-border dark:bg-surfaceElevated">
              Mock
            </span>
          )}
        </div>
        {mockMode && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            Modo mock: só exibe a interface. O PoC do RLS acontece com Supabase
            real e usuário autenticado: o frontend usa .select(&apos;*&apos;) sem
            filtro e o banco devolve apenas as linhas do auth.uid().
          </p>
        )}
        {!mockMode && (
          <p className="text-sm text-textSecondary">
            Lista vinda de .select(&apos;*&apos;) sem .eq(&apos;user_id&apos;, …).
            O RLS no banco filtra por auth.uid().
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nova nota..."
          className="min-w-0 flex-1 rounded-lg border border-border bg-surfaceElevated px-4 py-2.5 text-textPrimary placeholder:text-textSecondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-border dark:bg-surfaceElevated dark:focus:border-accent dark:focus:ring-accent"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-accent dark:hover:opacity-90"
        >
          Salvar
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-medium text-textSecondary">
          Notas
        </h2>
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-border bg-surfaceElevated p-4 text-textPrimary shadow-sm transition dark:border-border dark:bg-surfaceElevated"
            >
              {note.content}
            </li>
          ))}
        </ul>
        {notes.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-textSecondary dark:border-border">
            Nenhuma nota ainda.
          </p>
        )}
      </section>
    </div>
  );
}
