"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/hooks/redux";
import { clearAuth } from "@/store/authSlice";
import { clearCart } from "@/store/cartSlice";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Clear auth first so middleware targets the guest key going forward.
    // The user's cart is already persisted in woo_cart_user_{id} by the middleware
    // on every previous action — no extra save needed.
    dispatch(clearAuth());
    dispatch(clearCart()); // guest starts with an empty cart

    const timer = setTimeout(() => {
      router.replace("/");
    }, 800);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#d93b2e]" />
      <h3 className="text-lg font-bold uppercase text-black tracking-wider">
        Logging Out
      </h3>
      <p className="text-xs text-black/65">
        Clearing your session credentials...
      </p>
    </div>
  );
}
