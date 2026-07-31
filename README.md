# HEDY STORE — Headless WooCommerce with Next.js

A production-grade **headless WooCommerce** storefront built with **Next.js 14
(App Router)**. WordPress/WooCommerce is the commerce engine; all customer UI is
rendered by React. Product reads use the WooCommerce **Store API**; auth,
orders, checkout, quotes, pricing, and brand/category filtering use a **custom
REST API** (`custom-woo/v1`) added through one snippet.

> 📖 Full technical docs: **[DOCUMENTATION.md](./DOCUMENTATION.md)**

## Features

- 🛍️ **Catalog** — home, shop, category (hierarchical), brand & tag archives, product pages with an interactive gallery.
- 🔎 **Filtering** — multi-select **brand** + **category** (`?brand=`, `?category=`), price range, search, sort.
- 💰 **Customer-specific pricing** — role/group prices per logged-in user, with loading skeletons and add-to-cart guards so the cart always captures the correct price.
- 🛒 **Cart & checkout** — live tax/shipping/fees/excise/coupons computed from the backend, modern coupon UI, dynamic payment methods.
- 💳 **Payments** — offline methods finalize instantly (On-hold); card/eCheck gateways redirect to a **theme-matched** WooCommerce order-pay page and return to a headless thank-you page. PCI-safe (no card data touches the app).
- 👤 **Accounts** — guarded account area: orders (with "Pay now"), multi-item **quote requests**, addresses, settings.
- ⚡ **Resilient** — disk-cached SSR, server-down banner + degraded mode, traffic-driven health checks.
- 🔧 **SEO/AEO/GEO** — metadata, canonical, OpenGraph, robots/sitemap/manifest, Organization/Product/Breadcrumb structured data, answer-engine crawler allow-list.

## Tech stack

Next.js 14 · React · Redux Toolkit · Tailwind CSS · framer-motion · WooCommerce Store API · custom WordPress REST API · JWT auth.

## Quick start

```bash
npm install

# .env.local
# NEXT_PUBLIC_REST_URL=https://your-store.cloudwaysapps.com/wp-json
# NEXT_PUBLIC_SITE_URL=https://hedy.store
# (see DOCUMENTATION.md §2 for MAIN_CATEGORY_SLUGS, BRAND_FILTERS, etc.)

npm run dev      # http://localhost:3000
npm run build && npm start
```

**WordPress side:** paste [`functions-php-snippet.php`](./functions-php-snippet.php)
into the WooCommerce site (Code Snippets or child-theme `functions.php`), set the
`define()` constants, activate **JWT Authentication for WP REST API**, and add
your frontend origin to the snippet's CORS allow-list.

## Project structure

```
src/
  app/           App Router pages (home, products, category, product, cart,
                 checkout, account, thank-you) + robots/sitemap/manifest/OG
  components/    Header, ProductCatalog, product cards, gallery, structured data
  context/       ServerStatus, CustomerPricing
  lib/           store-api, cart-api, auth-api, category-nav, seo, env, caching
  store/         Redux (cart, auth, quote) + localStorage persistence
functions-php-snippet.php   Custom WooCommerce REST API + order-pay theming
DOCUMENTATION.md            Full technical documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | Lint |

---

See **[DOCUMENTATION.md](./DOCUMENTATION.md)** for the API reference, data flow,
state management, checkout/payment flow, and operational notes.
