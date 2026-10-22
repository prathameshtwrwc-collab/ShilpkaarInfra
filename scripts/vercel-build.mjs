// Build entry point used by Vercel (`vercel-build` script).
// 1. Without DATABASE_URL: showcase build (bundled content, no backend).
// 2. Applies pending migrations and the idempotent seed (never overwrites admin edits).
// 3. Runs `next build`, which prerenders pages from the database.
import { execSync } from "node:child_process";

const env = { ...process.env };

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });

if (!env.DATABASE_URL) {
  console.log(`
────────────────────────────────────────────────────────────────────
 Showcase mode: no DATABASE_URL set.

 The public site is built from bundled content. Online quote requests
 and the admin are switched off (and say so on the site).

 To enable them later: Vercel → Storage → Create Database → Neon →
 Connect, add a Blob store and SESSION_SECRET / IP_HASH_SALT, redeploy.
────────────────────────────────────────────────────────────────────
`);
  run("npx next build");
  process.exit(0);
}
if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) {
  console.error("DATABASE_URL must be a postgres:// or postgresql:// connection string.");
  process.exit(1);
}
// Migrations need a direct (non-pooled) connection; fall back to DATABASE_URL.
env.DATABASE_URL_UNPOOLED ||= env.DATABASE_URL;

if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
  console.warn("⚠ SESSION_SECRET is missing or shorter than 32 characters — admin login will not work until it is set.");
}
if (!env.BLOB_READ_WRITE_TOKEN && env.STORAGE_DRIVER !== "s3") {
  console.warn("⚠ No media storage configured (connect a Vercel Blob store or set STORAGE_DRIVER=s3). Admin uploads will be disabled.");
}

run("npx prisma migrate deploy");
run("npx tsx prisma/seed.ts");
run("npx next build");
