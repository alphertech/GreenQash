# GreenQash API (local)

This small Express API proxies common Supabase queries so your frontend doesn't expose sensitive keys.

Setup

1. Ensure `e:\a_apher.com\admins\.env` contains:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_or_service_key_here
PORT=3000
```

2. Install dependencies and start the API (from project root):

```powershell
cd e:\a_apher.com\admins\api
npm install
npm start
```

3. In `dashboard.html`, set `window.API_BASE_URL` to your API base (for local testing `http://localhost:3000`).

Notes
- The API uses `@supabase/supabase-js` and reads credentials from `.env`.
- Do NOT commit sensitive keys; `.gitignore` already excludes `.env`.
