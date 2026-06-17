# Deploy on Render (Tranquil workspace)

Blueprint sync can fail if billing isn't set up. Use **Web Service** instead (more reliable on free tier).

## Steps (5 minutes)

1. Open https://dashboard.render.com/select-repo?type=web
2. Connect **GitHub** → choose **SHREYASTIWARY1107/Fifa-predictor**
3. Settings:
   - **Name:** `fifa-predictor`
   - **Region:** Oregon
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
   - **Plan:** Free
4. **Environment variables** (add all):

| Key | Value |
|-----|--------|
| `NODE_VERSION` | `20` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vnusxxzhcwtfbsfkuiro.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Supabase → API → anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase → API → service_role) |
| `LEAGUE_PIN` | `1234` |
| `CRON_SECRET` | any random string |

5. Click **Create Web Service**
6. Wait for build → copy your `.onrender.com` URL

## If Blueprint failed

- Dashboard → **Blueprints** → delete the failed `fifa-predictor` blueprint (optional)
- Use **Web Service** steps above instead

## Test

- Open URL → PIN `1234` → pick name → predict a match
