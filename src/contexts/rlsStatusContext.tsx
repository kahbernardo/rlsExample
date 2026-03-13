"use client";

import { createContext, useContext, useState } from "react";

export type RlsStatus = "valid" | "inconsistent" | "unverifiable" | null;

type RlsStatusContextValue = {
  rlsStatus: RlsStatus;
  setRlsStatus: (s: RlsStatus) => void;
};

const RlsStatusContext = createContext<RlsStatusContextValue | null>(null);

export function RlsStatusProvider({ children }: { children: React.ReactNode }) {
  const [rlsStatus, setRlsStatus] = useState<RlsStatus>(null);
  return (
    <RlsStatusContext.Provider value={{ rlsStatus, setRlsStatus }}>
      {children}
    </RlsStatusContext.Provider>
  );
}

export function useRlsStatus() {
  const ctx = useContext(RlsStatusContext);
  return ctx ?? { rlsStatus: null as RlsStatus, setRlsStatus: () => {} };
}
