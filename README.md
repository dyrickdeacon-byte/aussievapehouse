# Aussie Vape House

Next.js storefront for aussievapehouse.com — dark, conversion-focused design
over a scraped 2,566-product catalog (deduped to ~1,685 live products).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Product data served from `catalog/products.json`, deduped + cleaned at load
  time in `lib/catalog.ts` (no database yet)
- Cart state client-side in `localStorage` (no checkout/payments yet)
- Self-hosted fonts (Bebas Neue display + Inter) in `app/fonts/`
- Site settings in `data/site-settings.json` — WhatsApp number and social
  links; features hide when values are empty (admin panel to edit these is
  planned)

## Develop

```bash
npm install
npm run dev
```

## Catalog

Scraped from the supplier site's public WooCommerce Store API:

```bash
node scripts/scrape-catalog.mjs
```

Outputs to `catalog/`: `products.json` (committed; the app reads this),
`products.csv` (spreadsheet summary), `images/` (~6,000 images, 838MB,
**git-ignored** — product pages hotlink the supplier's image URLs; move to a
CDN before launch). The scraper is resumable.

Catalog quirks handled in `lib/catalog.ts`: ~880 duplicate listings deduped,
HTML entities decoded, broken links stripped from descriptions, source-site
branding rewritten, 57 messy categories collapsed into 9 nav groups.

## Roadmap

- [ ] Product page + shop page redesign to match the new homepage
- [ ] Admin panel: WhatsApp number, social links, livechat embed code
- [ ] Transactional + automation emails (welcome code, form fills, orders —
      notify customer and owner) once an email provider is chosen
- [ ] Checkout / payments
- [ ] Variant-level pricing (variable products add at base price)
- [ ] Livechat embed (code pending from owner)
- [ ] AU-specific compliance pathway (deferred by owner decision)
