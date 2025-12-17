# Deploying s8vr to Vercel

This guide will walk you through deploying the s8vr frontend to Vercel and setting up the backend.

---

## 📋 Overview

**s8vr** consists of **three parts**:

1. **Frontend** (React/Vite) → Deploy to **Vercel** ✅
2. **Backend API** (Node.js/Express) → Deploy to **Railway** or **Render** ✅
3. **Database** (PostgreSQL) → Already hosted on **Supabase** ✅ (no deployment needed)

### Architecture Explanation

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ──────► │   Backend    │ ──────► │  Supabase   │
│   (Vercel)  │         │  (Railway)   │         │  (Database) │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │    Stripe    │
                        │   (Payments) │
                        └──────────────┘
```

- **Supabase** = Your database (PostgreSQL) - Already hosted, you just connect to it
- **Railway/Render** = Your backend API server (Node.js/Express) - Needs to be deployed
- **Vercel** = Your frontend (React app) - Needs to be deployed

**Important:** Supabase is NOT where you deploy your backend. Supabase is just the database. Your Express backend server needs to run on Railway/Render and connect to Supabase.

---

## 🚀 Part 1: Deploy Frontend to Vercel

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Ensure `vercel.json` is in the root directory** (already created ✅)

### Step 2: Deploy to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Select `s8vr-App` repository
   - Vercel will auto-detect Vite configuration

4. **Configure Build Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

### Step 3: Add Environment Variables

In the Vercel project settings, go to **Settings → Environment Variables** and add:

#### Frontend Environment Variables (Vercel)

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://mdvpvoiidifdlgjjigzb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test or live) | `pk_test_...` or `pk_live_...` |
| `VITE_API_URL` | Your backend API URL (see Part 2) | `https://your-backend.railway.app` or `https://your-backend.vercel.app` |

**Important Notes:**
- ✅ Add these for **Production**, **Preview**, and **Development** environments
- ✅ Replace `VITE_API_URL` with your actual backend URL after deploying the backend
- ✅ Use **live Stripe keys** (`pk_live_...`) for production
- ✅ Use **test Stripe keys** (`pk_test_...`) for preview/development

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Your frontend will be live at `https://your-project.vercel.app`

---

## 🔧 Part 2: Deploy Backend

You have **4 options** for backend deployment:

### Option A: Railway (Recommended - Easiest)

**Why Railway?** Your backend is a Node.js/Express server that needs to run 24/7. Railway hosts this server. Supabase is just the database it connects to.

1. **Go to [Railway.app](https://railway.app)** and sign up/login

2. **Create New Project → Deploy from GitHub Repo**

3. **Select your repository** and choose the `backend` folder
   
   **Note:** Your backend connects TO Supabase (the database), but runs ON Railway (the server host)

4. **Configure:**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

5. **Add Environment Variables in Railway:**
   
   | Variable Name | Description |
   |--------------|-------------|
   | `PORT` | Server port (Railway sets this automatically) |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | Your Vercel frontend URL: `https://your-project.vercel.app` |
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (⚠️ Keep secret!) |
   | `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` for production) |
   | `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (same as frontend) |
   | `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (get from Stripe dashboard) |
   | `RESEND_API_KEY` | Resend API key for email sending |

6. **Get your Railway URL:**
   - Railway will provide a URL like `https://your-app.up.railway.app`
   - Copy this URL

7. **Update Frontend Environment Variable:**
   - Go back to Vercel → Settings → Environment Variables
   - Update `VITE_API_URL` to your Railway backend URL
   - Redeploy the frontend

### Option B: Render

1. **Go to [Render.com](https://render.com)** and sign up/login

2. **Create New → Web Service**

3. **Connect GitHub repository:**
   - Select your repo
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

4. **Add Environment Variables** (same as Railway above)

5. **Get your Render URL** and update `VITE_API_URL` in Vercel

### Option C: Hetzner VPS (Full Control)

If you have a VPS (like Hetzner), you can deploy there for full control and often lower costs.

**See [HETZNER_DEPLOYMENT.md](./HETZNER_DEPLOYMENT.md) for complete guide.**

**Quick steps:**
1. SSH into your VPS
2. Install Node.js 20.x
3. Clone repository
4. Set up environment variables
5. Build and run with PM2
6. Configure Nginx (optional, for domain)

**Recommended:** Use Railway/Render for simplicity, or Hetzner VPS if you want full control.

### Option D: Vercel Serverless Functions (Advanced)

This requires converting your Express app to serverless functions. See [Vercel Serverless Functions Guide](https://vercel.com/docs/functions) for details.

**Not recommended** unless you're comfortable with serverless architecture.

---

## 🔗 Part 3: Configure Stripe Webhooks

After deploying your backend:

1. **Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)**

2. **Add Endpoint:**
   - **URL:** `https://your-backend-url.com/api/webhooks/stripe`
   - **Events to send:** Select these events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated`
     - `account.application.deauthorized`

3. **Copy the Webhook Signing Secret:**
   - It starts with `whsec_`
   - Add it to your backend environment variables as `STRIPE_WEBHOOK_SECRET`

4. **Update Backend Environment Variable:**
   - Add/update `STRIPE_WEBHOOK_SECRET` in Railway/Render
   - Restart your backend service

---

## ✅ Part 4: Final Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway/Render
- [ ] All environment variables added to both frontend and backend
- [ ] `VITE_API_URL` points to your backend URL
- [ ] Stripe webhooks configured
- [ ] Database migrations run in Supabase
- [ ] Test the deployment:
  - [ ] Can log in/sign up
  - [ ] Can create invoices
  - [ ] Can send invoices
  - [ ] Can process payments
  - [ ] Webhooks are working

---

## 🔐 Environment Variables Summary

### Frontend (Vercel)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
VITE_API_URL=https://your-backend.railway.app
```

### Backend (Railway/Render)

```env
PORT=3001 (or auto-set by platform)
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

---

## 🐛 Troubleshooting

### Frontend Issues

**Problem:** Build fails
- **Solution:** Check that all dependencies are in `package.json`
- Ensure `vercel.json` is correct

**Problem:** Environment variables not working
- **Solution:** Variables must start with `VITE_` to be exposed to frontend
- Redeploy after adding variables

**Problem:** API calls failing
- **Solution:** Check `VITE_API_URL` is correct
- Verify backend CORS allows your Vercel domain

### Backend Issues

**Problem:** Backend won't start
- **Solution:** Check `npm start` script exists in `backend/package.json`
- Verify all environment variables are set

**Problem:** Database connection errors
- **Solution:** Verify Supabase credentials
- Check that migrations have been run

**Problem:** Stripe webhooks not working
- **Solution:** Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check backend logs for webhook errors

---

## 📝 Additional Notes

### Custom Domain

1. In Vercel project settings → Domains
2. Add your custom domain
3. Update `FRONTEND_URL` in backend environment variables
4. Update Stripe webhook URL if needed

### Production Checklist

- [ ] Use **live Stripe keys** (`sk_live_`, `pk_live_`)
- [ ] Use **production Supabase** project (or ensure test project is secure)
- [ ] Set `NODE_ENV=production` in backend
- [ ] Enable **Vercel Analytics** (optional)
- [ ] Set up **error monitoring** (Sentry, etc.)
- [ ] Configure **backup strategy** for database
- [ ] Test all payment flows thoroughly

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **Project Docs:** See `GETTING_STARTED.md`

---

**Happy Deploying! 🚀**

