# FIFA World Cup 2026 Friends Predictor

Predict exact scores with friends — no accounts, just a league PIN and your display name.

## Stack

- **Next.js** (App Router)
- **Supabase** (Postgres)
- **Render** (hosting)
- Match data from [wcup2026.org](https://wcup2026.org/api/data.php?action=all)

## Deploy on Render (Tranquil workspace)

### Option A — One-click Blueprint (recommended)

1. Open [Render Blueprint deploy](https://render.com/deploy?repo=https://github.com/SHREYASTIWARY1107/Fifa-predictor)
2. Sign in to **Tranquil's workspace** (`tranquil.ai@gmail.com`)
3. When prompted, set:
   - `LEAGUE_PIN` — your friends PIN (e.g. `1234`)
   - `SUPABASE_SERVICE_ROLE_KEY` — from [Supabase API settings](https://supabase.com/dashboard/project/vnusxxzhcwtfbsfkuiro/settings/api) (`service_role` secret)
4. Deploy — Render builds from `main` automatically

### Option B — Render MCP / API

1. Create an API key in [Render Account Settings → API Keys](https://dashboard.render.com/u/usr-d831l5ek1jos73bajs0/settings#api-keys)
2. Update `~/.cursor/mcp.json` → `render.headers.Authorization` with `Bearer rnd_YOUR_KEY`
3. **Reload Cursor** (MCP picks up the new key)
4. Run: `RENDER_API_KEY=rnd_xxx node scripts/deploy-render.mjs`

### After deploy

Add env var `SUPABASE_SERVICE_ROLE_KEY` if not set, then trigger a redeploy.

Optional cron (every 10 min):

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://YOUR-APP.onrender.com/api/cron/sync-matches
```

## Local setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Fill in Supabase keys and league settings in `.env.local`.

3. Install and run:

```bash
npm install
npm run dev
```

4. Seed matches (after Supabase schema is applied):

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Scoring

- **3 pts** — exact score
- **1 pt** — correct result (win/draw/loss)
- **0 pts** — wrong result

Predictions lock at kickoff.

## Deploy (Render)

- Build: `npm install && npm run build`
- Start: `npm start`
- Set env vars: `LEAGUE_PIN`, `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Optional cron every 10 minutes:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/sync-matches
```
