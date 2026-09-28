import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false, require: true },
});

async function main() {
  try {
    console.log("Initializing Neon database...\n");
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✓ Connected to Neon PostgreSQL at:", result.rows[0].now);
    client.release();

    const schema = fs.readFileSync(
      path.join(process.cwd(), "db", "schema.sql"),
      "utf8",
    );
    await pool.query(schema);
    console.log("✓ kv_store table ready");

    const existing = await pool.query(
      "SELECT 1 FROM kv_store WHERE key = 'store'",
    );
    console.log(
      existing.rows.length
        ? "✓ Existing store data found; left untouched"
        : "✓ No store data yet; the app creates an empty catalog on first start",
    );

    console.log("\n✓ Database initialization complete!");
  } catch (error) {
    console.error("\n✗ Database initialization failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
