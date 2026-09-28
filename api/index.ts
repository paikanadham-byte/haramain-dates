// Vercel's filename-based convention: this single catch-all function handles every
// request under /api/* (e.g. /api/products, /api/auth/login) without any routes/
// rewrites config. The actual route handling lives in ../server.ts, which this file
// just re-exports so Vercel can invoke it as a serverless function.
export { default } from "../server.js";
