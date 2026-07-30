"use client";

import { WifiOff } from "lucide-react";
import { useServerStatus } from "@/context/ServerStatus";

export default function ServerDownBanner() {
  const { serverDown } = useServerStatus();
  if (!serverDown) return null;

  return (
    <div className="sticky top-0 z-[9999] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-md">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Store server is currently unreachable — you can browse products freely, but
        cart, checkout &amp; account edits are temporarily disabled.
      </span>
    </div>
  );
}
