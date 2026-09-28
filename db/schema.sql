-- Neon PostgreSQL schema for Haramain Dates.
--
-- The application stores its whole state (products, orders, coupons, CMS
-- content, shipping options and users) as a single JSON document in this
-- table, under the fixed key 'store'. This mirrors the previously-tested
-- file-backed data model exactly, just persisted in Postgres instead of a
-- local JSON file, so the validation, session and business logic in
-- server.ts do not need to change shape between requests.
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
