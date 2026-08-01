import { REST_URL } from "./env";
import type { UserDetails, UserAddress } from "@/store/authSlice";
import { reportResponse, reportFetchError } from "./server-status-signal";

const CWOO = `${REST_URL.replace(/\/$/, "")}/custom-woo/v1`;

function cleanErrorMessage(msg: string): string {
  if (!msg) return "";
  return msg.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

async function restFetch<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res: Response;
  try {
    res = await fetch(`${CWOO}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    });
  } catch (err) {
    reportFetchError(err);
    throw err;
  }
  reportResponse(res);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message || `HTTP ${res.status}`;
    throw Object.assign(new Error(cleanErrorMessage(msg)), { status: res.status });
  }
  return json as T;
}

// ── LOGIN ─────────────────────────────────────────────────────
export async function loginUser(username: string, password: string) {
  try {
    const res = await fetch(`${REST_URL.replace(/\/$/, "")}/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const rawMsg = errJson.message || `HTTP error ${res.status}`;
      const cleanedMsg = cleanErrorMessage(rawMsg);
      const err = new Error(cleanedMsg);
      if (
        res.status === 403 ||
        res.status === 401 ||
        rawMsg.toLowerCase().includes("password") ||
        rawMsg.toLowerCase().includes("username") ||
        rawMsg.toLowerCase().includes("incorrect") ||
        rawMsg.toLowerCase().includes("invalid")
      ) {
        (err as any).isAuthError = true;
      }
      throw err;
    }

    const data = await res.json();
    return {
      token: data.token as string,
      user: {
        id: data.id || 1,
        username: data.user_nicename || username,
        email: data.user_email || "",
        firstName: data.user_display_name?.split(" ")[0] || "",
        lastName: data.user_display_name?.split(" ")[1] || "",
      } as UserDetails,
    };
  } catch (error: any) {
    if (error.isAuthError) throw error;
    console.warn("[auth-api] Token endpoint error:", error);
    throw new Error("Invalid username/password or authentication server is unreachable.");
  }
}

// ── REGISTER ─────────────────────────────────────────────────
export async function registerUser(username: string, email: string, password: string) {
  try {
    const data = await restFetch<{ id: number; username: string; email: string }>(
      "/register",
      null,
      { method: "POST", body: JSON.stringify({ username, email, password }) }
    );
    return data;
  } catch (error: any) {
    console.error("[auth-api] Registration failed:", error);
    const err = new Error(error.message || "Failed to register account.");
    (err as any).isGraphQlError = true; // keep compat with error handling in UI
    throw err;
  }
}

// ── FETCH USER PROFILE ───────────────────────────────────────
export async function fetchUserProfile(token: string): Promise<UserDetails> {
  try {
    const data = await restFetch<any>("/customer", token, { method: "GET" });

    const hasAddress = (a: any) => a && (a.address1 || a.city || a.postcode);

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      nickname: data.nickname || data.username || "",
      displayName: data.displayName || `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.username,
      billing: hasAddress(data.billing) ? {
        firstName: data.billing.firstName || "",
        lastName: data.billing.lastName || "",
        company: data.billing.company || "",
        address1: data.billing.address1 || "",
        address2: data.billing.address2 || "",
        city: data.billing.city || "",
        state: data.billing.state || "",
        postcode: data.billing.postcode || "",
        country: data.billing.country || "",
        phone: data.billing.phone || "",
        email: data.billing.email || "",
      } : undefined,
      shipping: hasAddress(data.shipping) ? {
        firstName: data.shipping.firstName || "",
        lastName: data.shipping.lastName || "",
        company: data.shipping.company || "",
        address1: data.shipping.address1 || "",
        address2: data.shipping.address2 || "",
        city: data.shipping.city || "",
        state: data.shipping.state || "",
        postcode: data.shipping.postcode || "",
        country: data.shipping.country || "",
        phone: data.shipping.phone || "",
      } : undefined,
    };
  } catch (error) {
    console.error("[auth-api] fetchUserProfile error:", error);
    throw error;
  }
}

// ── UPDATE PROFILE ───────────────────────────────────────────
export async function updateUserProfile(
  token: string,
  _userId: number,
  profileData: { firstName: string; lastName: string; email: string; displayName?: string }
) {
  try {
    const data = await restFetch<any>("/customer", token, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    return data;
  } catch (error) {
    console.error("[auth-api] updateUserProfile error:", error);
    throw error;
  }
}

// ── UPDATE ADDRESSES ─────────────────────────────────────────
export async function updateUserAddresses(
  token: string,
  billing: UserAddress,
  shipping: UserAddress
) {
  try {
    const data = await restFetch<any>("/customer/addresses", token, {
      method: "PUT",
      body: JSON.stringify({ billing, shipping }),
    });
    return data;
  } catch (error) {
    console.error("[auth-api] updateUserAddresses error:", error);
    throw error;
  }
}

// ── FETCH ORDERS ─────────────────────────────────────────────
export async function fetchUserOrders(token: string): Promise<any[]> {
  try {
    const data = await restFetch<any[]>("/orders", token, { method: "GET" });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[auth-api] fetchUserOrders error:", error);
    return [];
  }
}

// ── CHECKOUT TYPES ───────────────────────────────────────────
export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface CheckoutPayload {
  billing: CheckoutAddress;
  shipping?: CheckoutAddress;
  shipToDifferentAddress: boolean;
  paymentMethod: string;
  paymentMethodTitle: string;
  customerNote?: string;
  lineItems: Array<{ id: string; quantity: number }>;
  coupons?: string[];
  shippingMethodId?: string | null;
}

export interface PlacedOrder {
  orderId?: number;
  orderNumber: string;
  orderKey?: string;
  total: string;
  status: string;
  date: string;
  /** Whether this order still requires payment (false for offline methods). */
  needsPayment?: boolean;
  /** WooCommerce hosted order-pay URL — renders the real gateway fields. */
  paymentUrl?: string;
}

// ── PLACE ORDER ───────────────────────────────────────────────
export async function placeOrder(
  token: string | null,
  payload: CheckoutPayload
): Promise<PlacedOrder> {
  const body = {
    billing: payload.billing,
    shipping: payload.shipping,
    ship_to_different: payload.shipToDifferentAddress,
    payment_method: payload.paymentMethod,
    payment_method_title: payload.paymentMethodTitle,
    customer_note: payload.customerNote || "",
    coupons: payload.coupons || [],
    shippingMethodId: payload.shippingMethodId,
    // IDs are already numeric strings from AddToCartButton (String(product.databaseId))
    line_items: payload.lineItems.map((item) => ({
      product_id: parseInt(item.id, 10),
      quantity: item.quantity,
    })),
  };

  const data = await restFetch<PlacedOrder>("/checkout", token, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return data;
}

// ── QUOTE REQUESTS ───────────────────────────────────────────
export async function fetchQuoteRequests(token: string): Promise<any[]> {
  try {
    const data = await restFetch<any[]>("/quotes", token, { method: "GET" });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[auth-api] fetchQuoteRequests error:", error);
    return [];
  }
}

export async function submitQuoteRequest(
  token: string,
  payload: { product_name: string; quantity: number; notes: string }
): Promise<{ id: number }> {
  return restFetch<{ id: number }>("/quotes", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Submit a single quote request covering MULTIPLE products. Composes a
 * combined summary + itemised notes and reuses the existing /quotes endpoint,
 * so no backend change is required.
 */
export async function submitMultiQuoteRequest(
  token: string,
  payload: {
    items: Array<{ name: string; quantity: number; price?: string }>;
    notes?: string;
  }
): Promise<{ id: number }> {
  const { items, notes } = payload;
  const product_name = items.map((i) => `${i.name} (x${i.quantity})`).join("; ");
  const quantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemized = items
    .map((i) => `- ${i.name}${i.price ? ` @ ${i.price}` : ""} × ${i.quantity}`)
    .join("\n");
  const fullNotes = [notes?.trim(), "Requested items:", itemized]
    .filter(Boolean)
    .join("\n");
  return submitQuoteRequest(token, { product_name, quantity, notes: fullNotes });
}

// ── CUSTOMER-SPECIFIC PRICES ─────────────────────────────────
export interface CustomerPrice {
  price: number | null;
  currency: string;
}

export async function fetchCustomerPrices(
  token: string,
  ids: number[]
): Promise<Record<string, CustomerPrice>> {
  if (!ids.length) return {};
  try {
    const data = await restFetch<Record<string, CustomerPrice>>("/prices", token, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
    return data && typeof data === "object" ? data : {};
  } catch (error) {
    console.error("[auth-api] fetchCustomerPrices error:", error);
    return {};
  }
}

export interface OrderStatus {
  orderNumber: string;
  status: string;
  isPaid: boolean;
  total: string;
  date: string;
  paymentMethodTitle: string;
  email: string;
  items: Array<{ name: string; quantity: number; total: string }>;
}

export async function getOrderStatus(order: string, key: string): Promise<OrderStatus> {
  const res = await fetch(
    `${CWOO}/order-status?order=${encodeURIComponent(order)}&key=${encodeURIComponent(key)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Order not found.");
  return (await res.json()) as OrderStatus;
}

export async function forgotPasswordRequest(_email: string) {
  return true;
}

export async function resetPasswordSubmit(_password: string) {
  return true;
}
