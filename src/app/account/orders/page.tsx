"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setOrders } from "@/store/authSlice";
import { fetchUserOrders } from "@/lib/mock";
import { Package, Loader2, Calendar, ReceiptText, ChevronDown } from "lucide-react";

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const orders = useAppSelector((state) => state.auth.orders);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchUserOrders(token)
        .then((data) => {
          dispatch(setOrders(data));
        })
        .catch((err) => {
          console.error("Failed to load customer orders:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, dispatch]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusStyle = (status: string) => {
    // Every status gets a visually distinct hue.
    const s = status.toUpperCase();
    switch (s) {
      case "PENDING": // awaiting payment
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "ON-HOLD":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "PROCESSING":
        return "bg-green-100 text-green-800 border-green-200";
      case "SHIPPED":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#d93b2e]" />
        <span className="text-xs text-black/55 uppercase font-black tracking-widest">
          Loading order history...
        </span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <h2 className="text-2xl font-black tracking-tight text-black">
          Orders
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center border border-dashed border-black/20 bg-[#fafafa] py-16 text-center">
          <Package className="h-10 w-10 text-black/20" strokeWidth={1.5} />
          <p className="mt-4 text-sm font-semibold text-black/65">
            No order has been made yet.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center justify-center bg-black px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
          >
            Browse products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-black tracking-tight text-black mb-6">
        Orders
      </h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          return (
          <div
            key={order.id}
            className={`border transition ${isExpanded ? "border-black/25 bg-white shadow-sm" : "border-black/10 bg-[#fafafa] hover:bg-white hover:border-black/25"}`}
          >
            {/* Order header — always visible, click to expand/collapse.
                A div (not button) so the "Pay now" link can live inside. */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedId(isExpanded ? null : order.id);
                }
              }}
              aria-expanded={isExpanded}
              className="flex w-full cursor-pointer flex-col gap-4 p-5 text-left sm:flex-row sm:items-center sm:justify-between md:p-6"
            >
              <div className="space-y-1">
                <span className="text-xs text-black/45 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <ReceiptText className="h-3.5 w-3.5" />
                  Order #{order.orderNumber}
                </span>
                <span className="text-xs text-black/55 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(order.date)}
                </span>
                <span className="text-[11px] text-black/40 font-semibold">
                  {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                {order.needsPayment && order.paymentUrl && (
                  <a
                    href={order.paymentUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-8 items-center justify-center rounded bg-[#4b5563] px-4 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-black"
                  >
                    Pay now
                  </a>
                )}
                <span className={`inline-flex items-center border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusStyle(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-xl font-black text-black">
                  {order.total}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-black/40 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {/* Expandable details */}
            <div className={isExpanded ? "block border-t border-black/8 px-5 pb-5 md:px-6 md:pb-6" : "hidden"}>

            {/* Line items */}
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wider text-black/45 mb-2">
                Purchased Items
              </p>
              <ul className="divide-y divide-black/5">
                {order.items?.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between py-2 text-sm">
                    <span className="text-black/80 font-medium">{item.name}</span>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-black/55 text-xs">×{item.quantity}</span>
                      {item.total && (
                        <span className="text-black font-semibold">{item.total}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Billing / Shipping addresses */}
            {(order.billing?.address1 || order.shipping?.address1) && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 border-t border-black/8 pt-4">
                {order.billing?.address1 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-black/45 mb-1">
                      Billing Address
                    </p>
                    <div className="text-xs leading-5 text-black/65">
                      <p className="font-semibold text-black">{order.billing.firstName} {order.billing.lastName}</p>
                      {order.billing.company && <p>{order.billing.company}</p>}
                      <p>{order.billing.address1}</p>
                      {order.billing.address2 && <p>{order.billing.address2}</p>}
                      <p>{order.billing.city}{order.billing.state ? `, ${order.billing.state}` : ""} {order.billing.postcode}</p>
                      <p>{order.billing.country}</p>
                      {order.billing.phone && <p className="mt-1">{order.billing.phone}</p>}
                    </div>
                  </div>
                )}
                {order.shipping?.address1 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-black/45 mb-1">
                      Shipping Address
                    </p>
                    <div className="text-xs leading-5 text-black/65">
                      <p className="font-semibold text-black">{order.shipping.firstName} {order.shipping.lastName}</p>
                      {order.shipping.company && <p>{order.shipping.company}</p>}
                      <p>{order.shipping.address1}</p>
                      {order.shipping.address2 && <p>{order.shipping.address2}</p>}
                      <p>{order.shipping.city}{order.shipping.state ? `, ${order.shipping.state}` : ""} {order.shipping.postcode}</p>
                      <p>{order.shipping.country}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment method */}
            {order.paymentMethodTitle && (
              <div className="mt-3 border-t border-black/8 pt-3">
                <p className="text-xs text-black/45">
                  <span className="font-bold uppercase tracking-wider">Payment: </span>
                  {order.paymentMethodTitle}
                </p>
              </div>
            )}
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
