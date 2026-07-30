"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  align?: "left" | "center";
}

/**
 * A reusable animated section header with optional eyebrow, title, description,
 * and trailing action link. Use it at the top of any content section.
 */
export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between ${
        align === "center" ? "md:flex-col md:items-center md:text-center" : ""
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className={align === "center" ? "text-center" : ""}
      >
        {eyebrow && (
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-1">
            <span className="h-px w-6 bg-gradient-brand" />
            {eyebrow}
          </div>
        )}
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link
            href={action.href}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
