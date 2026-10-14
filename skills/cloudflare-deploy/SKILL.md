---
name: cloudflare-deploy
description: Deploy and set up the uniform shop app on Cloudflare from the terminal with wrangler. Use to create the two D1 databases, apply migrations, load the demo data, set secrets, deploy the Worker, attach a domain and smoke-test it.
---

# Deploy the uniform shop app to Cloudflare

Run everything from the project root, the folder that holds `wrangler.jsonc` and `AGENTS.md`. Read `AGENTS.md` first. This skill is the deploy procedure, and `AGENTS.md` is the rulebook.

The app is a Next.js site on a Cloudflare Worker with two D1 databases:

- `DEMO_DB` (database `uniform-demo`) holds the sample data. Visitors with no login see it. It is read-only to the app.
- `LIVE_DB` (database `uniform-live`) holds the shop's real records. It starts empty.

## Hard rules

1. Load `data/demo-seed.sql` into `DEMO_DB` only. Never into `LIVE_DB`. The seed starts with `DELETE` statements, so running it against the live database wipes real records.
2. Never print, log, commit or paste a secret value. This covers `CLOUDFLARE_API_TOKEN`, `AUTH_SECRET`, `ADMIN_PASSWORD` and the contents of `.dev.vars`. Say that a secret was set, not what it is.
3. Before any command that changes remote data and is not listed in this skill, say what it does and get a yes. Never run `d1 delete`, `d1 execute LIVE_DB --remote` with `DELETE`, `DROP` or `UPDATE` without `WHERE`, or `wrangler delete` on your own initiative.
4. Run the live-database migrations and the demo seed only once per environment unless told to re-run. Migrations use `IF NOT EXISTS`, so re-running is safe. The demo seed is safe because it only touches the demo database.
5. If a step fails, stop and report the error text and the step. Do not improvise around it by editing application code.

## 0. Check access

```
node -v                       # 20 or newer, 22 preferred
npx wrangler --version        # 4.x
npx wrangler whoami           # must show the account that will host the site
```

Authentication comes from one of these:

- **Environment (preferred for agents):** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set. The token needs these permissions on the account: Workers Scripts: Edit, D1: Edit, Account Settings: Read. For a custom domain it also needs Zone: Read and Workers Routes: Edit (or DNS: Edit) on that zone. A token made from the "Edit Cloudflare Workers" template covers most of this. Add D1: Edit to it.
- **Browser login:** `npx wrangler login`. Only works where a browser can open. Ask the person to run it, or ask for a token.

If `whoami` shows more than one account, set `CLOUDFLARE_ACCOUNT_ID` so the right one is used. If access is missing, stop and ask the person for a token. Do not try to work around it.

## 1. Install

```
npm install        # also generates worker-configuration.d.ts through postinstall
npx tsc --noEmit   # must pass before deploying
```

## 2. Create the databases

Skip a database that already exists. Check first:

```
npx wrangler d1 list --json
```

Create what is missing:

```
npx wrangler d1 create uniform-demo
npx wrangler d1 create uniform-live
```

Pick a location hint only if the person asks, for example `--location weur`.

Put the real ids into `wrangler.jsonc`. The file holds two placeholders, `REPLACE_WITH_DEMO_DB_ID` and `REPLACE_WITH_LIVE_DB_ID`. Fill them without printing anything else:

```
node -e '
const {execSync}=require("child_process"),fs=require("fs");
const list=JSON.parse(execSync("npx wrangler d1 list --json",{encoding:"utf8"}));
const id=n=>{const d=list.find(x=>x.name===n);if(!d)throw new Error(n+" not found");return d.uuid};
let s=fs.readFileSync("wrangler.jsonc","utf8");
s=s.replace("REPLACE_WITH_DEMO_DB_ID",id("uniform-demo")).replace("REPLACE_WITH_LIVE_DB_ID",id("uniform-live"));
fs.writeFileSync("wrangler.jsonc",s);console.log("wrangler.jsonc updated");'
npx wrangler types --env-interface CloudflareEnv
grep -c REPLACE_WITH wrangler.jsonc    # must print 0
```

Database ids are not secret. Keep them in `wrangler.jsonc` and commit that file.

## 3. Schema and demo data

```
npx wrangler d1 migrations apply DEMO_DB --remote
npx wrangler d1 migrations apply LIVE_DB --remote
npm run seed
npx wrangler d1 execute DEMO_DB --remote --file=data/demo-seed.sql --yes
```

Answer yes if migrations ask to proceed. Check the result:

```
npx wrangler d1 execute DEMO_DB --remote --json --command "SELECT (SELECT COUNT(*) FROM customers) customers, (SELECT COUNT(*) FROM order_lines) lines, (SELECT COUNT(*) FROM stock_items) stock"
npx wrangler d1 execute LIVE_DB --remote --json --command "SELECT COUNT(*) AS customers FROM customers"
```

Expected: demo has 5 customers, 22 order lines and 13 stock items. Live has 0 customers.

## 4. Deploy the Worker

```
npm run deploy
```

This builds with OpenNext and uploads. Note the `https://<name>.<subdomain>.workers.dev` address it prints. If the build fails, report the first error. The most common causes are in the troubleshooting list below.

## 5. Secrets

Set these after the first deploy. The Worker exists by then.

```
printf '%s' "$AUTH_SECRET"     | npx wrangler secret put AUTH_SECRET
printf '%s' "$ADMIN_EMAIL"     | npx wrangler secret put ADMIN_EMAIL
printf '%s' "$ADMIN_PASSWORD"  | npx wrangler secret put ADMIN_PASSWORD
printf '%s' "$ADMIN_NAME"      | npx wrangler secret put ADMIN_NAME
```

Where the values come from:

- `AUTH_SECRET`: if the person gave none, generate one with `openssl rand -base64 48`. Store it only in the secret. Tell the person it was generated and set, not what it is.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: ask the person. The password must be at least 12 characters. Never invent a password for the shop owner. If you must create a temporary one, say it is temporary and ask them to replace it.

Confirm the names exist without showing values:

```
npx wrangler secret list
```

Expected: the four names above.

## 6. Custom domain (optional)

Needs the domain's zone to be in the same Cloudflare account. Add this to `wrangler.jsonc`, replacing the hostname, then redeploy:

```
"routes": [{ "pattern": "app.example.com", "custom_domain": true }]
```

```
npm run deploy
```

Cloudflare creates the DNS record and certificate. It can take a few minutes. If the zone is elsewhere, tell the person to add the domain in the dashboard under the Worker, Settings, Domains and routes.

## 7. Smoke test

Set `SITE` to the deployed address. The first three checks prove the demo is public and read-only.

```
SITE=https://<address>
for p in / /orders/o1 /stock /reports /setup /login; do printf "%s %s\n" $p $(curl -s -o /dev/null -w '%{http_code}' $SITE$p); done
curl -s $SITE/reports | grep -o '₦773,000' | head -1
curl -s -o /dev/null -w 'visitor write: %{http_code}\n' -X POST -H 'content-type: application/json' -d '{"name":"X"}' $SITE/api/customers
```

Expected: every page prints 200, the report shows `₦773,000`, and the visitor write prints `403`.

Then the live side, using the real admin login, passed from the environment and not typed into the command line history if avoidable:

```
curl -s -c /tmp/cj -o /dev/null -w 'login: %{http_code}\n' -X POST -H 'content-type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" $SITE/api/login
curl -s -b /tmp/cj $SITE/ | grep -c Greenfield     # expect 0, the live side is empty
rm -f /tmp/cj
```

Expected: login prints `200`, and the live home page shows no Greenfield. Do not create test records in the live database. If a write test is needed, ask first and delete the record afterwards.

## 8. Report back

Give the person:

- The live address, and the custom domain if one was added.
- That the demo works for visitors and refuses saves, and that the owner login works.
- Which secrets were set (names only).
- How to back up: `npx wrangler d1 export LIVE_DB --remote --output=backup.sql`.
- Anything skipped or left for them.

## Updating later

- Code change: `npx tsc --noEmit`, then `npm run deploy`. Secrets and data stay.
- Schema change: add `migrations/000N_name.sql`, then apply to both databases with `--remote`, then deploy.
- New sample data: edit `data/seed/uniform_app_dummy_data.json`, run `npm run seed`, run the demo seed command from step 3.
- Rolling back a bad deploy: `npx wrangler deployments list`, then `npx wrangler rollback`. This changes live traffic, so say so first.
- Backup before any live schema change: export `LIVE_DB` first.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Authentication error` or code 10000 | The token lacks a permission or is for another account. Check `whoami` and the permissions in step 0. |
| `database_id` errors on deploy | A placeholder is still in `wrangler.jsonc`. Redo step 2. |
| `Property 'D1Database' does not exist` during build | Types are missing. Run `npx wrangler types --env-interface CloudflareEnv`. |
| Every page returns 500 and the log says `Set the AUTH_SECRET secret` | Secrets are not set yet. Do step 5. |
| Sign in returns 401 for the right password | `users` already has a different first user, or the secrets were changed after the first sign-in. The admin account is created only when `users` is empty. Check with `d1 execute LIVE_DB --remote --command "SELECT email FROM users"`. |
| Sign in returns 429 | Eight failures in ten minutes from one address. Wait, or clear with `d1 execute LIVE_DB --remote --command "DELETE FROM login_attempts"`. |
| Pages fail with `Worker exceeded CPU time limit` | The free plan allows 10 ms of CPU per request. Tell the person the paid Workers plan removes this. Do not strip features to fit. |
| Upload too large | Free plan allows 3 MB compressed. The app is about 1 MB. A jump means something large was imported, so look at what changed. |
| `no such table` | Migrations were not applied to that database. Redo step 3 with `--remote`. |
| Demo pages are empty | The seed was not loaded into `DEMO_DB`. Run the step 3 seed command. |
| Studio opens but 3D is blank | The browser could not load three.js from cdnjs. It is not a deploy problem. |
