# FIFA World Cup 2026 Friends Predictor

Predict exact scores with friends — no accounts, just a league PIN and your display name.

## Stack

- **Next.js** (App Router)
- **Supabase** (Postgres)
- **Render** (hosting)
- Match data from [wcup2026.org](https://wcup2026.org/api/data.php?action=all)

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
