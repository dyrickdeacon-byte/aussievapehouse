# Deploying Aussie Vape House

The app runs on any Node host. It's currently set up for **Netlify** —
free tier allows commercial use and includes 100GB/month bandwidth
(Vercel's Hobby plan is non-commercial with 10GB).

## Environment variables

Paste this whole block into the host's env var editor. Netlify:
Site configuration → Environment variables → **Import from a .env file**
(or "Add a variable" → paste key and value one at a time).

```
SUPABASE_URL=https://vdcyciwpuuczrqelshyi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key from Supabase → Project Settings → API Keys>
SMTP_HOST=mail.spacemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@aussievapehouse.com
SMTP_PASS=<the noreply@ mailbox password, from your password manager>
MAIL_FROM=Aussie Vape House <noreply@aussievapehouse.com>
MAIL_REPLY_TO=info@aussievapehouse.com
MAIL_OWNER=info@aussievapehouse.com
ADMIN_PASSWORD=<pick a strong one>
NEXT_PUBLIC_IMAGE_CDN=https://cdn.jsdelivr.net/gh/dyrickdeacon-byte/aussievapehouse@main/public
```

Notes:
- **Never paste real secret values into this file.** It is committed to a
  public repo. Placeholders only — the real values live in the host's
  environment variables and your password manager.
- Paste values **raw** — no quotes, no backslash escaping. (The `\$` in
  `.env.local` is only needed because Next's local loader expands `$var`.)
- `NEXT_PUBLIC_IMAGE_CDN` serves product imagery from jsDelivr's free CDN,
  which mirrors the **public** GitHub repo. Unset it and images serve from
  the host instead (metered). If the repo goes private, run
  `npm run images:upload` and swap in the Supabase bucket URL it prints.

## First deploy (Netlify)

1. netlify.com → **Add new site → Import an existing project** → GitHub →
   `dyrickdeacon-byte/aussievapehouse`
2. Build settings are read from `netlify.toml` — leave them as detected.
3. Add the environment variables above **before** the first build.
4. Deploy. The Next.js runtime plugin handles SSR, API routes and server
   actions automatically.

## Domain

Site configuration → Domain management → Add `aussievapehouse.com` and
`www.aussievapehouse.com`, then follow the DNS instructions shown.

Only one host can serve the domain at a time — remove it from the old host
first, or DNS will keep pointing at the old one.

## One-time Supabase setup

Both are required before orders/settings will persist:

1. SQL Editor → run `supabase/schema.sql` (creates the `store` table).
2. Storage → New bucket → `product-images`, **public** — only needed if you
   plan to serve images from Supabase rather than jsDelivr.

## Post-deploy checks

```bash
node scripts/audit-site.mjs https://your-domain.com    # routes, APIs, content
node scripts/check-images.mjs https://your-domain.com  # every image URL
```

Then in a browser: place a test order and submit the newsletter form —
both should send email to the customer address and to info@.
