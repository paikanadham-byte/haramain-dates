import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();
import express from "express";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
const SESSION_SECRET = process.env.SESSION_SECRET || "default_insecure_secret_for_hrm_2026";
import { neon } from "@neondatabase/serverless";
import { seedProducts } from "./src/data/catalog.js";
import {
  INITIAL_CMS,
  INITIAL_SHIPPING_OPTIONS,
  SAUDI_CITIES,
} from "./src/data/initialData.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// In-memory KV store fallback for AI Studio / environments without external database
const inMemoryStore = new Map<string, string>();

let sql: ReturnType<typeof neon<false, true>> | null = null;
function getSql() {
  const conn = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!conn) return null;
  if (!sql) {
    try {
      sql = neon<false, true>(conn, { fullResults: true });
    } catch {
      sql = null;
    }
  }
  return sql;
}
// Overridable so automated tests can run against an isolated row instead of the live 'store' data.
const STORE_KEY = process.env.KV_STORE_KEY || "store";

let db: any;
let committed = "";
async function save() {
  const snapshot = JSON.stringify(db);
  inMemoryStore.set(STORE_KEY, snapshot);
  committed = snapshot;

  const sqlClient = getSql();
  if (sqlClient) {
    try {
      await sqlClient.query(
        `INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [STORE_KEY, snapshot],
      );
    } catch (error) {
      console.warn("Database persist notice (in-memory store retained):", (error as Error).message);
    }
  }
}
// Wraps an async route handler so a rejected promise (e.g. a failed DB write) reaches Express error middleware instead of crashing the process.
const ah =
  (fn: express.RequestHandler): express.RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const text = (v: unknown, max = 1000) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
const money = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000000;
const image = (v: unknown) =>
  typeof v === "string" &&
  v.length <= 3000000 &&
  /^(https:\/\/|\/images\/|data:image\/(png|jpeg|webp);base64,)/.test(v);
function hash(password: string, salt = randomBytes(16).toString("hex")) {
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
function verify(password: string, stored: string) {
  const [salt, value] = stored.split(":");
  return timingSafeEqual(
    Buffer.from(value, "hex"),
    scryptSync(password, salt, 64),
  );
}


app.use(express.json({ limit: "12mb" }));
// Lazily initializes the database on first request instead of blocking module load,
// so this Express app can be invoked directly as a serverless function (no app.listen
// needed) as well as run as a long-lived local/production process.
let readyPromise: Promise<void> | null = null;
app.use("/api", (_req, res, next) => {
  (readyPromise ??= ensureReady()).then(
    () => next(),
    (error) => {
      readyPromise = null; // allow the next request to retry instead of replaying the same failure forever
      res.status(503).json({ error: "Startup failed: " + error.message });
    },
  );
});
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.headers.origin &&
    !(() => {
      try {
        return new URL(req.headers.origin!).host === req.headers.host;
      } catch {
        return false;
      }
    })()
  )
    return res.status(403).json({ error: "Invalid origin" });
  const token = req.headers.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("hrm_session="))
    ?.split("=")[1];
    
  if (token) {
    try {
      const [payloadB64, signature] = token.split(".");
      if (payloadB64 && signature) {
        const expectedSig = createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
        if (signature === expectedSig) {
          const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
          if (payload.userId && payload.expires > Date.now()) {
            const candidate = db.users.find((u: any) => u.id === payload.userId);
            // A signed token stays cryptographically valid until it expires (13
            // days) regardless of logout, since nothing server-side is tracking
            // it -- so logout instead bumps the user's sessionVersion. A token
            // issued before that bump is signed with the old version and is
            // rejected here even though its signature still checks out.
            if (candidate && (payload.sessionVersion || 0) === (candidate.sessionVersion || 0)) {
              res.locals.user = candidate;
            }
          }
        }
      }
    } catch (e) {
      // Invalid token format
    }
  }
  next();
});
const admin: express.RequestHandler = (_req, res, next) =>
  res.locals.user?.role === "admin"
    ? next()
    : res.status(403).json({ error: "Admin login required" });
const safeUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  favorites: u.favorites || [],
  cart: u.cart || [],
  phone: u.phone || "",
  address: u.address || "",
  city: u.city || "",
});
function startSession(res: express.Response, user: any) {
  const payload = {
    userId: user.id,
    sessionVersion: user.sessionVersion || 0,
    expires: Date.now() + 13 * 24 * 3600 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
  const token = `${payloadB64}.${signature}`;
  
  res.cookie("hrm_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 13 * 24 * 3600000,
  });
  res.json({ success: true, user: safeUser(user) });
}
const attempts = new Map<string, { count: number; until: number }>();
app.post("/api/auth/login", (req, res) => {
  const key = req.ip || "unknown";
  let limit = attempts.get(key);
  if (!limit || limit.until < Date.now()) {
    limit = { count: 0, until: Date.now() + 15 * 60000 };
    attempts.set(key, limit);
  }
  if (++limit.count > 20)
    return res
      .status(429)
      .json({ error: "Too many attempts. Try again later." });
  const user = db.users.find(
    (u: any) => u.email === String(req.body.email).trim().toLowerCase(),
  );
  if (
    !user ||
    typeof req.body.password !== "string" ||
    req.body.password.length > 256 ||
    !verify(req.body.password, user.passwordHash)
  )
    return res.status(401).json({ error: "Invalid credentials" });
  attempts.delete(key);
  startSession(res, user);
});
app.get("/api/auth/me", (_req, res) =>
  res.json({ user: res.locals.user ? safeUser(res.locals.user) : null }),
);
app.put(
  "/api/auth/me",
  ah(async (req, res) => {
    if (!res.locals.user) return res.status(401).json({ error: "Unauthorized" });
    const { favorites, cart, name, phone, address, city } = req.body;
    const user = res.locals.user;
    if (Array.isArray(favorites)) user.favorites = favorites.map(String);
    if (Array.isArray(cart)) user.cart = cart;
    if (name !== undefined) {
      if (!text(name, 150)) return res.status(400).json({ error: "Invalid name" });
      user.name = name;
    }
    if (phone !== undefined) {
      if (phone !== "" && !/^(05|5)\d{8}$/.test(String(phone).replace(/\s/g, "")))
        return res.status(400).json({ error: "Invalid Saudi mobile number" });
      user.phone = phone;
    }
    if (address !== undefined) {
      if (address !== "" && !text(address, 1000))
        return res.status(400).json({ error: "Invalid address" });
      user.address = address;
    }
    if (city !== undefined) {
      if (city !== "" && !SAUDI_CITIES.includes(city))
        return res.status(400).json({ error: "Invalid city" });
      user.city = city;
    }
    await save();
    res.json({ user: safeUser(user) });
  })
);
app.post(
  "/api/auth/logout",
  ah(async (req, res) => {
    if (res.locals.user) {
      res.locals.user.sessionVersion = (res.locals.user.sessionVersion || 0) + 1;
      await save();
    }
    res.clearCookie("hrm_session");
    res.json({ success: true });
  }),
);
const publicLimits = new Map<string, { count: number; until: number }>();
app.use(
  ["/api/auth/register", "/api/orders", "/api/coupons/validate"],
  (req, res, next) => {
    if (req.method !== "POST") return next();
    const key = `${req.baseUrl}:${req.ip}`;
    let limit = publicLimits.get(key);
    if (!limit || limit.until < Date.now()) {
      limit = { count: 0, until: Date.now() + 15 * 60000 };
      publicLimits.set(key, limit);
    }
    if (++limit.count > 60)
      return res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
    next();
  },
);
setInterval(() => {
  for (const map of [attempts, publicLimits])
    for (const [key, entry] of map)
      if (entry.until <= Date.now()) map.delete(key);
}, 60000).unref();
app.post(
  "/api/auth/register",
  ah(async (req, res) => {
    const { name, email, password } = req.body;
    if (
      !text(name, 150) ||
      !text(email, 254) ||
      !/^\S+@\S+\.\S+$/.test(email || "") ||
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 256
    )
      return res
        .status(400)
        .json({ error: "Valid name, email and 12-character password required" });
    if (db.users.some((u: any) => u.email === email.toLowerCase()))
      return res.status(409).json({ error: "Email already registered" });
    const user = {
      id: randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash: hash(password),
      role: "customer",
      favorites: [],
      cart: [],
    };
    db.users.push(user);
    await save();
    startSession(res, user);
  }),
);

// Neon Auth Sync - called by frontend when Neon session exists
app.post(
  "/api/auth/neon-sync",
  ah(async (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    // Find or create user
    let user = db.users.find((u: any) => u.email === email.toLowerCase());
    if (!user) {
      user = {
        id: randomUUID(),
        name: name || "Google User",
        email: email.toLowerCase(),
        passwordHash: null,
        role: "customer",
        favorites: [],
        cart: [],
      };
      db.users.push(user);
      await save();
    }

    startSession(res, user);
  }),
);


app.get("/api/products", (req, res) =>
  res.json({
    products: db.products.filter(
      (p: any) =>
        (!p.isHidden || res.locals.user?.role === "admin") &&
        (!req.query.category ||
          req.query.category === "all" ||
          p.category === req.query.category) &&
        (!req.query.search ||
          JSON.stringify(p)
            .toLowerCase()
            .includes(String(req.query.search).toLowerCase())),
    ),
  }),
);
function validProduct(p: any) {
  return (
    text(p.name, 200) &&
    text(p.nameEn, 200) &&
    text(p.description, 10000) &&
    text(p.descriptionEn, 10000) &&
    text(p.weight, 80) &&
    text(p.weightEn, 80) &&
    text(p.sku, 100) &&
    ["dates", "maamoul", "kleija", "gifts", "popular_sweets", "haramain_packages", "offers", "events", "sweets", "nuts"].includes(
      p.category,
    ) &&
    money(p.price) &&
    Number.isInteger(p.stock) &&
    p.stock >= 0 &&
    p.stock <= 1000000 &&
    (p.salePrice == null || (money(p.salePrice) && p.salePrice <= p.price)) &&
    Array.isArray(p.images) &&
    p.images.length > 0 &&
    p.images.length <= 8 &&
    p.images.every(image)
  );
}
app.post(
  "/api/products",
  admin,
  ah(async (req, res) => {
    if (!validProduct(req.body))
      return res
        .status(400)
        .json({ error: "Check bilingual names, prices, stock and images" });
    const product = { ...req.body, rating: 0, reviewsCount: 0, id: randomUUID() };
    db.products.unshift(product);
    await save();
    res.status(201).json({ product });
  }),
);
app.put(
  "/api/products/:id",
  admin,
  ah(async (req, res) => {
    const i = db.products.findIndex((p: any) => p.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Record not found" });
    const product = { ...db.products[i], ...req.body, id: req.params.id };
    if (!validProduct(product))
      return res.status(400).json({ error: "Invalid product" });
    db.products[i] = product;
    await save();
    res.json({ product });
  }),
);
app.delete(
  "/api/products/:id",
  admin,
  ah(async (req, res) => {
    db.products = db.products.filter((p: any) => p.id !== req.params.id);
    // Otherwise a deleted product lingers forever as a "ghost" in anyone's
    // wishlist/cart -- inflating the wishlist count with nothing to show for it.
    for (const u of db.users) {
      if (Array.isArray(u.favorites))
        u.favorites = u.favorites.filter((id: string) => id !== req.params.id);
      if (Array.isArray(u.cart))
        u.cart = u.cart.filter((item: any) => item.productId !== req.params.id);
    }
    await save();
    res.json({ success: true });
  }),
);
app.get("/api/cms", (_req, res) => res.json({ cms: db.cms }));
app.put(
  "/api/cms",
  admin,
  ah(async (req, res) => {
    const cms = { ...db.cms, ...req.body };
    const safeLink = (v: any) =>
      typeof v === "string" && (v === "" || /^(https:\/\/|#[a-z-]+$)/.test(v));
    const validSlide = (v: any) =>
      v &&
      [
        "title",
        "titleEn",
        "subtitle",
        "subtitleEn",
        "ctaText",
        "ctaTextEn",
      ].every((k) => text(v[k], 2000)) &&
      safeLink(v.ctaLink) &&
      image(v.imageUrl);
    if (
      !money(cms.freeShippingThreshold) ||
      typeof cms.announcementEnabled !== "boolean" ||
      !Array.isArray(cms.heroSlides) ||
      !cms.heroSlides.length ||
      !cms.heroSlides.every(validSlide) ||
      !validSlide(cms.promoBanner) ||
      !cms.contact ||
      !cms.social ||
      !cms.pixels ||
      !Object.values(cms.social).every(safeLink) ||
      !Object.values(cms.contact).every((v) => typeof v === "string") ||
      !Object.values(cms.pixels).every((v) => typeof v === "string") ||
      (cms.seo && !Object.values(cms.seo).every((v) => typeof v === "string"))
    )
      return res.status(400).json({
        error: "Invalid content, bilingual fields, links or shipping threshold",
      });
    db.cms = cms;
    await save();
    res.json({ cms });
  }),
);
app.get("/api/shipping", (_req, res) =>
  res.json({ shippingOptions: db.shippingOptions }),
);
app.put(
  "/api/shipping/:id",
  admin,
  ah(async (req, res) => {
    if (
      !Number.isFinite(req.body.cost) ||
      req.body.cost < 0 ||
      Object.values(req.body.cityRates || {}).some(
        (n: any) => !Number.isFinite(n) || n < 0,
      )
    )
      return res.status(400).json({ error: "Invalid shipping fees" });
    if (!db.shippingOptions.some((c: any) => c.id === req.params.id))
      return res.status(404).json({ error: "Carrier not found" });
    db.shippingOptions = db.shippingOptions.map((s: any) =>
      s.id === req.params.id ? { ...s, ...req.body, id: s.id } : s,
    );
    await save();
    res.json({ success: true });
  }),
);
app.get("/api/coupons", admin, (_req, res) =>
  res.json({ coupons: db.coupons }),
);
app.post("/api/coupons/validate", (req, res) => {
  const code =
    typeof req.body.code === "string" ? req.body.code.trim().toUpperCase() : "";
  const coupon = db.coupons.find(
    (c: any) =>
      c.code === code &&
      c.isActive &&
      Date.parse(c.expiresAt + "T23:59:59Z") >= Date.now(),
  );
  if (
    !coupon ||
    !money(req.body.subtotal) ||
    req.body.subtotal < coupon.minOrderValue
  )
    return res
      .status(400)
      .json({ error: "Coupon is invalid, expired, or minimum order not reached" });
  res.json({ coupon: { ...coupon, usageCount: 0 } });
});
function validCoupon(c: any) {
  return (
    /^[A-Z0-9_-]{2,40}$/.test(c.code) &&
    ["fixed", "percentage"].includes(c.discountType) &&
    Number.isFinite(c.discountValue) &&
    c.discountValue > 0 &&
    (c.discountType !== "percentage" || c.discountValue <= 100) &&
    Number.isFinite(c.minOrderValue) &&
    c.minOrderValue >= 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(c.expiresAt) &&
    Number.isFinite(Date.parse(c.expiresAt)) &&
    typeof c.isActive === "boolean"
  );
}
app.post(
  "/api/coupons",
  admin,
  ah(async (req, res) => {
    const coupon = {
      ...req.body,
      code: String(req.body.code).trim().toUpperCase(),
      id: randomUUID(),
      usageCount: 0,
    };
    if (
      !validCoupon(coupon) ||
      db.coupons.some((c: any) => c.code === coupon.code)
    )
      return res.status(400).json({ error: "Invalid or duplicate coupon" });
    db.coupons.unshift(coupon);
    await save();
    res.json({ coupon });
  }),
);
app.put(
  "/api/coupons/:id",
  admin,
  ah(async (req, res) => {
    const i = db.coupons.findIndex((c: any) => c.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Record not found" });
    const c = { ...db.coupons[i], ...req.body, id: req.params.id };
    if (
      !validCoupon(c) ||
      db.coupons.some((other: any) => other.id !== c.id && other.code === c.code)
    )
      return res.status(400).json({ error: "Invalid coupon" });
    db.coupons[i] = c;
    await save();
    res.json({ coupon: c });
  }),
);
app.delete(
  "/api/coupons/:id",
  admin,
  ah(async (req, res) => {
    db.coupons = db.coupons.filter((c: any) => c.id !== req.params.id);
    await save();
    res.json({ success: true });
  }),
);
// Realistic sample orders for order tracking demonstration and testing
const seedOrders = [
  {
    id: "ORD-882914",
    createdAt: new Date(Date.now() - 32 * 3600000).toISOString(),
    customer: {
      fullName: "عبدالرحمن الشمري",
      mobile: "0501234567",
      city: "الرياض",
      address: "حي الملقا - طريق أنس بن مالك - فيلا 14",
      notes: "يرجى الاتصال قبل التوصيل بنصف ساعة",
    },
    items: [
      {
        productId: "prod-1",
        productName: "تمر خلاص فاخر ملكي",
        productNameEn: "Royal Khalas Premium Dates",
        productImage: "/images/hero-dates.jpg",
        weight: "1 كجم",
        weightEn: "1 kg",
        quantity: 2,
        price: 38,
      },
      {
        productId: "prod-2",
        productName: "تمر سكري القصيم المفتل",
        productNameEn: "Qassim Premium Sukkari Dates",
        productImage: "/images/promo-dallah.jpg",
        weight: "1 كجم",
        weightEn: "1 kg",
        quantity: 1,
        price: 50,
      },
    ],
    subtotal: 126,
    discountAmount: 10,
    couponCode: "WELCOME10",
    shippingFee: 35,
    shippingCarrier: "سمسا إكسبريس (SMSA Express)",
    trackingNumber: "SMSA-88291402SA",
    total: 151,
    taxAmount: 20,
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "shipped",
  },
  {
    id: "ORD-771205",
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    customer: {
      fullName: "سارة خالد القحطاني",
      mobile: "0559876543",
      city: "جدة",
      address: "حي الروضة - شارع الأمير سلطان",
      notes: "التوصيل في الفترة المسائية",
    },
    items: [
      {
        productId: "prod-1",
        productName: "تمر خلاص فاخر ملكي",
        productNameEn: "Royal Khalas Premium Dates",
        productImage: "/images/hero-dates.jpg",
        weight: "1 كجم",
        weightEn: "1 kg",
        quantity: 3,
        price: 38,
      },
    ],
    subtotal: 114,
    discountAmount: 0,
    shippingFee: 30,
    shippingCarrier: "أرامكس (Aramex)",
    trackingNumber: "ARM-77120593",
    total: 144,
    taxAmount: 19,
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "processing",
  },
  {
    id: "ORD-993041",
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    customer: {
      fullName: "إبراهيم المنصور",
      mobile: "0561122334",
      city: "مكة المكرمة",
      address: "حي العزيزية - قرب الحرم المكي الشريف",
    },
    items: [
      {
        productId: "prod-2",
        productName: "تمر سكري القصيم المفتل",
        productNameEn: "Qassim Premium Sukkari Dates",
        productImage: "/images/promo-dallah.jpg",
        weight: "1 كجم",
        weightEn: "1 kg",
        quantity: 4,
        price: 50,
      },
    ],
    subtotal: 200,
    discountAmount: 20,
    couponCode: "HARAMAIN",
    shippingFee: 0,
    shippingCarrier: "سمسا إكسبريس (SMSA Express)",
    trackingNumber: "SMSA-99304118SA",
    total: 180,
    taxAmount: 23,
    paymentMethod: "cod",
    paymentStatus: "paid",
    orderStatus: "delivered",
  },
];

// Public Order Tracking Endpoint (supports Order ID, Tracking Number, or Mobile Number)
app.get(
  "/api/orders/track",
  ah(async (req, res) => {
    const rawQuery = String(
      req.query.query || req.query.orderId || req.query.phone || ""
    ).trim();

    if (!rawQuery) {
      return res
        .status(400)
        .json({ error: "Please enter an order ID, mobile number, or tracking number" });
    }

    const query = rawQuery.toLowerCase();
    const digitsOnly = rawQuery.replace(/\D/g, "");

    const matched = (db.orders || []).filter((o: any) => {
      if (!o) return false;
      const orderId = String(o.id || "").toLowerCase();
      // Match full ID or short ID or suffix
      if (orderId === query || orderId.endsWith(query) || orderId.includes(query)) return true;

      // Match carrier tracking number
      if (o.trackingNumber && String(o.trackingNumber).toLowerCase().includes(query)) return true;

      // Match customer phone (allow last 7-9 digits)
      if (digitsOnly.length >= 7 && o.customer?.mobile) {
        const orderPhone = String(o.customer.mobile).replace(/\D/g, "");
        if (orderPhone.endsWith(digitsOnly) || digitsOnly.endsWith(orderPhone) || orderPhone.includes(digitsOnly)) {
          return true;
        }
      }

      return false;
    });

    if (!matched.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Map to sanitized tracking view with rich milestones & timeline
    const results = matched.map((o: any) => {
      const createdDate = new Date(o.createdAt || Date.now());
      const isShipped = ["shipped", "delivered"].includes(o.orderStatus);
      const isDelivered = o.orderStatus === "delivered";
      const isCancelled = o.orderStatus === "cancelled";

      let carrierTrackingUrl = "";
      if (o.trackingNumber) {
        const carrierStr = (o.shippingCarrier || "").toLowerCase();
        if (carrierStr.includes("aramex")) {
          carrierTrackingUrl = `https://www.aramex.com/track/results?ShipmentNumber=${encodeURIComponent(o.trackingNumber)}`;
        } else if (carrierStr.includes("smsa") || carrierStr.includes("سمسا")) {
          carrierTrackingUrl = `https://www.smsaexpress.com/track?track=${encodeURIComponent(o.trackingNumber)}`;
        } else if (carrierStr.includes("spl") || carrierStr.includes("البريد")) {
          carrierTrackingUrl = `https://splonline.com.sa/en/track/?trackingnumber=${encodeURIComponent(o.trackingNumber)}`;
        }
      }

      // Calculate estimated delivery: roughly 48 hours from order creation
      const estimatedDeliveryDate = new Date(createdDate.getTime() + 48 * 3600000).toISOString();

      return {
        id: o.id,
        createdAt: o.createdAt,
        orderStatus: o.orderStatus,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        shippingCarrier: o.shippingCarrier,
        trackingNumber: o.trackingNumber || null,
        carrierTrackingUrl,
        estimatedDeliveryDate,
        total: o.total,
        subtotal: o.subtotal,
        shippingFee: o.shippingFee,
        discountAmount: o.discountAmount || 0,
        taxAmount: o.taxAmount,
        customerCity: o.customer?.city,
        customerName: o.customer?.fullName ? o.customer.fullName.split(" ")[0] : "العميل الكريم",
        customerPhoneMasked: o.customer?.mobile
          ? o.customer.mobile.slice(0, 4) + "****" + o.customer.mobile.slice(-2)
          : undefined,
        items: (o.items || []).map((it: any) => ({
          productId: it.productId,
          productName: it.productName,
          productNameEn: it.productNameEn,
          productImage: it.productImage,
          weight: it.weight,
          weightEn: it.weightEn,
          quantity: it.quantity,
          price: it.price,
        })),
        timeline: [
          {
            key: "new",
            label: "تم استلام الطلب",
            labelEn: "Order Received",
            desc: "تم تسجيل وتأكيد طلبكم في النظام بنجاح",
            descEn: "Order confirmed in system",
            completed: true,
            current: o.orderStatus === "new",
            timestamp: o.createdAt,
          },
          {
            key: "processing",
            label: "التجهيز والتغليف الفاخر",
            labelEn: "Packaging & Quality Check",
            desc: "فحص جودة التمور وتغليفها بعناية فائقة لضمان الطزاجة والأصالة",
            descEn: "Freshness inspection and royal packaging",
            completed: ["processing", "shipped", "delivered"].includes(o.orderStatus),
            current: o.orderStatus === "processing",
            timestamp: ["processing", "shipped", "delivered"].includes(o.orderStatus)
              ? new Date(createdDate.getTime() + 3 * 3600000).toISOString()
              : null,
          },
          {
            key: "shipped",
            label: "الشحن والتسليم لشركة النقل",
            labelEn: "Handed to Carrier",
            desc: o.trackingNumber
              ? `تم تسليم الشحنة لشركة ${o.shippingCarrier || "الشحن"} برقم بوليصة: ${o.trackingNumber}`
              : `الشحنة في طريقها مع شركة ${o.shippingCarrier || "الشحن"} إلى عنوانكم`,
            descEn: o.trackingNumber
              ? `Handed to ${o.shippingCarrier || "Carrier"} (Waybill: ${o.trackingNumber})`
              : `En route via ${o.shippingCarrier || "Carrier"}`,
            completed: isShipped,
            current: o.orderStatus === "shipped",
            timestamp: isShipped
              ? new Date(createdDate.getTime() + 10 * 3600000).toISOString()
              : null,
          },
          {
            key: "delivered",
            label: "تم التوصيل بنجاح",
            labelEn: "Delivered Successfully",
            desc: "تم تسليم الطلب للعميل، بالهناء والعافية",
            descEn: "Delivered to destination. Enjoy!",
            completed: isDelivered,
            current: isDelivered,
            timestamp: isDelivered
              ? new Date(createdDate.getTime() + 30 * 3600000).toISOString()
              : null,
          },
        ],
        isCancelled,
      };
    });

    res.json({ orders: results });
  }),
);

app.get("/api/orders", admin, (_req, res) => res.json({ orders: db.orders }));
app.post(
  "/api/orders",
  ah(async (req, res) => {
    const input = req.body;
    const customer = input.customer;
    if (
      !customer ||
      !text(customer.fullName, 150) ||
      !text(customer.address, 1000) ||
      !SAUDI_CITIES.includes(customer.city) ||
      (customer.notes != null &&
        (typeof customer.notes !== "string" || customer.notes.length > 2000)) ||
      !/^(05|5)\d{8}$/.test(String(customer.mobile).replace(/\s/g, ""))
    )
      return res
        .status(400)
        .json({ error: "Check customer and delivery details" });
    const requestKey = req.get("Idempotency-Key");
    if (requestKey && !/^[a-zA-Z0-9-]{16,100}$/.test(requestKey))
      return res.status(400).json({ error: "Invalid request key" });
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
    if (requestKey && db.orderRequests?.[requestKey]) {
      const previous = db.orderRequests[requestKey];
      if (previous.fingerprint !== fingerprint)
        return res
          .status(409)
          .json({ error: "Request key already used for another order" });
      return res.json({
        order: db.orders.find((o: any) => o.id === previous.orderId),
      });
    }
    if (input.paymentMethod !== "cod")
      return res
        .status(400)
        .json({ error: "Online payments are not connected yet" });
    if (
      !Array.isArray(input.items) ||
      !input.items.length ||
      input.items.length > 100
    )
      return res.status(400).json({ error: "Cart is empty" });
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      )
        return res.status(400).json({ error: "Invalid quantity" });
      quantities.set(
        item.productId,
        (quantities.get(item.productId) || 0) + item.quantity,
      );
    }
    const items: any[] = [];
    for (const [id, quantity] of quantities) {
      const p = db.products.find((p: any) => p.id === id && !p.isHidden);
      if (!p || p.stock < quantity)
        return res
          .status(409)
          .json({ error: "A product is unavailable or has insufficient stock" });
      items.push({
        productId: id,
        productName: p.name,
        productNameEn: p.nameEn,
        productImage: p.images[0],
        weight: p.weight,
        weightEn: p.weightEn,
        price: p.salePrice ?? p.price,
        quantity,
      });
    }
    const round = (n: number) => Math.round(n * 100) / 100;
    const subtotal = round(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const carrier = db.shippingOptions.find(
      (c: any) =>
        c.isEnabled !== false &&
        [c.id, c.name, c.nameEn].includes(input.shippingCarrier),
    );
    if (!carrier)
      return res
        .status(400)
        .json({ error: "Select an available shipping company" });
    let discountAmount = 0;
    let coupon: any;
    if (input.couponCode && typeof input.couponCode !== "string")
      return res.status(400).json({ error: "Invalid coupon" });
    if (input.couponCode) {
      coupon = db.coupons.find(
        (c: any) =>
          c.code === input.couponCode.toUpperCase() &&
          c.isActive &&
          Date.parse(c.expiresAt + "T23:59:59Z") > Date.now() &&
          subtotal >= c.minOrderValue,
      );
      if (!coupon)
        return res.status(400).json({ error: "Coupon is invalid or expired" });
      discountAmount = round(
        Math.min(
          subtotal,
          coupon.discountType === "percentage"
            ? (subtotal * coupon.discountValue) / 100
            : coupon.discountValue,
        ),
      );
    }
    const shippingFee =
      subtotal >= db.cms.freeShippingThreshold
        ? 0
        : (carrier.cityRates?.[customer.city] ?? carrier.cost);
    const total = round(subtotal - discountAmount + shippingFee);
    const order = {
      id: "HRM-" + randomUUID().slice(0, 12).toUpperCase(),
      createdAt: new Date().toISOString(),
      customer,
      items,
      subtotal,
      discountAmount,
      couponCode: coupon?.code,
      shippingFee,
      shippingCarrier: carrier.name,
      total,
      taxAmount: round((total * 15) / 115),
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "new",
    };
    for (const [id, qty] of quantities)
      db.products.find((p: any) => p.id === id).stock -= qty;
    if (coupon) coupon.usageCount++;
    db.orders.unshift(order);
    if (requestKey) {
      db.orderRequests ??= {};
      db.orderRequests[requestKey] = { fingerprint, orderId: order.id };
    }
    await save();
    res.status(201).json({ order });
  }),
);
app.put(
  "/api/orders/:id/status",
  admin,
  ah(async (req, res) => {
    const order = db.orders.find((o: any) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Record not found" });
    if (
      !["new", "processing", "shipped", "delivered", "cancelled"].includes(
        req.body.status,
      )
    )
      return res.status(400).json({ error: "Invalid status" });
    if (order.orderStatus === "delivered" && req.body.status !== "delivered")
      return res
        .status(400)
        .json({ error: "Delivered orders cannot be reopened" });
    if (order.orderStatus === "cancelled" && req.body.status !== "cancelled")
      return res
        .status(400)
        .json({ error: "Cancelled orders cannot be reopened" });
    if (
      req.body.status === "cancelled" &&
      (order.paymentStatus === "paid" || order.orderStatus === "delivered")
    )
      return res
        .status(400)
        .json({ error: "Collected or delivered orders cannot be cancelled" });
    if (req.body.status === "cancelled" && order.orderStatus !== "cancelled")
      for (const item of order.items) {
        const p = db.products.find((p: any) => p.id === item.productId);
        if (p) p.stock += item.quantity;
      }
    order.orderStatus = req.body.status;
    if (typeof req.body.trackingNumber === "string")
      order.trackingNumber = req.body.trackingNumber;
    await save();
    res.json({ order });
  }),
);
app.put(
  "/api/orders/:id/collection",
  admin,
  ah(async (req, res) => {
    const order = db.orders.find((o: any) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (
      order.paymentMethod !== "cod" ||
      order.orderStatus !== "delivered" ||
      req.body.collected !== true
    )
      return res
        .status(400)
        .json({ error: "Confirm cash collection only after delivery" });
    order.paymentStatus = "paid";
    order.collectedAt ??= new Date().toISOString();
    await save();
    res.json({ order });
  }),
);
app.post("/api/orders/:id/refund", admin, (_req, res) =>
  res.status(400).json({
    error:
      "Refunds require a connected payment provider; cancel unpaid orders instead",
  }),
);
app.get("/api/users", admin, (_req, res) =>
  res.json({ users: db.users.map(safeUser).filter((u: any) => u.role === "customer") }),
);
app.post("/api/database/backup", admin, (_req, res) =>
  res.json({
    products: db.products,
    orders: db.orders,
    coupons: db.coupons,
    cms: db.cms,
    shippingOptions: db.shippingOptions,
    users: db.users.map(safeUser),
    version: "2.0",
    exportedAt: new Date().toISOString(),
  }),
);
app.get("/api/system/health", admin, (_req, res) =>
  res.json({
    status: "healthy",
    storage: "PostgreSQL (Neon)",
    paymentGateway: "not connected",
  }),
);

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const ai = openRouterApiKey
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://haramain-dates.vercel.app",
        "X-Title": "Tmoor Alharmain",
      },
    })
  : null;
const AI_MODEL = "openai/gpt-4o-mini";

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.post(
  "/api/ai/chat",
  ah(async (req, res) => {
    const { messages } = req.body;
    const visibleProducts = db.products.filter((p: any) => !p.isHidden && p.stock > 0);
    const catalog = visibleProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      price: p.price,
      salePrice: p.salePrice ?? null,
      weight: p.weight,
      weightEn: p.weightEn,
      category: p.category,
      stock: p.stock,
      image: p.images?.[0] || "",
    }));

    let rawText = "";
    try {
      if (geminiClient) {
        const chatPrompt =
          "You are a friendly shopkeeper assistant for Tmoor Alharmain (تمور الحرمين), a Saudi dates and sweets store. " +
          "Always reply in the SAME language the customer uses (Arabic or English). " +
          "Act like a real helpful shopkeeper: answer questions, recommend products, take orders. " +
          "When the customer asks to see, browse, or order any product or category, respond ONLY with this JSON (no extra text):\n" +
          '{"intent":"show_products","reply":"<your friendly message>","productIds":["<id1>","<id2>"]}\n' +
          "For all other messages (greetings, questions, general chat), respond ONLY with this JSON:\n" +
          '{"intent":"chat","reply":"<your answer>"}\n' +
          "Always use real IDs from this catalog. Never invent IDs.\n" +
          "Catalog: " + JSON.stringify(catalog) + "\n\n" +
          "Customer messages: " + JSON.stringify(messages);

        const response = await geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: chatPrompt,
        });
        rawText = response.text || "";
      } else if (process.env.OPENROUTER_API_KEY) {
        const completion = await ai.chat.completions.create({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a friendly shopkeeper assistant for Tmoor Alharmain (تمور الحرمين), a Saudi dates and sweets store. " +
                "Always reply in the SAME language the customer uses (Arabic or English). " +
                "Act like a real helpful shopkeeper: answer questions, recommend products, take orders. " +
                "When the customer asks to see, browse, or order any product or category, respond ONLY with this JSON (no extra text):\n" +
                '{"intent":"show_products","reply":"<your friendly message>","productIds":["<id1>","<id2>"]}\n' +
                "For all other messages (greetings, questions, general chat), respond ONLY with this JSON:\n" +
                '{"intent":"chat","reply":"<your answer>"}\n' +
                "Always use real IDs from this catalog. Never invent IDs.\n" +
                "Catalog: " + JSON.stringify(catalog),
            },
            ...messages,
          ],
        });
        rawText = completion.choices?.[0]?.message?.content || "";
      } else {
        const lastMsg = String((messages || []).slice(-1)[0]?.content || "").toLowerCase();
        const isArabic = /[؀-ۿ]/.test(lastMsg);
        const filtered = visibleProducts.filter((p: any) =>
          lastMsg.includes(p.name?.toLowerCase()) ||
          lastMsg.includes(p.nameEn?.toLowerCase()) ||
          lastMsg.includes(p.category)
        );
        const featured = (filtered.length > 0 ? filtered : visibleProducts).slice(0, 4);
        return res.json({
          intent: "show_products",
          reply: isArabic
            ? "أهلاً بك في تمور الحرمين! يسعدنا مساعدتك في اختيار أجود التمور والحلويات الشعبية والضيافة الفاخرة."
            : "Welcome to Tmoor Alharmain! We are delighted to help you choose the finest Saudi dates and authentic hospitality treats.",
          products: featured.map((p: any) => ({
            id: p.id,
            name: p.name,
            nameEn: p.nameEn,
            price: p.price,
            salePrice: p.salePrice ?? null,
            weight: p.weight,
            weightEn: p.weightEn,
            image: p.images?.[0] || "",
            stock: p.stock,
            category: p.category,
          })),
        });
      }
    } catch (aiErr: any) {
      // AI call failed — return a graceful message with catalog products
      const isArabic = /[؀-ۿ]/.test(String((messages || []).slice(-1)[0]?.content || ""));
      return res.json({
        intent: "show_products",
        reply: isArabic
          ? "أهلاً بك في تمور الحرمين! تفضل بالاطلاع على تشكيلة المنتجات المميزة، ويسعدنا خدمتكم دائماً."
          : "Welcome to Tmoor Alharmain! Please browse our featured collection.",
        products: visibleProducts.slice(0, 4).map((p: any) => ({
          id: p.id,
          name: p.name,
          nameEn: p.nameEn,
          price: p.price,
          salePrice: p.salePrice ?? null,
          weight: p.weight,
          weightEn: p.weightEn,
          image: p.images?.[0] || "",
          stock: p.stock,
          category: p.category,
        })),
      });
    }

    // Try to extract JSON from the raw response (handles markdown code blocks too)
    let result: any = null;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { result = JSON.parse(jsonMatch[0]); } catch { /* not valid json */ }
    }

    // If JSON parsing failed, treat the whole response as a plain chat reply
    if (!result || typeof result !== "object") {
      result = { intent: "chat", reply: rawText.trim() };
    }

    // Ensure reply is never empty
    if (!result.reply) result.reply = rawText.trim();

    if (result.intent === "show_products") {
      const ids: string[] = Array.isArray(result.productIds) ? result.productIds : [];
      let matched = ids
        .map((id: string) => visibleProducts.find((p: any) => p.id === id))
        .filter(Boolean);

      // Fallback 1: keyword search in reply text
      if (!matched.length) {
        const keyword = (result.reply || "").toLowerCase();
        matched = visibleProducts.filter((p: any) =>
          keyword.split(/\s+/).some((word: string) =>
            word.length > 2 &&
            (p.name?.includes(word) || p.nameEn?.toLowerCase().includes(word) || p.category?.includes(word))
          )
        );
      }
      // Fallback 2: return first 6 products
      if (!matched.length) matched = visibleProducts.slice(0, 6);

      const products = matched.slice(0, 6).map((p: any) => ({
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        price: p.price,
        salePrice: p.salePrice ?? null,
        weight: p.weight,
        weightEn: p.weightEn,
        image: p.images?.[0] || "",
        stock: p.stock,
        category: p.category,
      }));
      return res.json({ intent: "show_products", reply: result.reply, products });
    }

    res.json({ intent: "chat", reply: result.reply || result.message || rawText.trim() });
  })
);

app.post(
  "/api/ai/admin-command",
  admin,
  ah(async (req, res) => {
    const { command, image } = req.body;
    
    const userMessage: any = { role: "user", content: [] };
    if (command) userMessage.content.push({ type: "text", text: command });
    if (image) userMessage.content.push({ type: "image_url", image_url: { url: image } });

    if (!geminiClient && !ai) {
      return res.json({
        success: true,
        intent: "chat",
        reply: "لإضافة المنتجات عبر الذكاء الاصطناعي، يرجى ضبط مفتاح GEMINI_API_KEY أو استخدام نموذج الإضافة في لوحة التحكم.",
      });
    }

    let rawResult = "{}";
    if (geminiClient) {
      const promptText =
        "You are the admin assistant for a bilingual (Arabic/English) Saudi dates and sweets store. " +
        "If the user wants to chat, ask a question, or say hi, respond with JSON: " +
        '{ "intent": "chat", "reply": "your message" }. ' +
        "If the user wants to create or add a product (even by describing a photo or uploading an image), extract the details " +
        'and respond with JSON: { "intent": "create_product", "product": { ' +
        '"name": "Arabic product name", "nameEn": "English product name", ' +
        '"description": "Arabic description (2-3 sentences)", "descriptionEn": "English description (2-3 sentences)", ' +
        '"weight": "Arabic weight e.g. \\"١ كجم\\"", "weightEn": "English weight e.g. \\"1 kg\\"", ' +
        '"price": 0, "salePrice": null, "stock": 50, ' +
        '"category": "one of: dates, maamoul, kleija, gifts, popular_sweets, haramain_packages, offers, events, sweets, nuts", ' +
        '"origin": "Arabic origin (optional)", "originEn": "English origin (optional)" } }. ' +
        "CRITICAL: If the admin uploads an image, that image WILL be used as the product image — do NOT set imagePrompt. " +
        "Only set imagePrompt if no image is provided and the admin explicitly asks for AI to generate one. " +
        "The admin will often only type in one language (usually Arabic) — you must translate every " +
        "field into the other language yourself so both name/nameEn, description/descriptionEn and " +
        "weight/weightEn are always filled in; never leave the English or Arabic side blank. " +
        "If a required detail (name or price) is genuinely missing and cannot be inferred, respond with " +
        '{ "intent": "mistake", "reply": "explain in the admin\'s own language exactly what is missing" } ' +
        "instead of guessing.\n\nAdmin command: " + (command || "");

      const parts: any[] = [{ text: promptText }];
      if (image && typeof image === "string" && image.startsWith("data:image/")) {
        const mimeType = image.split(";")[0].replace("data:", "");
        const base64Data = image.split(",")[1];
        if (mimeType && base64Data) {
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }

      const response = await geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: parts,
        config: { responseMimeType: "application/json" },
      });
      rawResult = response.text || "{}";
    } else if (ai) {
      const completion = await ai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are the admin assistant for a bilingual (Arabic/English) Saudi dates and sweets store. " +
              "If the user wants to chat, ask a question, or say hi, respond with JSON: " +
              '{ "intent": "chat", "reply": "your message" }. ' +
              "If the user wants to create or add a product (even by describing a photo or uploading an image), extract the details " +
              'and respond with JSON: { "intent": "create_product", "product": { ' +
              '"name": "Arabic product name", "nameEn": "English product name", ' +
              '"description": "Arabic description (2-3 sentences)", "descriptionEn": "English description (2-3 sentences)", ' +
              '"weight": "Arabic weight e.g. \\"١ كجم\\"", "weightEn": "English weight e.g. \\"1 kg\\"", ' +
              '"price": 0, "salePrice": null, "stock": 50, ' +
              '"category": "one of: dates, maamoul, kleija, gifts, popular_sweets, haramain_packages, offers, events, sweets, nuts", ' +
              '"origin": "Arabic origin (optional)", "originEn": "English origin (optional)" } }. ' +
              "CRITICAL: If the admin uploads an image, that image WILL be used as the product image — do NOT set imagePrompt. " +
              "Only set imagePrompt if no image is provided and the admin explicitly asks for AI to generate one. " +
              "The admin will often only type in one language (usually Arabic) — you must translate every " +
              "field into the other language yourself so both name/nameEn, description/descriptionEn and " +
              "weight/weightEn are always filled in; never leave the English or Arabic side blank. " +
              "If a required detail (name or price) is genuinely missing and cannot be inferred, respond with " +
              '{ "intent": "mistake", "reply": "explain in the admin\'s own language exactly what is missing" } ' +
              "instead of guessing.",
          },
          userMessage,
        ],
        response_format: { type: "json_object" },
      });
      rawResult = completion.choices[0].message.content || "{}";
    }

    let result = JSON.parse(rawResult || "{}");

    if (result.intent === "chat" || result.intent === "mistake") {
      return res.json({ success: true, intent: result.intent, reply: result.reply });
    }

    const productData = result.product || result;

    // Auto-generate image if requested
    if (productData.imagePrompt) {
      const imgRes = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(productData.imagePrompt)}?width=800&height=800`);
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      productData.images = [`data:image/jpeg;base64,${base64}`];
    } else if (image) {
      // Use the uploaded image as the product image
      productData.images = [image];
    } else if (!productData.images?.length) {
      productData.images = ["/images/hero-dates.jpg"];
    }

    // A couple of common AI slip-ups, mapped onto the real schema before validation.
    if (!productData.name && productData.nameAr) productData.name = productData.nameAr;
    if (!productData.description && productData.descriptionAr) productData.description = productData.descriptionAr;
    if (!productData.descriptionEn && productData.description) productData.descriptionEn = productData.description;
    if (!productData.weightEn && productData.weight) productData.weightEn = productData.weight;
    if (!["dates", "maamoul", "kleija", "gifts", "popular_sweets", "haramain_packages", "offers", "events", "sweets", "nuts"].includes(productData.category))
      productData.category = "dates";

    let sku = "";
    do {
      sku = `HRM-${productData.category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (db.products.some((p: any) => p.sku === sku));

    const product = {
      ...productData,
      id: randomUUID(),
      sku,
      salePrice: productData.salePrice ?? null,
      isFeatured: false,
      isHidden: false,
      rating: 0,
      reviewsCount: 0,
    };

    const problems: string[] = [];
    if (!text(product.name, 200)) problems.push("Arabic name");
    if (!text(product.nameEn, 200)) problems.push("English name");
    if (!text(product.description, 10000)) problems.push("Arabic description");
    if (!text(product.descriptionEn, 10000)) problems.push("English description");
    if (!text(product.weight, 80)) problems.push("Arabic weight");
    if (!text(product.weightEn, 80)) problems.push("English weight");
    if (!money(product.price)) problems.push("price");
    if (!Number.isInteger(product.stock) || product.stock < 0) problems.push("stock quantity");
    if (!validProduct(product)) problems.push(problems.length ? "and other details" : "product details");

    if (!validProduct(product)) {
      return res.json({
        success: true,
        intent: "mistake",
        reply:
          "I couldn't create that product -- please double check: " + problems.join(", ") + ".",
      });
    }

    db.products.unshift(product);
    await save();

    // Built from the actual saved fields (not just trusting the model's own
    // wording) so the explanation is always factually correct.
    const isArabicInput = /[؀-ۿ]/.test(String(command || ""));
    const reply = isArabicInput
      ? `أضفت "${product.name}" (${product.nameEn}) في قسم ${product.category}، بسعر ${product.price} ر.س ووزن ${product.weight}، بمخزون ${product.stock} قطعة. رمز المنتج: ${product.sku}.`
      : `Added "${product.nameEn}" to the ${product.category} category at ${product.price} SAR, ${product.weight} weight, ${product.stock} in stock. SKU: ${product.sku}.`;

    res.json({ success: true, intent: "create_product", product, reply });
  })
);
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Endpoint not found" }),
);
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err.message);
  res
    .status(
      err.status === 413 ? 413 : err.type === "entity.parse.failed" ? 400 : 500,
    )
    .json({
      error:
        err.status === 413
          ? "Uploaded content exceeds the 12 MB limit"
          : err.type === "entity.parse.failed"
            ? "Invalid JSON request"
            : "Unable to save request",
    });
});

async function loadDb() {
  const sqlClient = getSql();
  if (sqlClient) {
    try {
      await sqlClient.query(
        `CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
      );
      const result = await sqlClient.query("SELECT value FROM kv_store WHERE key = $1", [
        STORE_KEY,
      ]);
      if (result.rows?.[0]?.value) {
        return result.rows[0].value;
      }
    } catch (err: any) {
      console.warn("External DB load notice (falling back to memory):", err?.message);
    }
  }

  if (inMemoryStore.has(STORE_KEY)) {
    try {
      return JSON.parse(inMemoryStore.get(STORE_KEY)!);
    } catch {}
  }

  return {
    products: [...seedProducts],
    orders: [...seedOrders],
    coupons: [
      {
        id: "c-welcome",
        code: "WELCOME10",
        discountType: "percentage",
        discountValue: 10,
        minOrderValue: 50,
        expiresAt: "2030-12-31",
        usageCount: 0,
        isActive: true,
      },
      {
        id: "c-haramain",
        code: "HARAMAIN",
        discountType: "fixed",
        discountValue: 20,
        minOrderValue: 100,
        expiresAt: "2030-12-31",
        usageCount: 0,
        isActive: true,
      },
    ],
    cms: INITIAL_CMS,
    shippingOptions: INITIAL_SHIPPING_OPTIONS,
    users: [],
    migrations: ["remove-legacy-samples"],
  };
}

async function ensureReady() {
  db = await loadDb();
  committed = JSON.stringify(db);

  if (!Array.isArray(db.products) || db.products.length === 0) {
    db.products = [...seedProducts];
  }
  if (!Array.isArray(db.orders) || db.orders.length === 0) {
    db.orders = [...seedOrders];
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@haramain.sa").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin12345678";
  if (!db.users.some((u: any) => u.role === "admin")) {
    db.users.push({
      id: randomUUID(),
      name: "Store owner",
      email: adminEmail,
      passwordHash: hash(adminPassword),
      role: "admin",
      sessionVersion: 0,
    });
  }
  await save();
}

export default app;

// Vercel invokes the exported app directly as a serverless function per request
// (see api/[...path].ts) and never runs this file as a standalone process, so only
// bind a real port when running locally (npm run dev / npm start).
if (!process.env.VERCEL) {
  (async () => {
    await (readyPromise ??= ensureReady());
    if (process.env.NODE_ENV !== "production") {
      // Dynamic import: vite is a large dev-only dependency that must never be
      // bundled into the Vercel serverless function (see api/[...path].ts).
      const vitePkg = "vite";
      const { createServer: createViteServer } = await import(vitePkg);
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.resolve("dist")));
      app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
    }
    app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
      console.log(
        "Tmoor Alharmain listening on port " + (process.env.PORT || 3000),
      ),
    );
  })().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
