# تمور الحرمين | Tmoor Alharmain

Arabic-first, RTL/LTR bilingual storefront with a server-authenticated store-management dashboard, backed by PostgreSQL (Neon).

## Start

```sh
npm ci
cp .env.example .env.local
# Set DATABASE_URL to your Neon connection string.
# Set ADMIN_EMAIL and a unique ADMIN_PASSWORD (12+ characters) privately in .env.local.
npm run db:init
npm run dev
```

Open the storefront on port 3000. There is no demo admin account or password bypass — the admin user is created on first start from `ADMIN_EMAIL`/`ADMIN_PASSWORD` and stored as a salted scrypt hash. Without those environment variables, the storefront runs but no admin is provisioned. See [HANDOVER.md](HANDOVER.md) for the full bilingual owner guide.

## Features

- Arabic/English storefront and dashboard
- Product CRUD, bilingual content, multiple images, regular/sale prices, categories, stock and visibility
- Product search, cart quantities, guest checkout with server-side pricing and stock validation
- Admin-only coupon management with public code validation, carrier and city-based shipping fees
- Orders, status updates, tracking numbers, explicit COD collection and dashboard new-order indicators
- Editable homepage, social/contact details and localized SEO metadata
- Session-cookie authentication, rate limiting and admin-only write access on every mutating endpoint
- Durable storage in PostgreSQL (Neon) and a private full-backup script

**Payments:** cash on delivery only until a company-owned gateway is integrated. Online methods are clearly unavailable; unpaid orders are never marked paid.

**No demo mode:** new stores start with no sample products/orders/coupons; carriers are disabled until the owner enters real fees and enables them.

**Launch status:** external notifications, tracking/consent, domain, hosting, real owner credentials, legal content and provider-specific gateway integration are not configured. Nothing uses a developer-owned paid account.

## Database

All application data (products, orders, coupons, CMS content, shipping options and users) is stored as a single JSON document in one PostgreSQL table (`kv_store`), so the schema is minimal and the app owns its own data shape. See [db/schema.sql](db/schema.sql). Run `npm run db:init` once against a fresh Neon database to create the table, and `npm run db:reset` to wipe stored data (the app then starts with an empty catalog again).

## Verify and deploy

```sh
npm run lint
npm test
npm run build:full
NODE_ENV=production npm start
```

Use HTTPS with a reverse proxy or Vercel. `DATABASE_URL` (and optionally `DATABASE_URL_UNPOOLED`) must point at your own Neon project — never commit real connection strings or passwords to this repository.

## Backup

```sh
bash scripts/backup.sh
```

Backups are private and ignored by Git. Keep encrypted copies outside the server, under your company's account. The admin dashboard's **Backup & handover** tab also exports current store data on demand.

## Browser regression

After building, `scripts/test-browser.mjs` runs the real browser checkout/admin regression against an isolated temporary database. Install Playwright and its Chromium browser in your test environment first, then run `npm run test:browser`.
