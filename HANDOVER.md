# تمور الحرمين — دليل الإدارة والتسليم
# Tmoor Alharmain — owner guide & deployment handover

## الحالة الحالية / Current status

The storefront and new admin dashboard are implemented in Arabic and English. Arabic is the default, with RTL layout. Store data is saved on the server, not in browser-only demo storage. This is a working, single-server implementation; **it is not yet a company-configured, production-launched store**.

لم يُربط أي حساب للمطور أو بوابة دفع أو خدمة مدفوعة. يجب أن تكون الاستضافة والنطاق وحساب المالك وجميع الخدمات باسم الشركة وبريدها.

No developer-owned accounts, payment gateways, tracking scripts, email services, or paid services have been connected. Domain registration, hosting purchase, ownership verification and company account provisioning remain with the owner.

## 1. Owner login / دخول المالك

1. Install Node.js 22 or later and run `npm ci`.
2. Copy `.env.example` to `.env.local` on your company-controlled server. Set `DATABASE_URL` to your own Neon connection string, then run `npm run db:init` once.
3. Set `ADMIN_EMAIL` to your company email, and `ADMIN_PASSWORD` to a unique password of at least 12 characters. Enter these privately on the server, not in chat or Git.
4. Run `npm run dev`, open the storefront, and click **Login** in the header, then **Admin dashboard**. There is no separate `/admin` web address — the storefront is a single page, and the dashboard is a view inside it available only once you're signed in as the admin.
5. On the first start, the server creates the owner with a salted scrypt password hash. Remove the bootstrap password from `.env.local` after provisioning and keep the original in your company password manager.

لا يوجد حساب تجريبي أو كلمة مرور افتراضية. تسجيل الدخول متاح من الصفحة الرئيسية عبر زر "تسجيل الدخول". تغيير `ADMIN_PASSWORD` بعد إنشاء الحساب لا يغير كلمة مروره الحالية. لا تشارك الأسرار في المحادثة.

Sessions use HTTP-only cookies and expire after eight hours. Restarting the server signs users out. Admin API routes are protected independently of what the browser displays. Failed login attempts are rate limited. A customer registration cannot create an admin.

No real owner login credentials have been generated yet because the company email and deployment environment have not been supplied. Do not use the automated test account for a live store: it exists only inside a temporary test database that is removed at test completion.

## 2. Daily administration / الإدارة اليومية

### Products / المنتجات
- Open **Products → Add product** / **المنتجات ← إضافة منتج**.
- Enter Arabic and English names, descriptions, weights and origins, plus a SKU.
- Choose Dates, Maamoul, Kleija, Sweets, Nuts or Offers.
- Enter regular price and optionally a lower sale price; leave sale price blank to remove a promotion.
- Set an integer stock quantity. Zero stock displays **Out of Stock / نفد المخزون**.
- Upload multiple JPEG, PNG or WebP photos, up to 2 MB each. The first is the cover; remove it to promote the next image.
- Use **Hide / إخفاء** to remove a product from the public catalog without deleting it.
- Save and wait for the success message. Invalid saves remain in the editor with an error.

### Orders / الطلبات
- New orders appear in **Orders / الطلبات**, and the dashboard count refreshes every 15 seconds while open.
- Open Details for customer name, mobile, city, address, notes and ordered items.
- Update New → Processing → Shipped → Delivered and enter the real carrier tracking number.
- Cancellation restores stock only once. Cancelled orders cannot be reopened.
- The server checks stock, combines duplicate product lines, and calculates current product prices, coupon discounts, shipping and totals itself.
- Orders are currently **cash on delivery, payment pending**. No card charge or online refund is simulated. After actual delivery, the admin can explicitly confirm cash collection. The order is then recorded as paid; delivery alone does not mark it paid.
- **External email/SMS/WhatsApp notifications are not connected.** Choose a provider under the company account if notifications are needed while the dashboard is closed.

### Coupons / كوبونات الخصم
Create or edit a code with a percentage or fixed amount, minimum order, expiry date and active toggle. Expired/disabled codes are rejected at checkout. The full coupon list is admin-only; customers validate a code they already know. Codes are not single-use or customer-restricted.

### Shipping / الشحن
Edit each carrier's default fee and enable/disable it. Expand **City-specific fees / رسوم خاصة حسب المدينة** to override individual city prices. Blank overrides use the carrier default. Set the free-shipping threshold independently. Carrier names are labels only; no carrier API or shipping contract is connected.

### Homepage and settings / الصفحة الرئيسية والإعدادات
- Edit announcement text, homepage banners, offer banner, photos and button text in both languages.
- Update contact information and social links in Store settings.
- Edit Arabic/English SEO titles and descriptions.
- Analytics/pixel IDs are saved as configuration only; they do not activate tracking.
- Customer-entered names and addresses are retained as entered, not machine-translated.

## 3. Storage and deployment / التخزين والنشر

```sh
npm ci
npm run lint
npm test
npm run build:full
NODE_ENV=production npm start
```

Use HTTPS with a reverse proxy, a private persistent disk, a process manager, and a server registered to the company. The server listens on `0.0.0.0:$PORT` (default 3000). Frontend requests use same-origin `/api/...` URLs; no customer browser calls localhost.

Store data (products, uploaded image data, orders, coupons, CMS, shipping rules and hashed user records) is kept in a single PostgreSQL (Neon) table, `kv_store`, configured via `DATABASE_URL` in your environment — never commit that value. The public catalog currently returns all product images, so large catalogs should add pagination and separate image hosting.

Prices use SAR, with the existing 15% VAT-inclusive calculation. Verify your company's VAT registration, required invoice fields, ZATCA obligations and tax treatment with your accountant before accepting real orders. New installations start with an empty catalog and disabled shipping carriers. Enter your real products and carrier fees before enabling checkout. Untouched legacy sample products are removed once, with a private pre-cleanup backup; owner-edited products and orders are preserved. Fake review stars/counts are not displayed.

## 4. Backup and restore / النسخ والاستعادة

### Owner data export
The admin **Backup & handover** tab downloads server data including products, uploaded images, orders, coupons, CMS and shipping. User password hashes are deliberately excluded from this download. It is a data export, not a full disaster-recovery archive.

### Full backup
Store data now lives in PostgreSQL (Neon), not on local disk. Run:

```sh
bash scripts/backup.sh
```

This writes `backups/haramain-source-<UTC timestamp>.tar.gz` containing website source and local `.env` files if present (dependencies, build output and Git history are excluded because they can be rebuilt), and prints a `pg_dump` command for a full database snapshot. **Both the source archive and any database dump may contain credentials or personal data; encrypt them and store them in a company-owned backup destination.** You can also use Neon's own branch/snapshot feature for point-in-time database backups. Do not expose backups through the public web server.

Recommended: daily encrypted off-server database backups, retention policy, and a monthly recovery drill. The current workspace's `backups/` folder is intentionally ignored by Git.

### Restore
1. Stop the application.
2. Extract the source archive into a private, empty application directory, and restore the database from the `pg_dump` output or a Neon branch/snapshot.
3. Run `npm ci` and `npm run build:full`.
4. Verify private permissions, company environment variables (including `DATABASE_URL`) and HTTPS.
5. Start with `NODE_ENV=production npm start` and sign in using the original owner credentials.
6. Verify products, images, stock, orders, coupons, CMS and shipping. Perform a test COD order, then cancel it.

Do not restore arbitrary JSON through the browser. This build deliberately disables the old demo reset/import buttons to prevent accidental or misleading data replacement.

## 5. Company-owned integration checklist / متطلبات الإطلاق

Still required before public launch:

- [ ] Register domain and hosting under the company email; document billing ownership and recovery contacts.
- [ ] Provision the real owner account privately, store credentials in the company password manager, and establish account-recovery and staff-access procedures.
- [ ] Enter verified company products, bilingual descriptions, actual photos, prices and stock; configure and enable the carriers you use.
- [ ] Enter company phone, WhatsApp, social links, legal address, commercial registration and tax number. Placeholder third-party contact and advertising IDs have been removed.
- [ ] Publish approved privacy, returns, delivery and terms policies; audit existing footer links against those pages.
- [ ] Select the gateway under the company's account. Implement hosted checkout, Mada/Apple Pay/Visa/Mastercard support according to that provider, signed webhook verification, retries/idempotency, refund handling and reconciliation. Only verified server-side callbacks may mark online payments paid (the current COD workflow uses explicit admin collection confirmation). Complete sandbox tests and Apple Pay domain verification before enabling online payments.
- [ ] Select and connect an owner-controlled email/SMS/WhatsApp notification provider, with retry/delivery monitoring. Current notifications are dashboard-only.
- [ ] Add a privacy consent workflow, then connect Google Analytics, Meta and TikTok using the company's IDs; validate advertising events and consent behavior. No tracking scripts run in this build.
- [ ] Configure production HTTPS, persistent storage, encrypted off-site backups, monitoring, abuse protection and operational recovery.
- [ ] Verify mobile layouts and checkout on actual iOS Safari and Android Chrome, plus desktop browsers; conduct accessibility and keyboard testing.
- [ ] Add domain-specific canonical URLs/sitemap and search indexing setup. Current basic SEO includes document language, localized titles/descriptions, social metadata and robots rules; the site is client-rendered.

## 6. Verification performed / الفحوصات

`npm run lint` passes. `npm test` builds the application and verifies authentication, admin authorization, product validation, coupon calculations, city shipping, authoritative order totals, pending payment state, insufficient stock, duplicate cart lines, cancellation restocking, hidden products, safe data exports, persistence across server restart and logout.

A real Chromium browser regression now passes using an isolated temporary database: wrong-password rejection, owner login, product creation with two uploaded images, coupon creation, shipping setup, wishlist filtering, cart persistence after reload, discount application, COD checkout, delivered-order cash collection and stock editing. Arabic/English direction and horizontal-overflow checks pass at 320, 390, 768 and 1440 pixels, with no JavaScript page exceptions during the scenario. Actual-device iOS/Android verification, accessibility audit, and chosen-provider testing remain separate launch tasks.

Expanded API tests also cover empty initial catalog, disabled initial carriers, malformed data, customer/admin privilege separation, private coupon listings, request idempotency across a restart and explicit COD collection. `npm audit` reports no known vulnerabilities for the current lockfile at the time of this audit.

The originally blocked browser download was worked around using a separately installed Chromium package; no browser packages or test accounts are shipped as runtime dependencies. See `scripts/test-browser.mjs` for reproduction instructions. No real payment, messaging, analytics, hosting or domain account has been accessed.

The newly supplied logo attachment was unavailable in the workspace; the existing logo remains until the exact file is re-uploaded. It has not been recreated or silently substituted.
