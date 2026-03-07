# Environment Variables Reference

Quick reference for all environment variables needed for s8vr deployment.

---

## 🎨 Frontend (Vercel)

Add these in **Vercel Dashboard → Settings → Environment Variables**

```env
VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (production) or pk_test_... (development)
VITE_API_URL=https://your-backend.railway.app
```

### Where to get these values:

- **VITE_SUPABASE_URL** & **VITE_SUPABASE_ANON_KEY**: 
  - Go to: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/settings/api
  - Copy "Project URL" and "anon public" key

- **VITE_STRIPE_PUBLISHABLE_KEY**:
  - Go to: https://dashboard.stripe.com/apikeys
  - Copy "Publishable key" (use `pk_live_...` for production, `pk_test_...` for dev)

- **VITE_API_URL**:
  - This is your backend URL (Railway/Render)
  - Set this AFTER deploying the backend

---

## 🔧 Backend (Railway/Render)

Add these in your hosting platform's environment variables section.

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_live_... (production) or sk_test_... (development)
STRIPE_PUBLISHABLE_KEY=pk_live_... (production) or pk_test_... (development)
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### Where to get these values:

- **PORT**: 
  - Railway/Render sets this automatically (usually `PORT` env var)
  - You can set it manually if needed

- **NODE_ENV**: 
  - Set to `production` for production deployments

- **FRONTEND_URL**: 
  - Your Vercel frontend URL: `https://your-project.vercel.app`
  - Used for CORS configuration

- **SUPABASE_URL**: 
  - Same as frontend: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/settings/api
  - Copy "Project URL"

- **SUPABASE_SERVICE_ROLE_KEY**: 
  - ⚠️ **SECRET** - Never expose this in frontend!
  - Same page as above, copy "service_role" key (starts with `eyJhbGci...`)

- **STRIPE_SECRET_KEY**: 
  - Go to: https://dashboard.stripe.com/apikeys
  - Copy "Secret key" (use `sk_live_...` for production, `sk_test_...` for dev)
  - ⚠️ **SECRET** - Keep this safe!

- **STRIPE_PUBLISHABLE_KEY**: 
  - Same as frontend value
  - Should match `VITE_STRIPE_PUBLISHABLE_KEY`

- **STRIPE_WEBHOOK_SECRET**: 
  - Go to: https://dashboard.stripe.com/webhooks
  - Create webhook endpoint: `https://your-backend-url.com/api/webhooks/stripe`
  - Copy the "Signing secret" (starts with `whsec_...`)

- **RESEND_API_KEY**: 
  - Go to: https://resend.com/api-keys
  - Create API key and copy it (starts with `re_...`)

---

## 📋 Quick Checklist

### Frontend (Vercel)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] `VITE_API_URL` (set after backend deployment)

### Backend (Railway/Render)
- [ ] `PORT` (auto-set by platform)
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Secret
- [ ] `STRIPE_SECRET_KEY` ⚠️ Secret
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` ⚠️ Secret
- [ ] `RESEND_API_KEY` ⚠️ Secret

---

## 🔐 Security Notes

⚠️ **Never commit these to Git:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

✅ **Safe to commit (public keys):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

## 🧪 Test vs Production Keys

### Development/Preview
- Use **test** Stripe keys: `pk_test_...` and `sk_test_...`
- Use **test** Supabase project (or your dev project)

### Production
- Use **live** Stripe keys: `pk_live_...` and `sk_live_...`
- Use **production** Supabase project
- Set `NODE_ENV=production`

---

## 📝 Notes

- All `VITE_*` variables are exposed to the browser (safe for public keys only)
- Backend variables are server-side only (can include secrets)
- Update `VITE_API_URL` after deploying backend
- Update `FRONTEND_URL` in backend after deploying frontend
- Redeploy both frontend and backend after changing environment variables

---

For detailed deployment instructions, see:
- **[HETZNER_DEPLOYMENT.md](./HETZNER_DEPLOYMENT.md)** - Backend deployment on Hetzner VPS
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Frontend deployment on Vercel


