"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Check, Copy, X, MoreHorizontal } from "lucide-react";

/* Inline brand SVGs (lucide dropped brand icons). Single-path, currentColor. */
const Icon = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M.06 24l1.68-6.15a11.87 11.87 0 01-1.6-5.95C.14 5.34 5.5 0 12.08 0a11.82 11.82 0 018.42 3.49 11.82 11.82 0 013.48 8.42c0 6.57-5.35 11.91-11.92 11.91a11.9 11.9 0 01-5.7-1.45L.06 24zM6.6 20.13c1.68 1 3.28 1.6 5.4 1.6 5.46 0 9.9-4.44 9.9-9.9a9.86 9.86 0 00-2.9-7A9.83 9.83 0 0012.07 2c-5.46 0-9.9 4.44-9.9 9.9 0 2.24.65 3.92 1.75 5.68l-1 3.63 3.68-1.08zM17.5 14.3c-.07-.12-.27-.2-.57-.35-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.29.17-1.42z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  ),
};

export default function ShareButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(title);

  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for non-secure contexts where clipboard API is blocked.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: title, url });
      setOpen(false);
    } catch {
      /* cancelled */
    }
  };

  const socials = [
    { label: "Facebook", key: "facebook" as const, href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: "X", key: "x" as const, href: `https://twitter.com/intent/tweet?url=${enc}&text=${encT}` },
    { label: "WhatsApp", key: "whatsapp" as const, href: `https://wa.me/?text=${encT}%20${enc}` },
    { label: "LinkedIn", key: "linkedin" as const, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { label: "Email", key: "email" as const, href: `mailto:?subject=${encT}&body=${enc}` },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Share product"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-12 w-12 items-center justify-center border border-black/10 bg-background transition-colors hover:bg-black hover:text-white"
        title="Share"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-black/10 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-black">Share</span>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-black/40 hover:text-black">
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="mb-3 flex w-full items-center gap-2 rounded-lg border border-black/10 px-3 py-2.5 text-sm font-semibold text-black transition hover:border-black"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Link copied!" : "Copy link"}
          </button>

          <div className="grid grid-cols-5 gap-2">
            {socials.map(({ label, key, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${label}`}
                title={label}
                className="flex items-center justify-center rounded-lg border border-black/10 py-2.5 text-black/70 transition hover:border-black hover:bg-black hover:text-white"
              >
                {Icon[key]}
              </a>
            ))}
          </div>

          {canNative && (
            <button
              type="button"
              onClick={nativeShare}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-black py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#d93b2e]"
            >
              <MoreHorizontal className="h-4 w-4" />
              More options
            </button>
          )}
        </div>
      )}
    </div>
  );
}
