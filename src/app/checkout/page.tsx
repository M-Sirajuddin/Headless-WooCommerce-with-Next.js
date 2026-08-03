"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { clearCart } from "@/store/cartSlice";
import {
  placeOrder,
  type CheckoutAddress,
  type PlacedOrder,
  getPaymentGateways,
  type PaymentGateway,
} from "@/lib/mock";
import { useCartTotals } from "@/hooks/useCartTotals";
import CouponForm from "@/components/cart/CouponForm";
import { CheckCircle, Loader2, AlertCircle, ShoppingBag } from "lucide-react";

const FALLBACK_PAYMENT_METHODS = [
  {
    id: "cheque",
    label: "Charge Payment Method on File",
    title: "Charge Payment Method on File",
    description:
      "By selecting this option, your default payment method on file with GenRev LLC will be automatically charged.",
  },
  {
    id: "rep",
    label: "Pay Through My Representative",
    title: "Pay Through Representative",
    description: "Cash, check, Zelle, wire — coordinated through your sales rep.",
  },
  {
    id: "bacs",
    label: "eCheck / Bank Account",
    title: "eCheck / Bank Transfer",
    description: "Send payment directly through your bank account.",
  },
  {
    id: "stripe",
    label: "Credit / Debit Card",
    title: "Credit Card",
    description: "Secure card payment processed via Stripe.",
  },
];

function parsePrice(input: string | null | undefined): number {
  if (!input || typeof input !== "string") return 0;
  const cleaned = input.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;
  const normalised = cleaned.includes(",") && !cleaned.includes(".")
    ? cleaned.replace(",", ".")
    : cleaned.replace(/,/g, "");
  return Number.parseFloat(normalised) || 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

const emptyAddr = (): CheckoutAddress & { zip: string; notes: string } => ({
  firstName: "", lastName: "", company: "", country: "", address1: "",
  address2: "", city: "", state: "", postcode: "", zip: "", phone: "", email: "", notes: "",
});

function validateAddress(addr: ReturnType<typeof emptyAddr>, label: string, requireEmail = false) {
  const errors: string[] = [];
  if (!addr.firstName.trim()) errors.push(`${label}: First name is required`);
  if (!addr.lastName.trim()) errors.push(`${label}: Last name is required`);
  if (!addr.address1.trim()) errors.push(`${label}: Street address is required`);
  if (!addr.city.trim()) errors.push(`${label}: City is required`);
  if (!addr.state.trim()) errors.push(`${label}: State is required`);
  if (!(addr.zip || addr.postcode).trim()) errors.push(`${label}: ZIP code is required`);
  if (!addr.country.trim()) errors.push(`${label}: Country is required`);
  if (!addr.phone?.trim()) errors.push(`${label}: Phone is required`);
  if (requireEmail && !addr.email?.trim()) errors.push(`${label}: Email is required`);
  return errors;
}

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  const coupons = useAppSelector((state) => state.cart.coupons);

  const [hasMounted, setHasMounted] = useState(false);
  const [gateways, setGateways] = useState(
    FALLBACK_PAYMENT_METHODS.map(({ id, label, title, description }) => ({ id, title: title || label, description }))
  );
  const [paymentMethod, setPaymentMethod] = useState(FALLBACK_PAYMENT_METHODS[0].id);
  const [shipToDifferent, setShipToDifferent] = useState(false);
  const [billing, setBilling] = useState(emptyAddr());
  const [shipping, setShipping] = useState(emptyAddr());
  const [submitting, setSubmitting] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    setHasMounted(true);
    if (user) {
      const b = user.billing;
      const s = user.shipping;
      setBilling((prev) => ({
        ...prev,
        firstName: b?.firstName || user.firstName || "",
        lastName: b?.lastName || user.lastName || "",
        company: b?.company || "",
        country: b?.country || "",
        address1: b?.address1 || "",
        address2: b?.address2 || "",
        city: b?.city || "",
        state: b?.state || "",
        postcode: b?.postcode || "",
        zip: b?.postcode || "",
        phone: b?.phone || "",
        email: b?.email || user.email || "",
      }));
      if (s?.address1) {
        setShipToDifferent(true);
        setShipping((prev) => ({
          ...prev,
          firstName: s.firstName || "",
          lastName: s.lastName || "",
          company: s.company || "",
          country: s.country || "",
          address1: s.address1 || "",
          address2: s.address2 || "",
          city: s.city || "",
          state: s.state || "",
          postcode: s.postcode || "",
          zip: s.postcode || "",
          phone: s.phone || "",
        }));
      }
    }
  }, [user]);

  // Load enabled payment gateways from WooCommerce (fallback stays if it fails).
  useEffect(() => {
    let cancelled = false;
    getPaymentGateways()
      .then((gws) => {
        if (cancelled || !gws.length) return;
        const mapped = gws
          .sort((a, b) => a.order - b.order)
          .map((g: PaymentGateway) => ({ id: g.id, title: g.title, description: g.description }));
        setGateways(mapped);
        setPaymentMethod((cur) => (mapped.some((m) => m.id === cur) ? cur : mapped[0].id));
      })
      .catch(() => {
        /* keep fallback methods */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const localSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0),
    [items]
  );

  // Destination for tax + shipping calculation.
  const destAddr = shipToDifferent ? shipping : billing;
  const destination = useMemo(
    () => ({
      country: destAddr.country,
      state: destAddr.state,
      postcode: destAddr.zip || destAddr.postcode,
      city: destAddr.city,
    }),
    [destAddr.country, destAddr.state, destAddr.zip, destAddr.postcode, destAddr.city]
  );

  const { totals, loading: totalsLoading, selectedShippingMethodId, setSelectedShippingMethodId } = useCartTotals(destination);

  const subtotal = totals?.subtotal ?? localSubtotal;
  const shippingTotal = totals?.shippingTotal ?? 0;
  const taxTotal = totals?.taxTotal ?? 0;
  const total = totals?.total ?? localSubtotal;

  const selectedMethod =
    gateways.find((m) => m.id === paymentMethod) ?? gateways[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const errs = [
      ...validateAddress(billing, "Billing", true),
      ...(shipToDifferent ? validateAddress(shipping, "Shipping") : []),
    ];
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const billingAddr: CheckoutAddress = {
        firstName: billing.firstName,
        lastName: billing.lastName,
        company: billing.company,
        address1: billing.address1,
        address2: billing.address2,
        city: billing.city,
        state: billing.state,
        postcode: billing.zip || billing.postcode,
        country: billing.country,
        phone: billing.phone,
        email: billing.email,
      };

      const shippingAddr: CheckoutAddress | undefined = shipToDifferent
        ? {
            firstName: shipping.firstName,
            lastName: shipping.lastName,
            company: shipping.company,
            address1: shipping.address1,
            address2: shipping.address2,
            city: shipping.city,
            state: shipping.state,
            postcode: shipping.zip || shipping.postcode,
            country: shipping.country,
            phone: shipping.phone,
          }
        : undefined;

      const order = await placeOrder(token, {
        billing: billingAddr,
        shipping: shippingAddr,
        shipToDifferentAddress: shipToDifferent,
        paymentMethod: selectedMethod.id,
        paymentMethodTitle: selectedMethod.title,
        customerNote: billing.notes,
        lineItems: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        coupons,
        shippingMethodId: selectedShippingMethodId,
      });

      dispatch(clearCart());

      // If the chosen gateway needs payment, embed WooCommerce's order-pay
      // form (real gateway fields, PCI-compliant) inside this page via iframe.
      // The order key in the URL authorizes guest payment. On success WooCommerce
      // redirects the iframe to /checkout/thank-you which breaks out to the top.
      if (order.needsPayment && order.paymentUrl) {
        setPayUrl(order.paymentUrl);
        window.location.href = order.paymentUrl;
        return;
      }

      // Offline methods (charge on file / pay via rep) → show confirmation.
      setPlacedOrder(order);
    } catch (err: any) {
      setErrors([err.message || "Failed to place order. Please try again."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Redirect to the secure (themed) WooCommerce payment page ──
  // A full navigation (not iframe) avoids X-Frame-Options / 3-D Secure issues
  // that break framed gateway forms. The pay page is styled to match, and on
  // success WooCommerce returns to /checkout/thank-you.
  if (payUrl) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-4 py-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#1d232d]" />
        <h1 className="mt-6 text-2xl font-black uppercase tracking-tight text-black">
          Redirecting to secure payment…
        </h1>
        <p className="mt-3 text-sm text-black/60">
          Taking you to our secure payment page to complete your order.
        </p>
        <a href={payUrl} className="mt-6 text-xs font-bold text-[#d93b2e] underline underline-offset-2">
          Click here if you're not redirected automatically
        </a>
      </div>
    );
  }

  // ── Empty cart state ──
  if (!hasMounted || (!placedOrder && items.length === 0)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[960px] flex-col items-center justify-center px-4 py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-black/20" strokeWidth={1.5} />
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-black">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm text-black/60">Add products before continuing to checkout.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-12 items-center justify-center bg-black px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  // ── Order success screen ──
  if (placedOrder) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-4 py-20 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" strokeWidth={1.5} />
        <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-black">
          Order Placed!
        </h1>
        <p className="mt-3 text-sm text-black/65">
          Thank you for your order. A confirmation will be sent to your email.
        </p>

        <div className="mt-8 w-full border border-black/10 bg-[#fafafa] p-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-black/55 uppercase tracking-wider text-xs">Order number</span>
            <span className="font-black text-black">#{placedOrder.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-black/55 uppercase tracking-wider text-xs">Payment</span>
            <span className="font-semibold text-black">{selectedMethod.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-black/55 uppercase tracking-wider text-xs">Status</span>
            <span className="font-semibold text-black capitalize">{placedOrder.status?.toLowerCase()}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-black/10 pt-3 mt-1">
            <span className="font-black text-black uppercase tracking-tight">Total</span>
            <span className="font-black text-black text-lg">{placedOrder.total || formatMoney(total)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account/orders"
            className="inline-flex h-12 items-center justify-center bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
          >
            View orders
          </Link>
          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center border border-black px-6 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // ── Checkout form ──
  return (
    <div className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>›</span>
          <Link href="/products" className="hover:text-black">Shop</Link>
          <span>›</span>
          <Link href="/cart" className="hover:text-black">Cart</Link>
          <span>›</span>
          <span>Checkout</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mx-auto max-w-[1440px] px-4 pb-16">
          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <div className="space-y-6">

              {/* Validation errors */}
              {errors.length > 0 && (
                <div className="border border-[#d93b2e]/30 bg-[#d93b2e]/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-[#d93b2e] shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#d93b2e]">
                      Please fix the following errors
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((e, i) => (
                      <li key={i} className="text-xs text-[#d93b2e] font-semibold">{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Billing details ── */}
              <div className="border border-black/10 bg-white p-6">
                <h1 className="text-2xl font-black tracking-tight text-black">Billing details</h1>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="First name" value={billing.firstName} onChange={(v) => setBilling((p) => ({ ...p, firstName: v }))} required />
                  <Field label="Last name" value={billing.lastName} onChange={(v) => setBilling((p) => ({ ...p, lastName: v }))} required />
                </div>
                <div className="mt-4">
                  <Field label="Company name" value={billing.company || ""} onChange={(v) => setBilling((p) => ({ ...p, company: v }))} />
                </div>
                <div className="mt-4">
                  <Field label="Country / Region" value={billing.country} onChange={(v) => setBilling((p) => ({ ...p, country: v }))} required />
                </div>
                <div className="mt-4">
                  <Field label="Street address" value={billing.address1} onChange={(v) => setBilling((p) => ({ ...p, address1: v }))} required placeholder="House number and street name" />
                </div>
                <div className="mt-2">
                  <Field label="" value={billing.address2 || ""} onChange={(v) => setBilling((p) => ({ ...p, address2: v }))} placeholder="Apartment, suite, unit, etc. (optional)" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field label="Town / City" value={billing.city} onChange={(v) => setBilling((p) => ({ ...p, city: v }))} required />
                  <Field label="State" value={billing.state} onChange={(v) => setBilling((p) => ({ ...p, state: v }))} required />
                  <Field label="ZIP Code" value={billing.zip} onChange={(v) => setBilling((p) => ({ ...p, zip: v }))} required />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Phone" value={billing.phone || ""} onChange={(v) => setBilling((p) => ({ ...p, phone: v }))} required />
                  <Field label="Email address" value={billing.email || ""} onChange={(v) => setBilling((p) => ({ ...p, email: v }))} required type="email" />
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-black">Order notes</label>
                  <textarea
                    value={billing.notes}
                    onChange={(e) => setBilling((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    className="min-h-[100px] w-full border border-black/15 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* ── Ship to different address ── */}
              <div className="border border-black/10 bg-white p-6">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={shipToDifferent}
                    onChange={(e) => setShipToDifferent(e.target.checked)}
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-lg font-black tracking-tight text-black">
                    Ship to a different address?
                  </span>
                </label>
                {shipToDifferent && (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="First name" value={shipping.firstName} onChange={(v) => setShipping((p) => ({ ...p, firstName: v }))} required />
                      <Field label="Last name" value={shipping.lastName} onChange={(v) => setShipping((p) => ({ ...p, lastName: v }))} required />
                    </div>
                    <Field label="Company name" value={shipping.company || ""} onChange={(v) => setShipping((p) => ({ ...p, company: v }))} />
                    <Field label="Country / Region" value={shipping.country} onChange={(v) => setShipping((p) => ({ ...p, country: v }))} required />
                    <Field label="Street address" value={shipping.address1} onChange={(v) => setShipping((p) => ({ ...p, address1: v }))} required placeholder="House number and street name" />
                    <Field label="" value={shipping.address2 || ""} onChange={(v) => setShipping((p) => ({ ...p, address2: v }))} placeholder="Apartment, suite, unit, etc. (optional)" />
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Town / City" value={shipping.city} onChange={(v) => setShipping((p) => ({ ...p, city: v }))} required />
                      <Field label="State" value={shipping.state} onChange={(v) => setShipping((p) => ({ ...p, state: v }))} required />
                      <Field label="ZIP Code" value={shipping.zip} onChange={(v) => setShipping((p) => ({ ...p, zip: v }))} required />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Phone" value={shipping.phone || ""} onChange={(v) => setShipping((p) => ({ ...p, phone: v }))} />
                      <Field label="Email address" value={shipping.email || ""} onChange={(v) => setShipping((p) => ({ ...p, email: v }))} type="email" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Order summary + payment sidebar ── */}
            <aside className="h-fit border border-black/10 bg-white p-6">
              <Link
                href="/cart"
                className="inline-flex h-12 w-full items-center justify-center bg-black text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#1d232d]"
              >
                Edit cart
              </Link>

              <div className="mt-8">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black">Your order</h2>
                <div className="mt-4 divide-y divide-black/5 border-b border-black/10 pb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                      <div className="leading-5 text-black/70">
                        {item.name}
                        <span className="ml-1 font-semibold text-black">× {item.quantity}</span>
                      </div>
                      <div className="shrink-0 font-semibold text-black">{item.price}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 py-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">Subtotal</span>
                    <span className="font-semibold text-black/70">
                      {totals?.subtotalFormatted ?? formatMoney(subtotal)}
                    </span>
                  </div>

                  {/* Applied coupon discounts */}
                  {totals?.appliedCoupons.map((c) => (
                    <div key={c.code} className="flex items-center justify-between text-emerald-700">
                      <span className="font-bold uppercase">Coupon: {c.code}</span>
                      <span className="font-semibold">−{c.discountFormatted}</span>
                    </div>
                  ))}

                  {/* Shipping Methods Selector */}
                  {totals && totals.shippingMethods.length > 0 ? (
                    <div className="border-t border-b border-black/5 py-3 space-y-2">
                      <span className="font-bold text-black block text-xs uppercase tracking-wider">Shipping Method</span>
                      {totals.shippingMethods.map((method) => (
                        <label key={method.id} className="flex items-center justify-between cursor-pointer text-xs">
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="checkoutShippingMethod"
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
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">Shipping</span>
                      <span className="font-semibold text-black/70">
                        {totals ? totals.shippingFormatted : formatMoney(shippingTotal)}
                      </span>
                    </div>
                  )}

                  {/* Fees (dynamic) */}
                  {totals?.fees.map((fee, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-bold text-black">{fee.name}</span>
                      <span className="font-semibold text-black/70">{fee.totalFormatted}</span>
                    </div>
                  ))}

                  {/* Tax lines (dynamic labels from WooCommerce) */}
                  {totals ? (
                    totals.taxLines.map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="font-bold text-black">{t.label}</span>
                        <span className="font-semibold text-black/70">{t.totalFormatted}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">Tax</span>
                      <span className="font-semibold text-black/70">{formatMoney(taxTotal)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-black/10 pt-3">
                    <span className="text-lg font-black uppercase tracking-tight text-black">Total</span>
                    <span className="flex items-center gap-2 text-2xl font-black tracking-tight text-black">
                      {totalsLoading && <Loader2 className="h-4 w-4 animate-spin text-black/40" />}
                      {totals?.totalFormatted ?? formatMoney(total)}
                    </span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="border-t border-black/10 pt-5">
                  <CouponForm totals={totals} loading={totalsLoading} />
                </div>
              </div>

              {/* Payment methods */}
              <div className="border-t border-black/10 pt-5">
                <h3 className="text-base font-black uppercase tracking-tight text-black">Payment method</h3>
                <div className="mt-4 space-y-3">
                  {gateways.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
                        paymentMethod === method.id
                          ? "border-black bg-black/[0.03] ring-1 ring-black"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="mt-0.5 accent-black"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-black">{method.title}</span>
                        {paymentMethod === method.id && method.description && (
                          <span className="mt-1 block text-xs text-black/55 leading-5">
                            {method.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 bg-[#1d232d] text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-black disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing order...
                  </>
                ) : (
                  "Place order"
                )}
              </button>

              <p className="mt-3 text-center text-xs text-black/40">
                Your personal data will be used to process your order.
              </p>
            </aside>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, required = false, type = "text", placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-semibold text-black">
          {label}{required && <span className="text-[#d93b2e]"> *</span>}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full border border-black/15 bg-white px-4 text-sm outline-none focus:border-black"
      />
    </label>
  );
}

