# Uniform shop app (Cloudflare Workers + D1)

Orders, invoices and stock for an embroidery and uniform shop.

## How the demo and the real shop fit together
- **Visitors with no login** see sample data from the `DEMO_DB` database. They can click through every screen. The code never writes to that database, and every save is refused with "This is the demo. Changes aren't saved. Sign in to save."
- **Click the profile circle, then Sign in.** Signed-in users work on the shop's own records in `LIVE_DB`, which starts empty. Everything saves.
- Accounts are made by the owner. The first login is created from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` secrets the first time anyone signs in. To add more people, insert a row in `users` (see "More logins").

## Deploy to Cloudflare (once)
```
npm install
npx wrangler login
npx wrangler r2 bucket create uniform-cf-note-files
npx wrangler d1 create uniform-demo      # copy the database_id it prints into wrangler.jsonc (DEMO_DB)
npx wrangler d1 create uniform-live      # same for LIVE_DB
npx wrangler d1 migrations apply DEMO_DB --remote
npx wrangler d1 migrations apply LIVE_DB --remote
npx wrangler d1 execute DEMO_DB --remote --file=data/demo-seed.sql
npm run deploy
npx wrangler secret put AUTH_SECRET      # any long random string
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_NAME
```
Then open the Worker in the Cloudflare dashboard, go to Settings, Domains and routes, and add your own domain.
To refresh the demo data later: edit `data/seed/uniform_app_dummy_data.json`, run `npm run seed`, then run the `d1 execute DEMO_DB` line again.

## Run it on your own computer first
```
npm install
npm run db:local        # creates both local databases and loads the demo data
npm run preview         # builds, then serves at http://localhost:8787
```
Before the first run, copy `.dev.vars.example` to `.dev.vars` and set a test login there. This file is only for your computer and is never uploaded.

## Limits to know about
- The bundle is about 1 MB gzipped, fine for the free plan. The free plan also allows 10 ms of CPU per request. If pages ever fail with a CPU limit error, the $5 a month Workers Paid plan removes that.
- D1 free tier is plenty for one shop (5 GB, millions of reads a day).
- Back up the live data now and then: `npx wrangler d1 export LIVE_DB --remote --output=backup.sql`

## What works
Customers (search, new, profile, edit prices per school, dated notes with private PDF/image attachments and edit/removal history) · orders (new, lines, stages with who moved it, discount, edit after confirming with a logged reason, dated notes with attachments) · reorder from a past order at today's prices · invoice (print or PDF) · production sheet (print) · record payment (oldest order first) · stock list, item history, add delivery, new stock item, reserved stock worked out from open orders and each garment's recipe · money owed report · setup: prices, garments (places, sizes, stock per piece), houses and crests · 3D studio opened from each order line, with the mockup saved on the line.

Note attachments are stored in the private `uniform-cf-note-files` R2 bucket. The `0007_customer_order_notes.sql` migration creates note/history tables and copies existing customer and order text notes into them. Apply migrations to both D1 databases before deploying. Attachments accept PDF, JPG, PNG and WebP files up to 10 MB.

## More logins
```
npx wrangler d1 execute LIVE_DB --remote --command "INSERT INTO users(email,name,password_hash) VALUES('x@y.com','Name','<hash>')"
```
The hash format is `pbkdf2$<salt hex>$<hash hex>` (PBKDF2-SHA256, 100,000 rounds). A simple way to make one: sign in as the owner on a fresh `LIVE_DB` with a different ADMIN_EMAIL, or ask for a small "Add a person" screen to be added.

## Not built yet
Per-person accounts screen · size breakdown picker on lines (typed as 6:2, 8:3 for now) · studio models for pinafore, skirt, tie, cap · demo orders other than the first only have one placeholder line.
