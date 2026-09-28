import { spawn } from "node:child_process";
import path from "node:path";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
  console.error(
    "DATABASE_URL is required to run tests (set it in .env.local). Tests run against an isolated row and never touch live store data.",
  );
  process.exit(1);
}

const testStoreKey = "test-" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
let server;
const base = "http://127.0.0.1:3101";
async function start() {
  server = spawn(process.execPath, ["dist/server.cjs"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3101",
      KV_STORE_KEY: testStoreKey,
      ADMIN_EMAIL: "owner@example.test",
      ADMIN_PASSWORD: password,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error("Startup timed out")), 15000);
    server.stdout.on("data", (data) => {
      if (String(data).includes("listening")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.on("exit", (code) => reject(Error(`Server exited: ${code}`)));
  });
}
async function stop() {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await exited;
  }
}
async function api(url, method = "GET", body, cookie, headers = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: res.status,
    data: await res.json(),
    cookie: res.headers.get("set-cookie")?.split(";")[0],
  };
}
try {
  await start();
  assert.equal(
    (await api("/api/products")).data.products.length,
    0,
    "No sample catalog on first boot",
  );
  assert.ok(
    (await api("/api/shipping")).data.shippingOptions.every(
      (c) => c.isEnabled === true && c.cost > 0,
    ),
    "Default carriers should ship with sensible starter fees, not disabled/free",
  );
  assert.equal((await api("/api/orders")).status, 403);
  assert.equal((await api("/api/coupons")).status, 403);
  assert.equal((await api("/api/products", "POST", {})).status, 403);
  assert.equal((await api("/api/database/backup", "POST", {})).status, 403);
  assert.equal(
    (await api("/api/auth/login", "POST", { email: "owner@example.test" }))
      .status,
    401,
  );
  assert.equal(
    (
      await api("/api/auth/login", "POST", {
        email: "admin@anything.test",
        password: "admin",
      })
    ).status,
    401,
  );
  const login = await api("/api/auth/login", "POST", {
    email: "owner@example.test",
    password,
  });
  assert.equal(login.status, 200);
  const cookie = login.cookie;
  const product = {
    name: "منتج اختبار",
    nameEn: "Test product",
    description: "وصف",
    descriptionEn: "Description",
    weight: "١ كجم",
    weightEn: "1 kg",
    category: "dates",
    price: 100,
    salePrice: 80,
    stock: 5,
    images: ["/images/ajwa.jpg"],
    isHidden: false,
    sku: "TEST",
  };
  let response = await api("/api/products", "POST", product, cookie);
  assert.equal(response.status, 201);
  const id = response.data.product.id;
  assert.equal(
    (await api(`/api/products/${id}`, "PUT", { stock: -1 }, cookie)).status,
    400,
  );
  assert.equal(
    (await api(`/api/products/${id}`, "PUT", { name: 17 }, cookie)).status,
    400,
  );
  assert.equal(
    (await api("/api/cms", "PUT", { heroSlides: null }, cookie)).status,
    400,
  );
  assert.equal(
    (await api("/api/cms", "PUT", { freeShippingThreshold: -5 }, cookie))
      .status,
    400,
  );
  assert.equal(
    (await api("/api/shipping/not-real", "PUT", { cost: 1 }, cookie)).status,
    404,
  );
  const customerAccount = await api("/api/auth/register", "POST", {
    name: "Customer",
    email: "customer@example.test",
    password,
    role: "admin",
  });
  assert.equal(customerAccount.data.user.role, "customer");
  assert.equal(
    (await api("/api/orders", "GET", undefined, customerAccount.cookie)).status,
    403,
  );

  await api(
    "/api/shipping/smsa",
    "PUT",
    { cost: 28, isEnabled: true, cityRates: { الرياض: 12 } },
    cookie,
  );
  await api(
    "/api/coupons",
    "POST",
    {
      code: "SAVE10",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 0,
      expiresAt: "2099-12-31",
      isActive: true,
    },
    cookie,
  );
  const order = {
    customer: {
      fullName: "Test Customer",
      mobile: "0501234567",
      city: "الرياض",
      address: "Test Street",
    },
    items: [{ productId: id, quantity: 2, price: 0 }],
    total: 0,
    discountAmount: 100000,
    shippingCarrier: "smsa",
    paymentMethod: "cod",
    paymentStatus: "paid",
    couponCode: "SAVE10",
  };
  const key = randomBytes(20).toString("hex");
  response = await api("/api/orders", "POST", order, undefined, {
    "Idempotency-Key": key,
  });
  assert.equal(response.status, 201);
  assert.equal(response.data.order.total, 156);
  assert.equal(response.data.order.paymentStatus, "pending");
  const orderId = response.data.order.id;
  const retry = await api("/api/orders", "POST", order, undefined, {
    "Idempotency-Key": key,
  });
  assert.equal(retry.data.order.id, orderId);
  assert.equal(
    (await api("/api/orders", "GET", undefined, cookie)).data.orders.length,
    1,
  );
  assert.equal(
    (
      await api("/api/orders", "POST", { ...order, total: 5 }, undefined, {
        "Idempotency-Key": key,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await api("/api/orders", "POST", {
        ...order,
        customer: { ...order.customer, fullName: 123 },
      })
    ).status,
    400,
  );
  assert.equal(
    (await api("/api/orders", "POST", { ...order, items: [null] })).status,
    400,
  );
  assert.equal(
    (
      await api(
        `/api/orders/${orderId}/collection`,
        "PUT",
        { collected: true },
        cookie,
      )
    ).status,
    400,
  );

  assert.equal(
    (await api("/api/orders", "POST", { ...order, paymentMethod: "mada" }))
      .status,
    400,
  );
  assert.equal(
    (
      await api("/api/orders", "POST", {
        ...order,
        items: [{ productId: id, quantity: 4 }],
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await api("/api/orders", "POST", {
        ...order,
        items: [
          { productId: id, quantity: 2 },
          { productId: id, quantity: 2 },
        ],
      })
    ).status,
    409,
  );
  assert.equal(
    (await api("/api/orders", "POST", { ...order, couponCode: "INVALID" }))
      .status,
    400,
  );
  await api(
    `/api/orders/${orderId}/status`,
    "PUT",
    { status: "cancelled" },
    cookie,
  );
  await api(
    `/api/orders/${orderId}/status`,
    "PUT",
    { status: "cancelled" },
    cookie,
  );
  response = await api("/api/products");
  assert.equal(response.data.products.find((p) => p.id === id).stock, 5);
  const second = await api("/api/orders", "POST", {
    ...order,
    items: [{ productId: id, quantity: 1 }],
  });
  await api(
    `/api/orders/${second.data.order.id}/status`,
    "PUT",
    { status: "delivered" },
    cookie,
  );
  assert.equal(
    (
      await api(
        `/api/orders/${second.data.order.id}/collection`,
        "PUT",
        { collected: true },
        cookie,
      )
    ).data.order.paymentStatus,
    "paid",
  );
  assert.equal(
    (
      await api(
        `/api/orders/${second.data.order.id}/status`,
        "PUT",
        { status: "cancelled" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await api(
        `/api/orders/${second.data.order.id}/status`,
        "PUT",
        { status: "new" },
        cookie,
      )
    ).status,
    400,
  );
  await api(`/api/products/${id}`, "PUT", { isHidden: true }, cookie);
  assert.ok(
    !(await api("/api/products?includeHidden=true")).data.products.some(
      (p) => p.id === id,
    ),
  );
  await api(
    "/api/cms",
    "PUT",
    {
      announcementText: "إعلان محفوظ",
      announcementTextEn: "Persisted announcement",
    },
    cookie,
  );
  const backup = await api("/api/database/backup", "POST", {}, cookie);
  assert.ok(backup.data.products.some((p) => p.id === id));
  assert.ok(!JSON.stringify(backup.data).includes("passwordHash"));
  await stop();
  await start();
  const relogin = await api("/api/auth/login", "POST", {
    email: "owner@example.test",
    password,
  });
  assert.equal(
    (await api("/api/cms")).data.cms.announcementTextEn,
    "Persisted announcement",
  );
  assert.ok(
    (
      await api("/api/orders", "GET", undefined, relogin.cookie)
    ).data.orders.some((o) => o.id === orderId),
  );
  assert.equal(
    (
      await api("/api/products", "GET", undefined, relogin.cookie)
    ).data.products.find((p) => p.id === id).stock,
    4,
  );
  assert.equal(
    (
      await api("/api/orders", "POST", order, undefined, {
        "Idempotency-Key": key,
      })
    ).data.order.id,
    orderId,
  );
  await api("/api/auth/logout", "POST", {}, relogin.cookie);
  assert.equal(
    (await api("/api/orders", "GET", undefined, relogin.cookie)).status,
    403,
  );
  console.log(
    "PASS: authentication, authorization, product validation, city shipping, coupons, server totals, payment state, stock, duplicate lines, cancellation, hidden products, backup, restart persistence, idempotent retries, clean startup, malformed input, role escalation protection, cash collection and logout.",
  );
} finally {
  await stop();
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: false, require: true },
  });
  await pool.query("DELETE FROM kv_store WHERE key = $1", [testStoreKey]);
  await pool.end();
}
