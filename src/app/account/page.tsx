"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";
import {
  Box,
  LogOut,
  MapPin,
  ReceiptText,
  UserRound,
  WalletCards,
  Loader2,
} from "lucide-react";

const DASHBOARD_CARDS = [
  {
    label: "Orders",
    href: "/account/orders",
    icon: Box,
  },
  {
    label: "Addresses",
    href: "/account/addresses",
    icon: MapPin,
  },
  {
    label: "Account details",
    href: "/account/settings",
    icon: UserRound,
  },
  {
    label: "Logout",
    href: "/account/logout",
    icon: LogOut,
  },
];

export default function AccountPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else {
      setCheckingAuth(false);
    }
  }, [token, router]);

  if (checkingAuth || !token) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#d93b2e]" />
        <span className="text-xs text-black/55 uppercase font-black tracking-widest">
          Checking credentials...
        </span>
      </div>
    );
  }

  const name = user ? user.displayName || `${user.firstName} ${user.lastName}`.trim() || user.username : "Wholesale Partner";

  return (
    <>
      <p className="text-lg text-black/65">
        Hello <span className="font-black text-black">{name}</span>{" "}
        (not {name}?{" "}
        <Link
          href="/account/logout"
          className="font-semibold text-black underline hover:text-[#d93b2e] transition"
        >
          Log out
        </Link>
        )
      </p>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-black/55">
        From your account dashboard you can view your recent orders,
        manage your shipping and billing addresses, and edit your password
        and account details.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_CARDS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex min-h-[160px] flex-col items-center justify-center border border-black/10 bg-[#fafafa] px-6 text-center transition hover:border-black hover:bg-white"
          >
            <Icon className="h-10 w-10 text-black/20" strokeWidth={1.5} />
            <span className="mt-4 text-xl font-black uppercase tracking-tight text-black">
              {label}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title="Orders"
          description="Track your recent wholesale orders."
          icon={<ReceiptText className="h-5 w-5" />}
        />
        <QuickAction
          title="Payments"
          description="Manage your saved payment methods."
          icon={<WalletCards className="h-5 w-5" />}
        />
      </div>
    </>
  );
}

function QuickAction({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="border border-black/10 bg-[#fafafa] p-5">
      <div className="flex items-center gap-3 text-black">
        {icon}
        <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-black/55">{description}</p>
    </div>
  );
}
