# Deployment Guide - Better Than Interns

## Quick Deployment to Vercel + Supabase

This guide will help you deploy Better Than Interns to production using Vercel and Supabase.

---

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Supabase Account](https://supabase.com) (already configured)
- OpenAI API Key
- GitHub repository (for Vercel deployment)

---

## Step 1: Push to GitHub

If you haven't already:

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/better-than-interns.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Database on Supabase

Your Supabase project is already configured:
- **Project URL:** https://pjtulxnjmcobxdlqspst.supabase.co
- **Database:** PostgreSQL with connection pooling

### Run Database Migrations

Before deploying, initialize your Supabase database:

```bash
# Install dependencies
npm install

# Push database schema to Supabase
npm run db:push
```

This will create all the necessary tables in your Supabase database.

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New" → "Project"**

3. **Import your GitHub repository**
   - Select "better-than-interns" (or your repo name)
   - Click "Import"

4. **Configure Project**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. **Add Environment Variables**

   Click "Environment Variables" and add these:

   ```
   DATABASE_URL = postgresql://postgres.pjtulxnjmcobxdlqspst:iSY354%25%2FtH2beJy@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

   NEXTAUTH_URL = https://your-app-name.vercel.app

   NEXTAUTH_SECRET = jC9lCY4CAgurT70BzX7vrWGYlH1KYf1FR4Jn4J80kfA=

   OPENAI_API_KEY = sk-your-openai-key-here

   NEXT_PUBLIC_SUPABASE_URL = https://pjtulxnjmcobxdlqspst.supabase.co

   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = sb_publishable_tUE5x_0tUW-x06nF6DUzlw_3ViU87uR

   SUPABASE_SECRET_KEY = sb_secret__iXVm0AAa6CRo6xfZz9s2A_G7iI9AC9
   ```

   **Important:**
   - After deployment, update `NEXTAUTH_URL` with your actual Vercel URL
   - Make sure to URL-encode the password in DATABASE_URL (% becomes %25)

6. **Click "Deploy"**

   Vercel will:
   - Clone your repository
   - Install dependencies
   - Build the Next.js app
   - Deploy to production

7. **Update NEXTAUTH_URL**

   After first deployment:
   - Go to Project Settings → Environment Variables
   - Update `NEXTAUTH_URL` to your actual URL (e.g., `https://better-than-interns.vercel.app`)
   - Redeploy

---

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: better-than-interns
# - Directory: ./
# - Override settings? No

# Add environment variables via dashboard or CLI:
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SECRET_KEY

# Deploy to production
vercel --prod
```

---

## Step 4: Verify Deployment

1. **Visit your app:** `https://your-app-name.vercel.app`

2. **Test sign up:**
   - Create a new account
   - Verify you can log in

3. **Test process mapping:**
   - Create a project
   - Create a process
   - Chat with the assistant
   - Verify graph updates

---

## Step 5: Post-Deployment Configuration

### Update NextAuth URL

After your first deployment, update the `NEXTAUTH_URL` environment variable:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NEXTAUTH_URL`
3. Update to your production URL: `https://your-actual-domain.vercel.app`
4. Redeploy (Vercel → Deployments → Redeploy)

### Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` to use custom domain
4. Redeploy

---

## Environment Variables Reference

Here's what each environment variable does:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection | `postgresql://postgres.xxx:password@...` |
| `NEXTAUTH_URL` | Your app's public URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth encryption key | Generated via `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API access | `sk-proj-...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public key | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Supabase secret key | `sb_secret_...` |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Troubleshooting

### Database Connection Issues

**Problem:** "Unable to connect to database"

**Solutions:**
1. Verify `DATABASE_URL` is correct and uses the **session pooler** URL
2. Check password is URL-encoded (`%` → `%25`, `/` → `%2F`)
3. Ensure database schema is pushed: `npm run db:push`
4. Check Supabase project is not paused

### NextAuth Errors

**Problem:** "Invalid callback URL" or redirect issues

**Solutions:**
1. Ensure `NEXTAUTH_URL` matches your deployment URL exactly
2. No trailing slash in `NEXTAUTH_URL`
3. Use `https://` for production
4. Redeploy after changing `NEXTAUTH_URL`

### Build Failures

**Problem:** Build fails on Vercel

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure `package.json` has all dependencies
3. Run `npm run build` locally to test
4. Check for TypeScript errors: `npm run build`

### LLM Not Working

**Problem:** Chat doesn't respond

**Solutions:**
1. Verify `OPENAI_API_KEY` is set correctly
2. Check OpenAI account has credits
3. Look at Vercel Function logs for errors
4. Ensure API key has proper permissions

---

## Monitoring & Maintenance

### View Logs

1. **Vercel Dashboard** → Your Project → **Logs**
2. Filter by:
   - Build logs
   - Function logs
   - Static logs

### Monitor Usage

- **Vercel:** Dashboard shows bandwidth, function invocations
- **Supabase:** Dashboard shows database connections, storage
- **OpenAI:** Platform dashboard shows API usage and costs

### Update Application

```bash
# Make changes locally
git add .
git commit -m "feat: your changes"
git push

# Vercel auto-deploys from main branch
# Or manually trigger in Vercel dashboard
```

---

## Production Checklist

Before going live:

- [ ] Database schema pushed to Supabase
- [ ] All environment variables configured in Vercel
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] OpenAI API key has sufficient credits
- [ ] Test sign up/login flow
- [ ] Test process mapping with real data
- [ ] Custom domain configured (if applicable)
- [ ] Error monitoring set up (Sentry recommended)
- [ ] Analytics configured (PostHog recommended)

---

## Security Notes

1. **Never commit `.env` to git** (already in `.gitignore`)
2. **Rotate secrets regularly** (NextAuth secret, API keys)
3. **Use Vercel's Environment Variables** for all secrets
4. **Enable Supabase Row Level Security (RLS)** for additional protection
5. **Monitor for unusual API usage** (OpenAI costs)

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

Your Better Than Interns app is now deployed and ready for production use! 🚀
