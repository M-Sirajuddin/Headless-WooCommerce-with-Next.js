"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  const isTimeout =
    error.message?.includes("timeout") ||
    error.message?.includes("TIMEOUT") ||
    error.message?.includes("UND_ERR_CONNECT") ||
    error.cause instanceof Error && (error.cause as any).code === "UND_ERR_CONNECT_TIMEOUT";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-8 w-8 text-[#d93b2e]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-black uppercase tracking-tight">
          {isTimeout ? "Server Unreachable" : "Something went wrong"}
        </h1>
        <p className="max-w-sm text-sm text-black/55">
          {isTimeout
            ? "Could not connect to the store server. Please check your internet connection or try again in a moment."
            : "An unexpected error occurred while loading this page."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 bg-black px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center border border-black/20 px-6 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:border-black"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
