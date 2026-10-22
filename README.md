# SHILPKAR TRANSIT INFRA LLP — Website & Sales Pipeline

Marketing website, material catalogue, quote-request pipeline and admin CMS for SHILPKAR TRANSIT INFRA LLP (construction materials, bulk transportation and site logistics, Mumbai Metropolitan Region).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL · Vercel Blob · GSAP + Motion · react-three-fiber · zod · jose/bcrypt auth · sharp.

## Showcase mode (no database)

If `DATABASE_URL` is not set, the site runs with **no backend at all**: every public page is built from the bundled content in `src/lib/seed-data.ts`. Nothing pretends to work:

- The quote form stays usable but shows "Online quote requests are launching soon" and a **Send these details on WhatsApp** button that turns the filled-in form into a WhatsApp message.
- `/admin/login` shows a "Coming soon" notice; admin pages and APIs stay locked.

Deploy it as-is on Vercel (no environment variables needed). Adding the database later (steps below) switches everything on with no code change.

## Deploying on Vercel (full version)

1. **Database:** Vercel → your project → **Storage** → **Create Database** → **Neon** → **Connect** (all environments). This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
2. **Media:** **Storage** → **Create** → **Blob** → **Connect**. This adds `BLOB_READ_WRITE_TOKEN`; uploads then go to Blob automatically. Large videos upload straight from the browser to Blob, so Vercel's 4.5 MB request limit doesn't apply.
3. **Environment variables** (Settings → Environment Variables): `SESSION_SECRET` and `IP_HASH_SALT` (32+ random characters each), `SITE_URL` (e.g. `https://shilpkar.in`). Optional: `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_TO`.
4. **Redeploy.** The `vercel-build` script applies database migrations, runs the seed (only adds missing records; never overwrites admin edits) and builds.
5. **Create your admin** from your computer, pointing at the production database:
   ```bash
   # with DATABASE_URL / DATABASE_URL_UNPOOLED from Vercel in your local .env
   npm run admin:create -- --email you@example.com --name "Your Name"
   ```

---

## Quick start (local)

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # fill DATABASE_URL(+_UNPOOLED) with a Postgres URL, SESSION_SECRET, IP_HASH_SALT
npx prisma migrate deploy   # create the database schema
npm run db:seed             # 11 materials, 6 services, 4 fleet classes, licensed imagery
npm run admin:create -- --email you@example.com --name "Your Name"   # prompts for a password (min 12 chars)
npm run dev                 # http://localhost:3000  · admin: /admin/login
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

There is **no public registration** route. Admins are created (or have their password reset) only with `npm run admin:create` on the server. The password is read from a prompt or the `ADMIN_PASSWORD` env var — never from CLI arguments.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Idempotent seed — never overwrites content edited in the admin |
| `npm run admin:create` | Create an admin or reset a password |

## Routes

Public: `/`, `/products`, `/products/[slug]`, `/services`, `/fleet`, `/about`, `/contact`, `/credits`, `/sitemap.xml`, `/robots.txt`

Admin (session-protected in middleware **and** re-checked server-side in every page, action and API): `/admin/login`, `/admin` (dashboard), `/admin/enquiries[/id]`, `/admin/products[/new|/id]`, `/admin/services`, `/admin/fleet`, `/admin/content`, `/admin/media`, `/admin/preview/products/[id]`, `/api/admin/media`, `/api/admin/enquiries/export`.

## How things work

- **Content source** — everything the public site renders (products, categories, services, fleet, industries, differentiators, hero/about/contact/footer copy, stats, media) comes from the database the admin edits. Saving in the admin revalidates the public pages immediately.
- **Quote requests** — validated on the client and again on the server (zod), protected by a honeypot field, a minimum fill time and a per-IP rate limit (5 per 10 minutes, IPs stored only as salted hashes). The enquiry is **saved first**; email notification runs afterwards and its result (`SENT`/`FAILED`/`DISABLED`) is recorded on the enquiry, so a mail outage never loses a lead. The visitor receives a backend-generated reference (e.g. `STI-261023-C48VP`).
- **Product deletion** — enquiries keep a snapshot of the material name; deleting or unpublishing a product never corrupts enquiry records.
- **Media** — uploads are type-checked by magic bytes (not the client's MIME type), size-limited (images 12 MB, video 80 MB), and images are re-encoded to WebP through sharp, which strips EXIF/metadata. "Replace file" keeps the same ID, so every page using it updates. Files still in use cannot be deleted.
- **Sessions** — HS256 JWT in an HttpOnly, SameSite=Lax cookie (Secure in production), 8-hour expiry; the admin must still exist in the DB on every request. Login is rate-limited (8 per 15 minutes per IP) with constant-work password checks.

## Configuration still required for production

These depend on your hosting and accounts, so they are implemented but not switched on:

1. **Database** — PostgreSQL only (Neon via Vercel is the simplest). Any Postgres works: set `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct; may be the same URL).
2. **Media storage** — Vercel Blob is used automatically when `BLOB_READ_WRITE_TOKEN` is set. Alternatively `STORAGE_DRIVER=s3` with `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (R2/MinIO), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`. Local disk is for development only and is refused on Vercel with a clear message.
3. **Email notifications** — set `RESEND_API_KEY`, `NOTIFY_FROM` (a sender on a domain verified with Resend) and `NOTIFY_TO`. Until then enquiries are still saved and shown in the admin with notification status `disabled`.
4. **`SITE_URL`** — your public domain, used for canonical URLs, Open Graph images, robots and the sitemap.

## Imagery

All bundled photographs are real, openly licensed images from Wikimedia Commons, each stored with its photographer, licence and source URL (see `/credits` and the admin media library). They are marked **"Representative image"** on the site because they are not SHILPKAR's own stock or vehicles. Replace them with company photographs via **Admin → Media library → Replace file** (the label disappears when "Representative" is switched off).

Outstanding photography:

- **Tata 4825 (multi-axle dumper)** — no openly licensed photograph of this model was found, so the site shows a clearly labelled line drawing until a real photo is uploaded in **Admin → Fleet**.
- **Murum** uses laterite-gravel photographs as the closest licensed match; replace with a photo of your own murum when available.
- **Hero video** — none bundled. Upload an MP4/WebM in **Admin → Page content → Hero**; it plays muted on desktop only, with the photograph as poster and as the fallback for mobile, slow connections and reduced-motion users.

## Design system (quick reference)

Tokens live in `src/app/globals.css`: graphite `ink`, limestone `paper`, concrete `paper-3`, construction orange `accent` (fills/dark surfaces) and `accent-deep` (text on light surfaces, ≥4.8:1). Type: Archivo condensed (display), Instrument Serif italic (accents), Inter Tight (body), JetBrains Mono (technical labels). Motion respects `prefers-reduced-motion`; content is visible without JavaScript.
