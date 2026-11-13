# Railway + Railway PostgreSQL Deployment Guide

This repository is pre-configured for **Railway** with **Railway PostgreSQL** using a unified monorepo deployment.

---

## 1. Quick Summary of What Has Been Configured

1. **Prisma Provider (`server/prisma/schema.prisma`)**:
   - Switched from SQLite to `postgresql` with connection URL `env("DATABASE_URL")`.
2. **Production Monorepo Server (`server/src/index.js`)**:
   - In production, Express automatically serves the built React frontend (`client/dist`) and falls back to `index.html` for client-side routing.
   - Both API and UI run on a single Railway domain and port, eliminating CORS issues entirely.
3. **Automated Migration (`railway.json`)**:
   - Railway is instructed via `railway.json` to build both client and Prisma engine, then run `npx prisma db push` automatically upon each deployment to ensure your PostgreSQL tables are created and synced.
4. **Environment Variables**:
   - `DATABASE_URL` is automatically provided by Railway when you attach a PostgreSQL database.

---

## 2. Step-by-Step Deployment on Railway

### Step 1: Push your Code to GitHub
```bash
git init
git add .
git commit -m "feat: setup garage workshop management app with Railway postgres support"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

### Step 2: Create a Project in Railway
1. Go to [railway.com](https://railway.com) and log in.
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"** and choose your repository.

---

### Step 3: Add Railway PostgreSQL Database
1. In your Railway project dashboard, click **"+ Create"** (or press `Cmd/Ctrl + K`).
2. Select **"Database"** → **"Add PostgreSQL"**.
3. Railway will provision a managed PostgreSQL database.

---

### Step 4: Connect the Database to Your Web Service
1. Click on your **Web Service** (the one deployed from your GitHub repo).
2. Go to the **Variables** tab.
3. Click **"New Variable"** → **"Add Reference"**.
4. Select `DATABASE_URL` from your **PostgreSQL** service.
   *(Railway will automatically map `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`)*.
5. In **Settings** → **Networking**, click **"Generate Domain"** to get a public URL (e.g., `https://apex-garage-production.up.railway.app`).

---

### Step 5: (Optional) Seed the Database with Realistic Data
To populate the 5 sample clients, 6 vehicles, 12 inventory items, and sample work orders:

#### Option A: Using the Railway Web Dashboard
1. Click on your Web Service in Railway.
2. Open the **"Deployments"** tab, click the three dots `...` on the active deployment, and select **"SSH"** or **"Run Command"**.
3. Run:
   ```bash
   node server/prisma/seed.js
   ```

#### Option B: Using the Railway CLI locally
```bash
# Link to your project
railway link

# Run the seed script against your remote Railway Postgres
railway run node server/prisma/seed.js
```

---

## 3. Local Development with PostgreSQL or SQLite

If you want to run locally with PostgreSQL:
1. Create a `server/.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/garage_db"
   PORT=5000
   ```
2. Run migrations & start:
   ```bash
   npm run db:push
   npm run db:seed
   npm run dev
   ```

