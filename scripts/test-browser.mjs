// Optional browser regression test. Uses an isolated database row and deletes it afterward.
// npm install --no-save playwright; npx playwright install chromium
// node scripts/test-browser.mjs
// BROWSER_TOOLS_DIR may point to a separate installation containing playwright and @sparticuz/chromium.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
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

const tools = process.env.BROWSER_TOOLS_DIR;
const { chromium } = await import(
  tools
    ? pathToFileURL(path.join(tools, "node_modules/playwright/index.mjs")).href
    : "playwright"
);
let options = { headless: true };
if (tools) {
  const { default: binary } = await import(
    pathToFileURL(
      path.join(tools, "node_modules/@sparticuz/chromium/build/index.js"),
    ).href
  );
  options = {
    ...options,
    executablePath: await binary.executablePath(),
    args: binary.args,
  };
}
const testStoreKey = "test-" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const server = spawn(process.execPath, ["dist/server.cjs"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3102",
    KV_STORE_KEY: testStoreKey,
    ADMIN_EMAIL: "owner@example.test",
    ADMIN_PASSWORD: password,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Server timeout")), 15000);
    server.stdout.on("data", (data) => {
      if (String(data).includes("listening")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", (code) => reject(Error("Server exited " + code)));
  });
  browser = await chromium.launch(options);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.addInitScript(() => localStorage.setItem("hrm_lang", "en"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:3102/admin");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("alert").waitFor();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: "Products", exact: true })
    .click();
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  for (const [label, value] of Object.entries({
    "Name — Arabic": "تمر اختبار",
    "Name — English": "Browser Test Dates",
    "Weight — Arabic": "١ كجم",
    "Weight — English": "1 kg",
    "Origin — Arabic": "القصيم",
    "Origin — English": "Qassim",
    "Regular price": "100",
    "Sale price (optional)": "80",
    "Stock quantity": "5",
    SKU: "BROWSER-TEST",
    "Description — Arabic": "وصف المنتج للاختبار",
    "Description — English": "Browser test product description",
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .locator("input[type=file]")
    .setInputFiles(["public/images/ajwa.jpg", "public/images/hero-dates.jpg"]);
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await page
    .getByRole("heading", { name: "Browser Test Dates", exact: true })
    .waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: "Coupons", exact: true })
    .click();
  await page.getByRole("button", { name: "Add coupon", exact: true }).click();
  await page.getByLabel("Code (English letters and numbers)").fill("BROWSER10");
  await page.getByLabel("Expiry date").fill("2099-12-31");
  await page.getByRole("button", { name: "Save coupon", exact: true }).click();
  await page.getByText("BROWSER10", { exact: true }).waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: "Shipping & payment", exact: true })
    .click();
  await page.getByLabel("Carrier enabled").first().check();
  await page.getByLabel("Default fee (SAR)").first().fill("12");
  await page
    .getByRole("button", { name: "Save shipping settings", exact: true })
    .click();
  await page.getByRole("status").waitFor();
  await page.getByRole("button", { name: "View store", exact: true }).click();
  await page
    .getByRole("heading", { name: "Browser Test Dates", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Wishlist", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Wishlist", exact: true })
    .first()
    .click();
  await page.getByRole("heading", { name: "Wishlist", exact: true }).waitFor();
  await page
    .getByRole("heading", { name: "Browser Test Dates", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Show all products", exact: true })
    .click();
  // No fake review counts or disabled contact links.
  assert.equal(await page.locator('a[href=""]').count(), 0);
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  const savedCart = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hrm_cart")),
  );
  assert.ok(
    !JSON.stringify(savedCart).includes("data:image"),
    "Cart must not persist uploaded image payloads",
  );
  await page.reload();
  await page.getByRole("button", { name: /Shopping Cart/ }).click();
  await page.getByPlaceholder("Coupon Code").fill("BROWSER10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .getByRole("button", { name: "Proceed to Checkout", exact: true })
    .click();
  await page
    .getByPlaceholder("e.g. Mohammed Al-Saeed")
    .fill("Browser Customer");
  await page.getByPlaceholder("05XXXXXXXX").fill("0501234567");
  await page
    .getByPlaceholder("District name, street name, building/villa number")
    .fill("Test delivery street");
  await page.getByRole("button", { name: /Confirm & Place Order/ }).click();
  await page.getByText(/Your order has been received/).waitFor();
  const orders = await page.request.get("http://localhost:3102/api/orders");
  const { orders: allOrders } = await orders.json();
  assert.equal(allOrders.length, 1);
  assert.equal(allOrders[0].total, 84);
  assert.equal(allOrders[0].paymentStatus, "pending");
  await page.goto("http://localhost:3102/admin");
  await page
    .locator("nav")
    .getByRole("button", { name: /Orders/ })
    .click();
  await page.locator("main select").selectOption("delivered");
  await page.getByRole("status").waitFor();
  await page.getByRole("button", { name: "Details", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Confirm cash collected", exact: true })
    .click();
  await page.getByText("Cash collection confirmed", { exact: true }).waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: "Products", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Stock quantity", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await page.getByText("Out of stock", { exact: true }).waitFor();
  await page.getByRole("button", { name: "View store", exact: true }).click();
  // Check language switching and horizontal overflow at phone/tablet/desktop widths.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["ar", "en"]) {
      await page.evaluate((lang) => {
        localStorage.setItem("hrm_lang", lang);
      }, language);
      // init script is overridden here by using the actual language switch.
      const current = await page.locator("html").getAttribute("lang");
      if (current !== language)
        await page
          .getByRole("button", {
            name: language === "ar" ? "التحويل للعربية" : "Switch to English",
            exact: true,
          })
          .first()
          .click();
      assert.equal(
        await page.locator("html").getAttribute("dir"),
        language === "ar" ? "rtl" : "ltr",
      );
      const dimensions = await page.evaluate(() => ({
        viewport: innerWidth,
        content: document.documentElement.scrollWidth,
      }));
      assert.ok(
        dimensions.content <= dimensions.viewport + 1,
        `Overflow: ${JSON.stringify({ width, language, ...dimensions })}`,
      );
    }
  }
  // Unavailable inventory is not orderable.
  assert.ok(
    await page
      .getByRole("button", { name: "Out of Stock", exact: true })
      .isDisabled(),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real browser owner login, product creation with two images, coupon creation, shipping setup, cart, discount, COD checkout, order collection, inventory edit, RTL/LTR switching, no page exceptions, and 320/390/768/1440px overflow checks.",
  );
} finally {
  if (browser) await browser.close();
  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill();
  await exited;
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: false, require: true },
  });
  await pool.query("DELETE FROM kv_store WHERE key = $1", [testStoreKey]);
  await pool.end();
}
