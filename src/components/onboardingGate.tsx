"use client";

import { useEffect, useState } from "react";
import { Onboarding } from "./onboarding";

const ONBOARDING_KEY = "rls-example-onboarding-done";

const isMockMode = () =>
  typeof process.env.NEXT_PUBLIC_MOCK_MODE !== "undefined" &&
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isMockMode()) {
      setChecked(true);
      setDone(true);
      return;
    }
    setDone(localStorage.getItem(ONBOARDING_KEY) === "true");
    setChecked(true);
  }, []);

  useEffect(() => {
    function onDone() {
      setDone(true);
    }
    window.addEventListener("rls-onboarding-done", onDone);
    return () => window.removeEventListener("rls-onboarding-done", onDone);
  }, []);

  if (!checked) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }
  if (isMockMode()) return <>{children}</>;
  if (!done) {
    return (
      <>
        <Onboarding onComplete={() => setDone(true)} />
        {children}
      </>
    );
  }
  return <>{children}</>;
}
