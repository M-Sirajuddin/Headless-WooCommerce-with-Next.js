"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { subscribeServerStatus } from "@/lib/server-status-signal";

interface ServerStatusValue {
  serverDown: boolean;
}

const ServerStatusContext = createContext<ServerStatusValue>({ serverDown: false });

export function ServerStatusProvider({ children }: { children: ReactNode }) {
  const [serverDown, setServerDown] = useState(false);

  // Driven by real API traffic — no background polling while healthy.
  // A failed/503 backend call flips us to "down"; a successful one flips back.
  useEffect(() => subscribeServerStatus((down) => setServerDown(down)), []);

  // Only while we believe the server is DOWN do we actively poll /api/health,
  // purely to detect recovery. Stops as soon as it comes back up.
  useEffect(() => {
    if (!serverDown) return;
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const { ok } = await res.json();
        if (!cancelled && ok) setServerDown(false);
      } catch {
        /* still down — keep polling */
      }
    }

    const interval = setInterval(check, 15_000);
    check();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [serverDown]);

  return (
    <ServerStatusContext.Provider value={{ serverDown }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus() {
  return useContext(ServerStatusContext);
}
