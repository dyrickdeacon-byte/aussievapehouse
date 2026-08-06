# VapeAussie

Next.js storefront with a scraped product catalog and a compliance-first
pathway for the Australian market (pharmacy-only supply + consultation flow).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Product data served from `catalog/products.json` (no database yet)
- Cart state client-side in `localStorage` (no checkout/payments yet)

## Develop

```bash
npm install
npm run dev
```

## Catalog

The catalog is scraped from the supplier site's public WooCommerce Store API:

```bash
node scripts/scrape-catalog.mjs
```

Outputs to `catalog/`:

- `products.json` — 2,566 cleaned products (committed; the app reads this)
- `products.csv` — spreadsheet-friendly summary
- `images/` — ~6,000 product images, 838MB (**git-ignored**; product pages
  currently hotlink the supplier's image URLs — move these to a CDN such as
  Vercel Blob or Cloudinary before launch)

The scraper is resumable — re-running it skips images already on disk.

## Not built yet

- Checkout / payments (`/checkout` is a stub)
- Variant-level pricing (variable products add at base price)
- Pharmacy finder + consultation booking (`/pharmacy` is a designed stub)
- Region gating (AU visitors should be routed to the pharmacy pathway
  instead of the cart)
