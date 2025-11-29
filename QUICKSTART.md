# Better Than Interns - Quick Start Guide

## 🚀 Get Running in 3 Steps

### 1. Add Your OpenAI API Key

```bash
# Open .env and add your key:
OPENAI_API_KEY="sk-your-actual-key-here"
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open Your Browser

Visit [http://localhost:3000](http://localhost:3000)

---

## ✅ What's Already Configured

- ✅ **Database:** Supabase PostgreSQL (schema already pushed)
- ✅ **Authentication:** NextAuth with secure secret
- ✅ **Deployment:** Ready for Vercel
- ⚠️ **OpenAI:** You need to add your API key

---

## 📝 First Time Setup

If you just cloned this repo:

```bash
# Option A: Automated setup
./scripts/setup-supabase.sh

# Option B: Manual setup
npm install
npm run db:push
npm run dev
```

---

## 🎯 Test the App

1. **Sign up** for an account
2. **Create a project** (e.g., "Invoice Processing")
3. **Create a process** (e.g., "Approve Purchase Orders")
4. **Chat with the assistant:**
   ```
   We receive invoices by email daily. The AP clerk downloads them
   and enters the data into Excel, which takes about 5 minutes per invoice.
   Then the manager reviews and approves them.
   ```
5. **Watch the graph build** in real-time!
6. **Click any step** to edit details

---

## 🌐 Deploy to Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.

**Quick version:**

1. Push to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

Database is already set up on Supabase ✅

---

## 📚 Documentation

- **README.md** - Full documentation
- **DEPLOYMENT.md** - Production deployment guide
- **SETUP.md** - Setup instructions for Milestone 1
- **dev-plan.md** - Development roadmap

---

## 🆘 Need Help?

### Database connection issues?
- Check `.env` has correct DATABASE_URL
- Verify Supabase project is not paused
- Run `npm run db:push` to sync schema

### LLM not responding?
- Add your OPENAI_API_KEY to `.env`
- Check you have API credits
- Restart dev server after adding key

### Build errors?
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📊 Current Status

**Milestone 0:** ✅ Complete
**Milestone 1:** ✅ Complete
**Milestone 2:** 🔜 Coming next

**Features working:**
- ✅ User authentication
- ✅ Project & process management
- ✅ AI-powered process mapping
- ✅ Real-time graph generation
- ✅ Manual step editing
- ✅ Chat with conversation history

---

**You're all set! Run `npm run dev` to get started.** 🎉
