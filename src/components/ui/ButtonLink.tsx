"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    ButtonVariantProps {
  href: string;
  arrow?: boolean;
}

/**
 * Link styled with the same variants as the `Button` component.
 * Uses a `motion.span` wrapper that is `display: inline-block` so the
 * spring scale animates without forcing a block element inside `<a>`
 * (which would otherwise cause a hydration mismatch in React).
 */
export default function ButtonLink({
  className,
  variant,
  size,
  href,
  children,
  arrow,
  ...props
}: ButtonLinkProps) {
  return (
    <motion.span
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="inline-block"
    >
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant, size, className }),
          "group/button gap-2"
        )}
        {...props}
      >
        <span>{children}</span>
        {arrow && (
          <svg
            className="h-3.5 w-3.5 transition-transform group-hover/button:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        )}
      </Link>
    </motion.span>
  );
}
