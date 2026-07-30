"use client";

import Link from "next/link";
import { Mail, Send } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/products?category=sale", label: "Clearance" },
  { href: "/cart", label: "Cart" },
  { href: "/products", label: "Quote Requests" },
  { href: "/about-us", label: "About Us" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/lab-reports", label: "Lab Reports" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-10">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_1.3fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em]">
              Subscribe Newsletter
            </p>
            <p className="mt-2 max-w-sm text-xs uppercase tracking-[0.08em] text-white/60">
              Get all the latest information on events, sales and offers.
            </p>
          </div>

          <form
            onSubmit={(event) => event.preventDefault()}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex flex-1 items-center border border-white/15 bg-white/5 px-4">
              <Mail className="h-4 w-4 text-white/45" />
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="Email address..."
                className="h-12 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/40"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#d93b2e] hover:text-white"
            >
              <Send className="h-4 w-4" />
              Subscribe
            </button>
          </form>

          <div className="flex items-center justify-start md:justify-end">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white hover:bg-white hover:text-black"
            >
              <span className="text-lg font-black leading-none">f</span>
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.14em] text-white/60 md:flex-row md:items-center md:justify-between">
          <div>© {year} HEDY STORE</div>
          <div className="flex flex-wrap items-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
