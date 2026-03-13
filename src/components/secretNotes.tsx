"use client";

import { createClient } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type Note = {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
};

export function SecretNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
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
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !content.trim()) return;
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

  if (!supabase) {
    return (
      <div className="max-w-xl mx-auto rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <p className="font-medium">Supabase não configurado</p>
        <p className="mt-1 text-sm">
          Copie .env.example para .env.local na raiz do projeto, preencha com
          os valores do painel do Supabase e reinicie o servidor.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-neutral-500">Carregando notas...</p>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Notas Secretas
      </h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nova nota..."
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-neutral-900"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Salvar
        </button>
      </form>
      <ul className="space-y-2">
        {notes.map((note) => (
          <li
            key={note.id}
            className="rounded border border-neutral-200 bg-white p-3 text-neutral-800"
          >
            {note.content}
          </li>
        ))}
      </ul>
      {notes.length === 0 && (
        <p className="text-neutral-500">Nenhuma nota ainda.</p>
      )}
    </div>
  );
}
