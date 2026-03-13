"use client";

import { useLanguage } from "@/contexts/languageContext";
import { useRlsStatus } from "@/contexts/rlsStatusContext";
import { createClient } from "@/lib/supabaseClient";
import {
  getEffectiveTableSchema,
  getStoredSchemaIndicatesRls,
  rowToNote,
} from "@/lib/parseTableSchema";
import { useEffect, useMemo, useRef, useState } from "react";

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

const TABLE_KEY = "rls-example-table";

const isMockMode = () =>
  typeof process.env.NEXT_PUBLIC_MOCK_MODE !== "undefined" &&
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

function getInitialTable() {
  if (typeof window === "undefined") return "notes";
  return localStorage.getItem(TABLE_KEY) || "notes";
}

function mapRowsToNotes(
  data: Record<string, unknown>[] | null,
  schema: ReturnType<typeof getEffectiveTableSchema>
): Note[] {
  if (!data) return [];
  return data.map((row) => rowToNote(row, schema));
}

export function SecretNotes() {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tableName, setTableName] = useState("notes");
  const [tableInput, setTableInput] = useState("notes");
  const [showTableConfig, setShowTableConfig] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [insertError, setInsertError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { setRlsStatus } = useRlsStatus();
  const hasInsertedOnceRef = useRef(false);

  const mockMode = isMockMode();
  const supabase = useMemo(() => (mockMode ? null : createClient()), [mockMode]);

  useEffect(() => {
    setTableName(getInitialTable());
    setTableInput(getInitialTable());
  }, []);

  useEffect(() => {
    function onOnboardingDone() {
      setTableName(getInitialTable());
      setTableInput(getInitialTable());
    }
    window.addEventListener("rls-onboarding-done", onOnboardingDone);
    return () => window.removeEventListener("rls-onboarding-done", onOnboardingDone);
  }, []);

  useEffect(() => {
    if (mockMode) {
      setNotes(mockNotes);
      setLoading(false);
      setFetchError(null);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    setFetchError(null);
    async function fetchNotes() {
      const schema = getEffectiveTableSchema();
      const [userResult, { data, error }] = await Promise.all([
        client.auth.getUser(),
        client.from(tableName).select("*"),
      ]);
      const uid = userResult.data.user?.id ?? null;
      setCurrentUserId(uid);
      if (error) {
        setFetchError(error.message);
        setNotes([]);
        setRlsStatus(null);
      } else {
        const mapped = mapRowsToNotes(data ?? [], schema);
        setNotes(mapped);
        const schemaIndicatesRls = getStoredSchemaIndicatesRls();
        const canShowValid = schemaIndicatesRls || hasInsertedOnceRef.current;
        if (mapped.length === 0) {
          setRlsStatus("unverifiable");
        } else if (uid && mapped.some((n) => n.user_id !== uid)) {
          setRlsStatus("inconsistent");
        } else if (uid && mapped.every((n) => n.user_id === uid) && canShowValid) {
          setRlsStatus("valid");
        } else {
          setRlsStatus("unverifiable");
        }
      }
      setLoading(false);
    }
    fetchNotes();
  }, [supabase, mockMode, tableName, setRlsStatus]);

  function applyTableName() {
    const name = tableInput.trim() || "notes";
    setTableName(name);
    if (typeof window !== "undefined") localStorage.setItem(TABLE_KEY, name);
    setShowTableConfig(false);
  }

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
    setInsertError(null);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      const schema = getEffectiveTableSchema();
      const { error: insertErr } = await supabase
        .from(tableName)
        .insert({
          [schema.contentColumn]: content.trim(),
          [schema.userColumn]: userId,
        });
      if (insertErr) {
        setInsertError(insertErr.message);
      } else {
        setContent("");
        hasInsertedOnceRef.current = true;
        const { data } = await supabase.from(tableName).select("*");
        if (data) {
          const mapped = mapRowsToNotes(data, schema);
          setNotes(mapped);
          if (mapped.length === 0) setRlsStatus("unverifiable");
          else if (userId && mapped.every((n) => n.user_id === userId)) setRlsStatus("valid");
          else if (userId && mapped.some((n) => n.user_id !== userId)) setRlsStatus("inconsistent");
          else setRlsStatus("unverifiable");
        }
      }
    }
    setSubmitting(false);
  }

  function retryFetch() {
    setFetchError(null);
    setLoading(true);
    if (supabase) {
      supabase.from(tableName).select("*").then(({ data, error }) => {
        const schema = getEffectiveTableSchema();
        if (error) {
          setFetchError(error.message);
          setRlsStatus(null);
        } else {
          const mapped = mapRowsToNotes(data ?? [], schema);
          setNotes(mapped);
          const canShowValid = getStoredSchemaIndicatesRls() || hasInsertedOnceRef.current;
          if (mapped.length === 0) setRlsStatus("unverifiable");
          else if (currentUserId && mapped.some((n) => n.user_id !== currentUserId)) setRlsStatus("inconsistent");
          else if (currentUserId && mapped.every((n) => n.user_id === currentUserId) && canShowValid) setRlsStatus("valid");
          else setRlsStatus("unverifiable");
        }
        setLoading(false);
      });
    } else setLoading(false);
  }

  if (!mockMode && !supabase) {
    return (
      <div className="rounded-xl border border-border bg-surfaceElevated p-5 text-textPrimary shadow-sm dark:border-border dark:bg-surfaceElevated">
        <p className="font-medium">{t.notes.supabaseNotConfigured}</p>
        <p className="mt-1 text-sm text-textSecondary">
          {t.notes.supabaseNotConfiguredHint}
        </p>
      </div>
    );
  }

  if (loading && !fetchError) {
    return (
      <div className="flex items-center gap-2 text-textSecondary">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
        <span>{t.notes.loadingNotes}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-6">
      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {t.notes.fetchErrorTitle}
          </p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            {fetchError}
          </p>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {t.notes.fetchErrorHint.replace("{table}", tableName)}
          </p>
          <button
            type="button"
            onClick={retryFetch}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-900/30"
          >
            {t.notes.retry}
          </button>
        </div>
      )}
      {insertError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {t.notes.insertErrorTitle}
          </p>
          <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
            {insertError}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {mockMode && (
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-border bg-surfaceElevated px-2 py-0.5 text-xs font-medium text-textSecondary dark:border-border dark:bg-surfaceElevated">
              {t.notes.mock}
            </span>
          </div>
        )}
        {mockMode && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            {t.notes.mockDesc}
          </p>
        )}
        {!mockMode && (
          <>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 dark:border-accent/30 dark:bg-accent/10">
              <h3 className="text-sm font-semibold text-textPrimary">
                {t.notes.howProvesRls}
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-textSecondary">
                <li>{t.notes.bullet1}</li>
                <li>{t.notes.bullet2}</li>
                <li>{t.notes.bullet3}</li>
              </ul>
              <p className="mt-3 text-xs font-medium text-textPrimary">
                {t.notes.howToValidate}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border-2 border-border bg-surfaceElevated px-4 py-3 dark:border-border dark:bg-surfaceElevated">
                <p className="text-sm font-semibold uppercase tracking-wide text-textSecondary">
                  {t.notes.tableCurrent}
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-textPrimary">
                  {tableName}
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowTableConfig((s) => !s)}
                  className="group relative flex items-center gap-2 rounded-xl border-2 border-accent/50 bg-accent/10 px-5 py-3 font-medium text-accent shadow-md transition-all duration-200 hover:scale-105 hover:border-accent hover:bg-accent/20 hover:shadow-lg hover:shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface dark:border-accent/50 dark:bg-accent/15 dark:text-accent dark:hover:bg-accent/25 dark:focus:ring-offset-surfaceElevated"
                >
                <svg className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                  {showTableConfig ? t.notes.close : t.notes.useMyTable}
                </button>
              </div>
            </div>
            {showTableConfig && (
              <div className="rounded-xl border-2 border-border bg-surfaceElevated p-4 transition-all duration-200 dark:border-border dark:bg-surfaceElevated">
                <p className="mb-3 text-xs text-textSecondary">
                  {t.notes.tableHint}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tableInput}
                    onChange={(e) => setTableInput(e.target.value)}
                    placeholder={t.notes.tablePlaceholder}
                    className="flex-1 rounded-lg border-2 border-border bg-surface px-4 py-2.5 font-mono text-sm text-textPrimary transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-border dark:bg-surface dark:focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={applyTableName}
                    className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow transition hover:scale-105 hover:opacity-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surfaceElevated"
                  >
                    {t.notes.apply}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.notes.newNotePlaceholder}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surfaceElevated px-4 py-2.5 text-textPrimary placeholder:text-textSecondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-border dark:bg-surfaceElevated dark:focus:border-accent dark:focus:ring-accent"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-accent dark:hover:opacity-90"
        >
          {t.notes.save}
        </button>
      </form>

      <section className="flex flex-col">
        <h2 className="mb-3 shrink-0 text-sm font-medium text-textSecondary">
          {t.notes.notesSection}
        </h2>
        <div className="max-h-[70vh] min-h-[8rem] overflow-y-auto rounded-xl border border-border px-2 py-2 dark:border-border">
          <ul className="space-y-2 pr-1">
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
              {t.notes.noNotes}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
