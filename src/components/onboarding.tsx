"use client";

import { useLanguage } from "@/contexts/languageContext";
import {
  parseCreateTableSql,
  setStoredTableSchema,
  setStoredSchemaIndicatesRls,
  sqlIndicatesRls,
} from "@/lib/parseTableSchema";
import { useState } from "react";

const ONBOARDING_KEY = "rls-example-onboarding-done";
const TABLE_KEY = "rls-example-table";

const SCHEMA_SQL = `create table public.notes (
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
  with check (auth.uid() = user_id);`;

export function useOnboardingDone() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [tableInput, setTableInput] = useState(() => localStorage.getItem(TABLE_KEY) || "notes");
  const [sqlInput, setSqlInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [extractMessage, setExtractMessage] = useState<"ok" | "error" | null>(null);

  function handleConcluir() {
    const name = tableInput.trim() || "notes";
    localStorage.setItem(TABLE_KEY, name);
    localStorage.setItem(ONBOARDING_KEY, "true");
    window.dispatchEvent(new CustomEvent("rls-onboarding-done"));
    onComplete();
  }

  function copySql() {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surfaceElevated p-6 shadow-xl dark:border-border dark:bg-surfaceElevated">
        <h2 className="text-lg font-semibold text-textPrimary">
          {t.onboarding.title}
        </h2>
        <p className="mt-1 text-sm text-textSecondary">
          {t.onboarding.subtitle}
        </p>

        <div className="mt-6 space-y-6">
          {step >= 1 && (
            <section>
              <h3 className="text-sm font-semibold text-textPrimary">
                {t.onboarding.step1Title}
              </h3>
              <p className="mt-1 text-xs text-textSecondary">
                {t.onboarding.step1Desc}
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-surface p-3 text-xs text-textPrimary dark:border-border dark:bg-surface">
                <code>{SCHEMA_SQL}</code>
              </pre>
              <button
                type="button"
                onClick={copySql}
                className="mt-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-border dark:border-border dark:hover:bg-border"
              >
                {copied ? t.onboarding.copied : t.onboarding.copySql}
              </button>
            </section>
          )}

          {step >= 2 && (
            <section>
              <h3 className="text-sm font-semibold text-textPrimary">
                {t.onboarding.step2Title}
              </h3>
              <p className="mt-1 text-xs text-textSecondary">
                {t.onboarding.step2Desc}
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-textPrimary">
                    {t.onboarding.step2Option1}
                  </p>
                  <p className="mt-0.5 text-xs text-textSecondary">
                    {t.onboarding.step2Option1Hint}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={tableInput}
                      onChange={(e) => {
                        setTableInput(e.target.value);
                        setExtractMessage(null);
                      }}
                      placeholder="notes"
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-textPrimary dark:border-border dark:bg-surface"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-textPrimary">
                    {t.onboarding.step2Option2}
                  </p>
                  <p className="mt-0.5 text-xs text-textSecondary">
                    {t.onboarding.step2Option2Hint}
                  </p>
                  <textarea
                    value={sqlInput}
                    onChange={(e) => {
                      setSqlInput(e.target.value);
                      setExtractMessage(null);
                    }}
                    placeholder="create table public.notes (...)"
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-textPrimary placeholder:text-textSecondary dark:border-border dark:bg-surface"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sql = sqlInput.trim();
                        const parsed = parseCreateTableSql(sql);
                        if (parsed) {
                          setTableInput(parsed.tableName);
                          setStoredTableSchema(parsed.inferred);
                          setStoredSchemaIndicatesRls(sqlIndicatesRls(sql));
                          setExtractMessage("ok");
                        } else {
                          setStoredTableSchema(null);
                          setStoredSchemaIndicatesRls(false);
                          setExtractMessage("error");
                        }
                      }}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-border dark:border-border dark:hover:bg-border"
                    >
                      {t.onboarding.step2Extract}
                    </button>
                    {extractMessage === "ok" && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {t.onboarding.step2ExtractOk}
                      </span>
                    )}
                    {extractMessage === "error" && sqlInput.trim() && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {t.onboarding.step2ExtractError}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {step >= 3 && (
            <section>
              <h3 className="text-sm font-semibold text-textPrimary">
                {t.onboarding.step3Title}
              </h3>
              <p className="mt-1 text-xs text-textSecondary">
                {t.onboarding.step3Desc}
              </p>
            </section>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {t.onboarding.next}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleConcluir}
            className="rounded-lg border border-border bg-surfaceElevated px-4 py-2 text-sm font-medium text-textPrimary hover:bg-border dark:border-border dark:bg-surfaceElevated dark:hover:bg-border"
          >
            {t.onboarding.complete}
          </button>
        </div>
      </div>
    </div>
  );
}
