"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { clearCart, removeItem, updateQuantity } from "@/store/cartSlice";
import { useServerStatus } from "@/context/ServerStatus";
import { useCartTotals } from "@/hooks/useCartTotals";
import CouponForm from "@/components/cart/CouponForm";
import ProductImage from "@/components/ProductImage";

function parsePrice(input: string | null | undefined): number {
  if (!input || typeof input !== "string") return 0;
  const cleaned = input.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalised: string;
  if (lastComma === -1 && lastDot === -1) {
    normalised = cleaned;
  } else if (lastComma > lastDot) {
    normalised = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalised = cleaned.replace(/,/g, "");
  }
  const value = parseFloat(normalised);
  return Number.isFinite(value) ? value : 0;
}

function formatMoney(value: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const { serverDown } = useServerStatus();
  const { totals, loading: totalsLoading, selectedShippingMethodId, setSelectedShippingMethodId } = useCartTotals();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const localSubtotal = items.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0
  );
  const subtotal = totals?.subtotal ?? localSubtotal;
  const total = totals?.total ?? localSubtotal;

  if (!hasMounted || items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[960px] flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tight text-black">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm text-black/60">
          Add products from the catalog to start your wholesale order.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-12 items-center justify-center bg-black px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>›</span>
          <Link href="/products" className="hover:text-black">
            Shop
          </Link>
          <span>›</span>
          <span>Cart</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-16">
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <section className="border border-black/10 bg-white">
            <div className="hidden grid-cols-[100px_1.4fr_120px_180px_140px] gap-4 border-b border-black/10 px-6 py-5 text-xs font-black uppercase tracking-[0.18em] text-black/60 md:grid">
              <span />
              <span>Product</span>
              <span>Status</span>
              <span>Quantity</span>
              <span className="text-right">Subtotal</span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 border-b border-black/10 px-6 py-6 md:grid-cols-[100px_1.4fr_120px_180px_140px] md:items-center"
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => dispatch(removeItem(item.id))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/15 text-black/50 transition hover:bg-black hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="relative h-20 w-20 overflow-hidden bg-[#f5f5f5]">
                    <ProductImage
                      src={item.imageUrl || null}
                      alt={item.name}
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>
                </div>

                <div>
                  <Link
                    href={item.slug ? `/product/${item.slug}` : "/products"}
                    className="text-xl font-semibold tracking-tight text-black"
                  >
                    {item.name}
                  </Link>
                </div>

                <div className="text-sm font-semibold text-black/55">In stock</div>

                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center border border-black/10">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            id: item.id,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        )
                      }
                      className="inline-flex h-10 w-10 items-center justify-center"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="inline-flex min-w-10 items-center justify-center text-lg font-black">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            id: item.id,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                      className="inline-flex h-10 w-10 items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-black/55">{item.price}</div>
                </div>

                <div className="text-left text-base font-bold text-black md:text-right">
                  {formatMoney(parsePrice(item.price) * item.quantity)}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-end">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => dispatch(clearCart())}
                  className="inline-flex h-12 items-center justify-center bg-[#1d232d] px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-black"
                >
                  Clear cart
                </button>
              </div>
            </div>
          </section>

          <div className="flex h-fit flex-col gap-6">
          <CouponForm totals={totals} loading={totalsLoading} disabled={serverDown} />

          <aside className="h-fit border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tight text-black">
                Cart Totals
              </h2>
              {totalsLoading && <Loader2 className="h-5 w-5 animate-spin text-black/40" />}
            </div>

            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <span className="font-bold text-black">Subtotal</span>
                <span className="font-semibold text-black/70">
                  {totals?.subtotalFormatted ?? formatMoney(subtotal)}
                </span>
              </div>

              {/* Discounts (dynamic per applied coupon) */}
              {totals?.appliedCoupons.map((c) => (
                <div key={c.code} className="flex items-center justify-between border-b border-black/10 pb-4 text-emerald-700">
                  <span className="font-bold uppercase">Coupon: {c.code}</span>
                  <span className="font-semibold">−{c.discountFormatted}</span>
                </div>
              ))}

              {/* Shipping Methods Selector */}
              {totals && totals.shippingMethods.length > 0 && (
                <div className="border-b border-black/10 pb-4">
                  <span className="font-bold text-black block mb-2">Shipping Method</span>
                  <div className="space-y-2">
                    {totals.shippingMethods.map((method) => (
                      <label key={method.id} className="flex items-center justify-between cursor-pointer text-xs">
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="cartShippingMethod"
                            checked={selectedShippingMethodId === method.id}
                            onChange={() => setSelectedShippingMethodId(method.id)}
                            className="accent-black"
                          />
                          <span className="font-semibold text-black/70">{method.label}</span>
                        </span>
                        <span className="font-semibold text-black/70">{method.costFormatted}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Fees (dynamic) */}
              {totals?.fees.map((fee, i) => (
                <div key={i} className="flex items-center justify-between border-b border-black/10 pb-4">
                  <span className="font-bold text-black">{fee.name}</span>
                  <span className="font-semibold text-black/70">{fee.totalFormatted}</span>
                </div>
              ))}

              {/* Tax lines (dynamic — every WooCommerce tax label) */}
              {totals?.taxLines.map((t, i) => (
                <div key={i} className="flex items-center justify-between border-b border-black/10 pb-4">
                  <span className="font-bold text-black">{t.label}</span>
                  <span className="font-semibold text-black/70">{t.totalFormatted}</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black uppercase tracking-tight text-black">Total</span>
                <span className="text-4xl font-black tracking-tight text-black">
                  {totals?.totalFormatted ?? formatMoney(total)}
                </span>
              </div>
            </div>

            {serverDown ? (
              <div className="mt-10 inline-flex h-14 w-full cursor-not-allowed items-center justify-center gap-3 bg-black/30 text-sm font-black uppercase tracking-[0.16em] text-white">
                Checkout Unavailable
              </div>
            ) : (
              <Link
                href="/checkout"
                className="mt-10 inline-flex h-14 w-full items-center justify-center gap-3 bg-[#1d232d] text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-black"
              >
                Proceed to checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
