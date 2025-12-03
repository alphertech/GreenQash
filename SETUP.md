# GreenQash Setup Guide

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/alphertech/GreenQash.git
cd GreenQash
```

### 2. Install Dependencies
```bash
npm install
cd api && npm install && cd ..
```

### 3. Configure Supabase Credentials
The app uses Supabase for authentication and database. You must provide your credentials:

**Step 1:** Copy the template file
```bash
cp CONFIG_TEMPLATE.js config.js
```

**Step 2:** Edit `config.js` and add your credentials
- Open `config.js` in your editor
- Go to [Supabase Dashboard](https://supabase.com)
- Open your project settings
- Copy your **Project URL** and **Anon Key**
- Paste them into `config.js`:

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  key: 'your-anon-key-here'
};
```

**Step 3:** Save `config.js` and keep it private (it's in `.gitignore`)

### 4. Run the App

**Option A: Frontend Only** (connects to Supabase directly)
```bash
npx http-server -c-1 -p 8080
```
Then open http://localhost:8080

**Option B: With API Proxy** (backend reads credentials from `.env`)
```bash
npm start
```
This runs both the API (port 3000) and frontend (port 8080).

### 5. Create `.env` (optional, for API proxy)
If running the API proxy (`npm start`), create a `.env` file in the root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
NODE_ENV=development
```

This file is in `.gitignore` and will NOT be committed.

## Files
- `config.js` → Local Supabase config (frontend). Create from `CONFIG_TEMPLATE.js`. In `.gitignore` (private).
- `.env` → Optional local API config. In `.gitignore` (private).
- `auth.js` → Supabase authentication (register/login/session management).
- `server.js` → Dashboard data fetching (profile, earnings, contents, etc.).
- `dashboard.html` → User dashboard (displays after login).

## Troubleshooting

**"Supabase client not found" error:**
- Make sure `config.js` exists and is loaded before `auth.js`
- Check browser console for `window.SUPABASE_CONFIG`

**Dashboard doesn't load after login:**
- Check browser DevTools Console for errors
- Verify `config.js` has valid Supabase credentials
- Verify the `users` table exists in your Supabase project

**API proxy not connecting:**
- Ensure `.env` exists with valid `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Run: `cd api && npm install && node index.js` to test the API separately
