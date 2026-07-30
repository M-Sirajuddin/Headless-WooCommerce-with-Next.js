"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Animated brand logo. SVG mark + wordmark with a subtle gradient
 * and a soft hover animation. Rendered as a Next.js Link so it
 * can be used as the primary site identity link in the header.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <motion.span
      className={`inline-flex items-center gap-2 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link href="/" className="inline-flex items-center gap-2">
        <span className="relative inline-block h-8 w-8">
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-lg bg-gradient-brand opacity-90 blur-[2px]"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative flex h-full w-full items-center justify-center rounded-lg bg-gradient-brand shadow-lg">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">
            <span className="text-gradient">HEDY</span>
            <span className="text-foreground"> STORE</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            curated goods
          </span>
        </span>
      </Link>
    </motion.span>
  );
}
