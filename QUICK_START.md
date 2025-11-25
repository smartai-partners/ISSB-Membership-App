# ISSB Membership App - Quick Start (2 Minutes)

## For Immediate Testing (Local Development)

### 1. Install Dependencies
```bash
cd issb-portal
pnpm install
```

### 2. Set Up Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env and add your Supabase credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### 3. Start Development Server
```bash
pnpm run dev
```

**App will be available at:** http://localhost:5173

---

## For Board Demo (Production-Like)

See **DEMO_SETUP_GUIDE.md** for complete instructions including:
- Database setup
- Edge function deployment
- Creating demo users
- Full demo script

---

## Quick Test

1. Open http://localhost:5173
2. Click "Sign Up" and create an account
3. Login with your account
4. Explore the dashboard

**To test AI features:**
- You need a Google Gemini API key
- Set it in Supabase secrets: `supabase secrets set GOOGLE_GEMINI_API_KEY=your-key`

**To test modular architecture:**
- Login and visit: http://localhost:5173/config-demo
- Toggle feature flags and see changes in real-time!

---

## Need Help?

📖 **Full Setup Guide:** See `DEMO_SETUP_GUIDE.md`
🐛 **Issues?** Check browser console (F12) and Network tab
📊 **Project Status:** See `PROJECT_SUMMARY.md`

**Latest Features:**
- ✅ AI-Powered Announcement Generation
- ✅ Personalized Recommendations System
- ✅ Modular Frontend Architecture with Feature Flags
- ✅ Dynamic Component Swapping
