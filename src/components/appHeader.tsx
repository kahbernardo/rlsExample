"use client";

import { useLanguage } from "@/contexts/languageContext";
import { useRlsStatus } from "@/contexts/rlsStatusContext";
import { createClient } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { ThemeSwitcher } from "./themeSwitcher";

const isMockMode = () =>
  typeof process.env.NEXT_PUBLIC_MOCK_MODE !== "undefined" &&
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

type User = { id: string; email?: string } | null;

export function AppHeader() {
  const { lang, setLang, t } = useLanguage();
  const { rlsStatus } = useRlsStatus();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isMockMode() || !supabase) return;
    supabase.auth.getUser().then(({ data: d }) => {
      setUser(d.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase, mounted]);

  return (
    <aside className="flex min-h-screen w-96 shrink-0 flex-col border-r border-border bg-surface/95 dark:border-border dark:bg-surface/95">
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-lg font-bold tracking-tight text-textPrimary">
          {t.header.appName}
        </h1>
        {user && (
          <div className="flex flex-col gap-2">
            <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 dark:border-accent/30 dark:bg-accent/15">
              <p className="text-xs font-medium uppercase tracking-wide text-textSecondary">
                {t.header.account}
              </p>
              <span className="mt-0.5 block truncate text-sm font-medium text-textPrimary" title={user.email}>
                {user.email}
              </span>
            </div>
            {supabase && (
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="rounded-lg border border-border bg-surfaceElevated px-3 py-2 text-sm font-medium text-textPrimary transition hover:bg-border hover:text-textPrimary dark:border-border dark:bg-surfaceElevated dark:hover:bg-border"
              >
                {t.header.signOut}
              </button>
            )}
          </div>
        )}
        {rlsStatus !== null && (
          <div
            role="status"
            aria-live="polite"
            title={
              rlsStatus === "valid"
                ? t.notes.rlsBadgeTooltipValid
                : rlsStatus === "inconsistent"
                  ? t.notes.rlsBadgeTooltipInvalid
                  : t.notes.rlsBadgeTooltipUnverifiable
            }
            className={
              rlsStatus === "valid"
                ? "rounded-xl border-2 border-green-500 bg-green-50 p-3 dark:border-green-500 dark:bg-green-950/40"
                : "rounded-xl border-2 border-red-500 bg-red-50 p-3 dark:border-red-500 dark:bg-red-950/40"
            }
          >
            <div className="flex items-center gap-2">
              {rlsStatus === "valid" ? (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-green-800 dark:text-green-200">{t.notes.rlsBadgeValid}</p>
                    <p className="truncate text-xs text-green-700 dark:text-green-300">{t.notes.rlsBadgeTooltipValid}</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-red-800 dark:text-red-200">
                      {rlsStatus === "inconsistent" ? t.notes.rlsBadgeInvalid : t.notes.rlsBadgeUnverifiable}
                    </p>
                    <p className="truncate text-xs text-red-700 dark:text-red-300">
                      {rlsStatus === "inconsistent" ? t.notes.rlsBadgeTooltipInvalid : t.notes.rlsBadgeTooltipUnverifiable}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-2 border-t border-border p-4 dark:border-border">
        <div className="flex gap-0.5 rounded-lg border border-border bg-surface p-0.5 dark:border-border dark:bg-surface">
          <button
            type="button"
            onClick={() => setLang("pt")}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
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
            onClick={() => setLang("en")}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
              lang === "en"
                ? "bg-accent text-white dark:bg-accent dark:text-white"
                : "text-textSecondary hover:text-textPrimary dark:hover:text-textPrimary"
            }`}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
