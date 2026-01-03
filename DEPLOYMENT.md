# Deployment Guide: PulseCare to Netlify + Render

This guide walks you through deploying the frontend to Netlify and backend to Render in ~15 minutes.

## Prerequisites
- GitHub account
- Netlify account (free)
- Render account (free)
- Git installed locally

## Step 1: Push Code to GitHub

1. **Create a GitHub repo** at [github.com/new](https://github.com/new)
   - Name: `pulsecare` (or your choice)
   - Make it public or private

2. **Push your local code:**
   ```bash
   cd ~/Desktop/py
   git init
   git add .
   git commit -m "Initial commit: doctor appointment app"
   git remote add origin https://github.com/<your-username>/pulsecare.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy Backend to Render

1. **Go to [render.com](https://render.com)**
   - Sign up with GitHub (recommended)

2. **Create new Web Service:**
   - Click **New+** → **Web Service**
   - Connect your GitHub repo (`pulsecare`)
   - Set **Root directory**: `server`
   - Build: `npm install`
   - Start: `npm start`
   - Instance: Free tier OK

3. **Add Environment Variables:**
   - Click **Environment** tab
   - Add these (get values from your local `.env`):
     ```
     PORT=4000
     DB_PATH=/var/data/data.db
     GEMINI_API_KEY=<your-gemini-key>
     RECAPTCHA_SECRET=<your-recaptcha-secret>
     ```

4. **Create a Disk (for persistent SQLite):**
   - Click **Disks** tab
   - Create disk: name=`data`, mount path=`/var/data`, size=`1 GB`

5. **Deploy:**
   - Click **Create Web Service**
   - Wait ~2–3 min for build/deploy
   - Copy your service URL, e.g., `https://py-backend-w56c.onrender.com`

---

## Step 3: Deploy Frontend to Netlify

1. **Go to [netlify.com](https://netlify.com)**
   - Sign up with GitHub

2. **Create new site:**
   - Click **Add new site** → **Import an existing project**
   - Select your GitHub repo

3. **Configure build:**
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. **Add Environment Variables:**
   - Go to **Site settings** → **Build & deploy** → **Environment**
   - Add:
     ```
   VITE_API_BASE=https://py-backend-w56c.onrender.com/api
     VITE_RECAPTCHA_SITE_KEY=6Lcg2D4sAAAAAPadVQ3DtJzFjb4kwy_qtTsyyeIP
     VITE_GOOGLE_MAPS_API_KEY=<optional>
     ```
   - (Replace `py-backend-w56c.onrender.com` with your actual Render URL)

5. **Deploy:**
   - Click **Deploy site**
   - Wait ~1–2 min
   - Your site URL: `https://your-site-name.netlify.app`

---

## Step 4: Test

1. **Open your Netlify site** in browser
2. Try **User Register** → fill form → check reCAPTCHA box → **Register**
3. If successful → backend is linked ✅
4. Log in, book appointment, test doctor dashboard

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Netlify build fails** | Check `client/package.json` has all deps; run `npm install` locally |
| **API calls 404** | Verify `VITE_API_BASE` is correct Render URL in Netlify env vars |
| **reCAPTCHA fails** | Ensure `VITE_RECAPTCHA_SITE_KEY` matches your Google key |
| **Backend 500 errors** | Check Render logs: click service → **Logs** tab |
| **SQLite errors** | Ensure `DB_PATH=/var/data/data.db` is set and disk is created on Render |

---

## What You Get

- **Frontend**: Live at `https://your-site.netlify.app` (updated on every GitHub push)
- **Backend**: Live at `https://py-backend-w56c.onrender.com` (updated on every GitHub push)
- **Database**: Persisted on Render disk at `/var/data/data.db`
- **CI/CD**: Both auto-deploy when you `git push`

---

## Optional: Custom Domain

- Netlify → **Site settings** → **Domain management** → add custom domain
- Render → similar option in service settings

---

**Done!** Your app is now live and auto-deployed. 🎉
