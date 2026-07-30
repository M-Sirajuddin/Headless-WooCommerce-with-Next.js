"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react";
import { getOrderStatus, type OrderStatus } from "@/lib/auth-api";

function ThankYouContent() {
  const params = useSearchParams();
  const order = params.get("order") ?? "";
  const key = params.get("key") ?? "";

  const [data, setData] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order || !key) {
      setError("Missing order reference.");
      setLoading(false);
      return;
    }
    getOrderStatus(order, key)
      .then(setData)
      .catch(() => setError("We couldn't find this order."))
      .finally(() => setLoading(false));
  }, [order, key]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1d232d]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-4 py-20 text-center">
        <AlertCircle className="h-14 w-14 text-[#d93b2e]" strokeWidth={1.5} />
        <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-black">
          Order not found
        </h1>
        <p className="mt-3 text-sm text-black/60">{error}</p>
        <Link href="/products" className="mt-8 inline-flex h-12 items-center justify-center bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]">
          Continue shopping
        </Link>
      </div>
    );
  }

  const paid = data.isPaid;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center px-4 py-16 text-center">
      {paid ? (
        <CheckCircle className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
      ) : (
        <Clock className="h-16 w-16 text-amber-500" strokeWidth={1.5} />
      )}
      <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-black">
        {paid ? "Thank you for your order!" : "Order received"}
      </h1>
      <p className="mt-3 text-sm text-black/65">
        {paid
          ? "Your payment was successful. A confirmation has been sent to your email."
          : "Your order is awaiting payment confirmation. We'll email you once it's processed."}
      </p>

      <div className="mt-8 w-full border border-black/10 bg-[#fafafa] p-6 text-left">
        <div className="flex justify-between border-b border-black/10 pb-3 text-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-black/55">Order number</span>
          <span className="font-black text-black">#{data.orderNumber}</span>
        </div>
        <div className="flex justify-between border-b border-black/10 py-3 text-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-black/55">Status</span>
          <span className="font-semibold capitalize text-black">{data.status.toLowerCase()}</span>
        </div>
        <div className="flex justify-between border-b border-black/10 py-3 text-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-black/55">Payment</span>
          <span className="font-semibold text-black">{data.paymentMethodTitle || "—"}</span>
        </div>

        <ul className="divide-y divide-black/5 py-2">
          {data.items.map((item, i) => (
            <li key={i} className="flex justify-between py-2 text-sm">
              <span className="text-black/80">{item.name} <span className="text-black/45">×{item.quantity}</span></span>
              <span className="font-semibold text-black">{item.total}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-black/10 pt-3">
          <span className="text-lg font-black uppercase tracking-tight text-black">Total</span>
          <span className="text-xl font-black text-black">{data.total}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/account/orders" className="inline-flex h-12 items-center justify-center bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]">
          View orders
        </Link>
        <Link href="/products" className="inline-flex h-12 items-center justify-center border border-black px-6 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-black/30" /></div>}>
      <ThankYouContent />
    </Suspense>
  );
}
