# Tmoor Alharmain - Deployment Guide

## Overview
Full-stack e-commerce application for Tmoor Alharmain with a React frontend, an Express backend, and PostgreSQL (Neon) as the single source of truth for store data.

## Admin access
There is no demo admin account or default password. The admin user is created automatically on first server start from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables (see below), hashed with salted scrypt, and stored in the database. Set your own values before the first deploy; do not reuse this file to record real credentials — keep them in your company password manager instead.

## Database
- **Provider**: Neon (PostgreSQL)
- **Storage model**: one table, `kv_store` (see [db/schema.sql](db/schema.sql)), holding the store's products, orders, coupons, CMS content, shipping options and users as a single JSON document
- **Connection**: configured via `DATABASE_URL` (and optionally `DATABASE_URL_UNPOOLED`) in your environment — never commit these values

## Project Structure
```
.
├── src/                 # React frontend source
├── public/              # Static assets
├── server.ts            # Express backend server
├── db/                  # Database scripts
│   ├── schema.sql        # kv_store table definition
│   ├── init.js           # Creates the table on a fresh database
│   └── reset.js          # Clears stored data
├── vercel.json          # Vercel configuration
├── package.json         # Project dependencies
└── .env.local           # Environment variables (not committed)
```

## Local Development

### Prerequisites
- Node.js v20.19.0+
- npm

### Setup
```bash
npm install
cp .env.example .env.local
# Fill in DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD in .env.local
npm run db:init
npm run dev
```

Access the application at `http://localhost:3000`; the API is served at `/api/*` on the same origin.

## Deploying to Vercel

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Link to Vercel
```bash
vercel link
```

### Step 3: Add Environment Variables
In your Vercel project settings (Project → Settings → Environment Variables), add:

```
DATABASE_URL=<your Neon pooled connection string>
DATABASE_URL_UNPOOLED=<your Neon direct connection string>
ADMIN_EMAIL=<your company admin email>
ADMIN_PASSWORD=<a unique password, 12+ characters>
NODE_ENV=production
```

Never paste real values for these into a committed file, chat, or a public issue — set them directly in the Vercel dashboard or via `vercel env add`.

### Step 4: Deploy
```bash
vercel --prod
```

## API Endpoints

### Authentication (cookie-based sessions)
- `POST /api/auth/login` — Login with email and password
- `GET /api/auth/me` — Current session user, if any
- `POST /api/auth/logout` — End the current session
- `POST /api/auth/register` — Register a new customer account

### Products
- `GET /api/products` — List products (hidden products included only for admins)
- `POST /api/products` — Create product (admin)
- `PUT /api/products/:id` — Update product (admin)
- `DELETE /api/products/:id` — Delete product (admin)

### Orders
- `GET /api/orders` — List orders (admin)
- `POST /api/orders` — Create a new order (cash on delivery)
- `PUT /api/orders/:id/status` — Update order status/tracking (admin)
- `PUT /api/orders/:id/collection` — Confirm cash collection after delivery (admin)

### Coupons
- `GET /api/coupons` — List coupons (admin)
- `POST /api/coupons/validate` — Validate a coupon code at checkout
- `POST /api/coupons` — Create coupon (admin)
- `PUT /api/coupons/:id` — Update coupon (admin)
- `DELETE /api/coupons/:id` — Delete coupon (admin)

### Shipping
- `GET /api/shipping` — List shipping carriers/fees
- `PUT /api/shipping/:id` — Update a carrier's fee, city overrides and enabled state (admin)

### CMS
- `GET /api/cms` — Get homepage/CMS/SEO/social settings
- `PUT /api/cms` — Update those settings (admin)

### System
- `POST /api/database/backup` — Export current store data (admin)
- `GET /api/system/health` — Health check (admin)

## Security Notes

1. **Sessions**: HTTP-only, `SameSite=Strict` cookies, 8-hour expiry, invalidated on server restart
2. **Password hashing**: salted scrypt (Node's `crypto` module), not a reversible or fast hash
3. **Database security**: SSL/TLS connections to Neon (`sslmode=require`)
4. **Admin access**: every mutating endpoint requires an active admin session; there is no bypass
5. **Rate limiting**: login attempts and public write endpoints (register, place order, validate coupon) are rate-limited per IP

## Database Management

### Initialize Database
```bash
npm run db:init
```

### Reset Database (CAUTION: deletes all stored data)
```bash
npm run db:reset
```

## Technology Stack
- **Frontend**: React 19, Vite 6, TypeScript, Tailwind CSS
- **Backend**: Express 4, TypeScript
- **Database**: PostgreSQL (Neon), `pg` driver
- **Auth**: HTTP-only session cookies, scrypt password hashing
- **Deployment**: Vercel

## License
Private - Pivotal B2B LLC
