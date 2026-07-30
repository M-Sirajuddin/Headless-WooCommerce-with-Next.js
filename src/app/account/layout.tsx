"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";
import { Loader2 } from "lucide-react";

const ACCOUNT_LINKS = [
  { label: "Dashboard", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Quote Requests", href: "/account/quotes" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Account details", href: "/account/settings" },
  { label: "Log out", href: "/account/logout" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppSelector((state) => state.auth.token);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  // The logout route intentionally clears the token; it must never be guarded
  // or it would redirect to /login?redirect=/account/logout and loop.
  const isLogout = pathname === "/account/logout";

  useEffect(() => {
    if (isLogout) return;
    if (hydrated && !token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, token, router, pathname, isLogout]);

  // While Redux is hydrating from localStorage, show a spinner so the page
  // doesn't flash the account UI before the redirect fires.
  if (!isLogout && (!hydrated || !token)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black/30" />
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f7] min-h-[calc(100vh-140px)]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>›</span>
          <Link href="/products" className="hover:text-black">Shop</Link>
          <span>›</span>
          <span>My account</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="border border-black/10 bg-white p-6 h-fit">
            <h1 className="text-2xl font-black tracking-tight text-black">
              My Account
            </h1>
            <nav className="mt-6">
              {ACCOUNT_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`block border-b border-black/8 py-3 text-sm transition last:border-0 ${
                    pathname === link.href
                      ? "font-black text-black"
                      : "text-black/80 hover:text-black"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="border border-black/10 bg-white p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
