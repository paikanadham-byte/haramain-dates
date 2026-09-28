import pg from "pg";
import dotenv from "dotenv";
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
    console.log("Resetting database...\n");
    await pool.query("DELETE FROM kv_store WHERE key = 'store'");
    console.log("✓ Store data cleared. The app will start with an empty catalog.");
  } catch (error) {
    console.error("\n✗ Database reset failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
