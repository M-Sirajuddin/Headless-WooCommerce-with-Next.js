# HEDY STORE — Headless WooCommerce Documentation

A **Next.js 14 (App Router)** headless storefront backed by **WooCommerce**. The
WordPress/WooCommerce site is the data + commerce engine; all customer-facing
UI is rendered by the React frontend. Product reads use the WooCommerce **Store
API**; account, orders, checkout, quotes, pricing, and filtered listings use a
**custom REST API** added via a single snippet (`functions-php-snippet.php`).

---

## 1. Architecture

```
┌─────────────────────────┐        Store API (/wc/store/v1)         ┌───────────────────────┐
│  Next.js 14 (frontend)  │ ─────  products, categories, cart  ───► │  WooCommerce (WP)      │
│  App Router + Redux      │                                         │  + custom-woo/v1 API   │
│  Tailwind + framer-motion│ ─────  custom-woo/v1  ────────────────► │  (functions.php snippet)│
└─────────────────────────┘   auth, orders, checkout, quotes,        └───────────────────────┘
                              prices, cart-totals, gateways
```

- **Frontend origin** (e.g. `http://localhost:3000`) is decoupled from the
  **WordPress origin** (Cloudways).
- Auth is **JWT** (JWT Authentication for WP REST API plugin). The frontend
  stores the token and passes it as `Authorization: Bearer …`.
- The WordPress admin bar, theme header/footer, etc. are never shown to
  customers except on the **hosted order-pay page** (styled to match).

### Key backend files
| File | Purpose |
|------|---------|
| `functions-php-snippet.php` | The entire custom backend — paste into WP (Code Snippets / child `functions.php`). Registers `custom-woo/v1` routes, CORS, wholesale pricing, order-pay theming, filters. |

### Key frontend directories
| Path | Purpose |
|------|---------|
| `src/app/*` | App Router pages (home, products, category, brand, tag, product, cart, checkout, account, thank-you). |
| `src/lib/*` | API clients, env, SEO, category hierarchy, caching. |
| `src/store/*` | Redux Toolkit (cart, auth, quote) + localStorage persistence. |
| `src/context/*` | React contexts (server status, customer pricing). |
| `src/components/*` | UI (Header, catalog, product cards, gallery, structured data). |

---

## 2. Environment variables

Set in `.env.local` (frontend):

```bash
# Required — WordPress REST base (…/wp-json)
NEXT_PUBLIC_REST_URL=https://your-store.cloudwaysapps.com/wp-json

# Public frontend origin (canonical URLs, OG, sitemap, structured data)
NEXT_PUBLIC_SITE_URL=https://hedy.store

# Curated "main" categories for the shop sidebar (slugs, order preserved)
NEXT_PUBLIC_MAIN_CATEGORY_SLUGS=dabs,nicotine,disposables,gummies,flower,pre-rolls-blunts,edibles,cartridges,shrooms,tinctures

# Brand filter options "Name:slug,Name:slug" (product_brand taxonomy slugs)
NEXT_PUBLIC_BRAND_FILTERS=Dazed:dazed,Brixz:brixz,Shrumfuzed:shrumfuzed,MyZen:myzen,Ronin:ronin,7ROX:7rox,Smokin Tenns:smokin-tenns,Hytz:hytz,CannaXtra:cannaxtra,KROX:krox

# Optional ISR / listing tuning
NEXT_PUBLIC_ISR_REVALIDATE_SECONDS=60
NEXT_PUBLIC_STATIC_PRODUCT_LIMIT=20
```

On the WordPress side (`functions-php-snippet.php`):

```php
define( 'CWOO_MAINTENANCE_MODE', false );   // true = 503 all REST (test "server down")
define( 'CWOO_WHOLESALE_USER_ID', 0 );      // impersonate a wholesale user for guest Store API pricing (0 = off)
define( 'CWOO_FRONTEND_URL', 'http://localhost:3000' ); // headless origin (thank-you redirect)
define( 'CWOO_PAY_REF', 'hedy' );           // marker that enables the themed order-pay UI
```

---

## 3. Custom REST API (`custom-woo/v1`)

All added in `functions-php-snippet.php`. Auth-required routes check
`is_user_logged_in()` (JWT resolves the user from the Bearer token).

| Method & Route | Auth | Purpose |
|----------------|------|---------|
| `POST /register` | public | Create WP + WooCommerce customer. |
| `POST /prices` | JWT | Customer/role/group-specific prices for a batch of product IDs (WisdmLabs pricing). |
| `GET /customer` | JWT | Profile + billing/shipping. |
| `PUT /customer` | JWT | Update name/email/display name. |
| `PUT /customer/addresses` | JWT | Update billing/shipping. |
| `GET /orders` | JWT | Order history (incl. `needsPayment` + `paymentUrl`). |
| `POST /checkout` | JWT | Create an order (draft-order engine; tax/shipping/coupons/excise). |
| `GET /quotes`, `POST /quotes` | JWT | List / create quote requests (CPT). |
| `POST /cart-totals` | public (+token) | Live totals via a scratch draft order. |
| `POST /tax-shipping-config` | public (+token) | Tax rates, shipping methods, fees, coupons, per-product excise for **frontend** calculation. |
| `GET /payment-gateways` | public | Enabled gateways. |
| `POST /products` | public | Filtered listing by **product_brand** + category slugs (Store API can't filter brands). |
| `GET /order-status` | public (order key) | Order summary for the thank-you page. |

### Notable backend behaviors
- **Wholesale pricing parity**: guest Store API + custom listings impersonate
  `CWOO_WHOLESALE_USER_ID` so anonymous visitors see one wholesale price.
- **Custom shipping** ("Dazed Shipping Charge") reads `WC()->cart`, so
  cart-totals and checkout populate the real cart before calculating shipping.
- **Excise tax** is returned as **per-product unit amounts** so the frontend
  computes `Σ(unit × qty)` instantly (no stale-fee bug); sales tax is returned
  as **rate + label** for frontend calc.
- **marketing-materials** products are excluded from home/shop/search via the
  `woocommerce_store_api_product_query` filter and the custom `/products`
  endpoint — they appear only on `/category/marketing-materials`.

---

## 4. Data flow & libraries

- `src/lib/store-api.ts` — Store API client (`getStoreProducts`,
  `getStoreCategories`, `getAllStoreCategories`, `getStoreCategoryBySlug`,
  `getFilteredStoreProducts`, `formatStorePrice`). 7s `AbortController` timeout.
- `src/lib/store-api-server.ts` — **server-only** cached wrappers (disk cache in
  `.cache/` via `src/lib/api-cache.ts`) so pages survive an API outage.
- `src/lib/cart-api.ts` — `getTaxShippingConfig` (shared cache + in-flight
  dedup), `getPaymentGateways`. Reports outcomes to the server-status signal.
- `src/lib/auth-api.ts` — auth, profile, orders, checkout (`placeOrder`),
  quotes, `fetchCustomerPrices`, `getOrderStatus`.
- `src/lib/category-nav.ts` — builds single-depth category navigation
  (main → sub-categories → siblings) from the flat category list.
- `src/lib/seo.ts` — central site/brand config for metadata + structured data.

### Categories are (mostly) flat
The store has ~400 categories, most with `parent = 0`, and the Store API ignores
`slug`/`parent` filters. So:
- `getAllStoreCategories()` pages through **all** categories to resolve any slug
  (incl. deep sub-cats like `/category/tabz`).
- The sidebar shows a **curated main list** (`MAIN_CATEGORY_SLUGS`); drilling
  into a category shows its real children, then siblings for a leaf.

---

## 5. State management (Redux Toolkit)

| Slice | State | Persistence |
|-------|-------|-------------|
| `cartSlice` | `items[]`, `coupons[]` | `woo_cart_guest` / `woo_cart_user_{id}` in localStorage |
| `authSlice` | `token`, `user`, `orders`, `hydrated` | token `woo_auth_token`; **user cached** `woo_auth_user` (instant reload, no `/customer` refetch) |
| `quoteSlice` | `items[]` | `woo_quote` |

- `store/Provider.tsx` hydrates auth from the cached user (single-run guard,
  StrictMode-safe) and restores the correct per-user cart/coupons/quote.
- `store/middleware/localStorageMiddleware.ts` persists cart, coupons, cached
  user, and quote on every action.

### Customer-specific pricing (`context/CustomerPricing.tsx`)
Logged-in users have role/group prices. Product cards `register(id)`; the
provider batch-fetches `/prices`. **While a price loads, the UI shows a skeleton
and add-to-cart is disabled** so the cart never captures the default price.

### Server-down handling
- `context/ServerStatus.tsx` + `lib/server-status-signal.ts`: real API calls
  drive status (a 503 / network error → "down"), and `/api/health` is polled
  **only** while down to detect recovery — no idle polling.
- `components/ServerDownBanner.tsx` + disabled cart/checkout when down.

---

## 6. Checkout & payment flow

1. **Cart / checkout** compute totals from `/tax-shipping-config` (tax lines,
   shipping methods, fees, excise, coupons). The config is cached and shared
   across mini-cart, cart, and checkout (normalized destination → one key).
2. **Place order** → `POST /checkout` creates the order.
3. **Offline methods** (Charge-on-File, Pay-through-Rep, bank transfer) →
   order set to **On-hold**, `needsPayment = false` → React shows the
   confirmation directly (no pay page).
4. **Card / eCheck gateways** → order stays **Pending**, `paymentUrl` is
   returned with `…&ref=hedy` → React **redirects** to the WooCommerce
   **order-pay page**.
5. **Order-pay page** (`is_checkout_pay_page()` + `?ref=hedy`):
   - Themed to match HEDY STORE (theme chrome hidden, branded header, styled
     table with a **Status column**, selected-method highlight).
   - **Only the order's chosen gateway** is shown (`woocommerce_available_payment_gateways`).
   - Guests can pay via the order key (a `user_has_cap` filter grants
     `pay_for_order` when the key matches) — no `/login` redirect.
6. **After payment** → `woocommerce_get_return_url` sends the customer to
   **`/checkout/thank-you?order=…&key=…`** (headless), which reads
   `/order-status` and shows a status-driven confirmation
   (failed = red ✕, pending = orange clock, success = green ✓).

> **PCI note:** the app never renders raw card fields or posts card data. The
> gateway's own hosted fields (order-pay page) handle payment.

---

## 7. SEO / AEO / GEO & performance

- Root metadata (`src/app/layout.tsx`): `metadataBase`, canonical, OpenGraph,
  Twitter, robots directives, viewport/theme-color.
- `robots.ts`, `sitemap.ts` (static + categories + products), `manifest.ts`,
  dynamic `opengraph-image.tsx`, `icon.svg`.
- Structured data: `SiteStructuredData` (Organization + WebSite + Store),
  `ProductStructuredData` (Product + Offer + AggregateRating + BreadcrumbList).
- `robots.ts` welcomes answer-engine crawlers (GPTBot, PerplexityBot, ClaudeBot,
  Google-Extended).
- Accessibility: skip link, `<main id>`, `lang`, focus-visible styles.
- Images use the **WooCommerce thumbnail** (~300px) with `unoptimized` on cards,
  cart, and mini-cart, so the same URL is fetched once and reused everywhere.

---

## 8. Feature reference (pages)

| Route | Notes |
|-------|-------|
| `/` | Home — hero slider, "Shop by Category" bubbles, featured products. |
| `/products` | Shop — multi-select **brand** (`?brand=`) + **category** (`?category=`) filters, price, search, sort dropdown, sticky "Reset Filter". |
| `/category/[slug]` | Category archive — hierarchical sidebar (main → sub → siblings), works for deep sub-cats. |
| `/brand/[slug]`, `/tag/[slug]` | Brand / tag archives. |
| `/product/[slug]` | Interactive gallery (prev/next, thumbnails incl. main), collapsible description, Share (native + fallback popover), **Add to Quote**. |
| `/cart`, `/checkout` | Dynamic totals, modern coupon UI, dynamic payment methods. |
| `/checkout/thank-you` | Order confirmation from `/order-status`. |
| `/account/*` | Guarded (redirect to `/login?redirect=`); dashboard, orders (expand + **Pay now** for pending), quotes (multi-item quote list), addresses, settings, logout. |

---

## 9. Running locally

```bash
npm install
# create .env.local with NEXT_PUBLIC_REST_URL etc. (see §2)
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve production build
```

**WordPress setup:** paste `functions-php-snippet.php` into the WooCommerce
site (Code Snippets plugin or child-theme `functions.php`), set the `define()`
constants (§2), and ensure the **JWT Authentication for WP REST API** plugin is
active. Add the frontend origin to the CORS allow-list in the snippet.

---

## 10. Operational notes

- **Maintenance mode:** `CWOO_MAINTENANCE_MODE = true` returns 503 for all REST;
  the frontend serves disk-cached content + a banner and disables cart/checkout.
- **Cache-First Server Caching:** The server retrieves API data from `.cache/` on disk first, resulting in fast pages and low load on the WooCommerce API.
- **Webhook Cache Invalidation:** The server exposes a `/api/webhook` POST endpoint. Configure a WooCommerce webhook on WordPress for `product.updated`, `product.created`, and `product.deleted` targeting this endpoint. This automatically updates or deletes cached files incrementally on the server on any product change.
- **Re-paste the PHP snippet** whenever backend routes/behaviors change — the frontend depends on `custom-woo/v1`.
