# ISSB Membership App - Demo Setup Guide

**For Board Demo in 2 Days**

This guide will help you set up and run the ISSB Membership App for your board demonstration.

## 🚀 Quick Start (5 Minutes)

### Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **pnpm** - Install with: `npm install -g pnpm`
3. **Supabase Account** - [Sign up free](https://supabase.com)
4. **Google Gemini API Key** (for AI features) - [Get key](https://makersuite.google.com/app/apikey)

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ISSB-Membership-App

# Checkout the latest branch
git checkout claude/code-review-01SiNSRoA5upR5Pk9UwuqCVS

# Install frontend dependencies
cd issb-portal
pnpm install
```

### Step 2: Set Up Supabase

#### Option A: Use Existing Supabase Project
If you already have a Supabase project:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

#### Option B: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: ISSB Membership App
   - **Database Password**: (choose a strong password - save it!)
   - **Region**: Choose closest to your location
4. Wait 2-3 minutes for project to initialize
5. Go to **Settings** → **API** and copy URL and keys

### Step 3: Deploy Database & Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
cd /path/to/ISSB-Membership-App
supabase link --project-ref YOUR_PROJECT_REF

# Push database migrations
supabase db push

# Deploy all edge functions
supabase functions deploy
```

**Find your Project Ref:**
- Go to your Supabase project
- Settings → General → Reference ID

### Step 4: Configure Environment Variables

Create `.env` file in `issb-portal/`:

```bash
cd issb-portal
cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key-here

# Optional: Google Gemini API (for AI features)
VITE_GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
EOF
```

**⚠️ IMPORTANT:** Replace the placeholder values with your actual credentials!

### Step 5: Set Supabase Secrets (for Edge Functions)

```bash
# Set Google Gemini API key for AI features
supabase secrets set GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here

# Verify secrets are set
supabase secrets list
```

### Step 6: Start Development Server

```bash
cd issb-portal
pnpm run dev
```

Your app should now be running at: **http://localhost:5173**

---

## 👥 Creating Demo Users

You'll need test users for your board demo. Here's how to create them:

### Method 1: Via Supabase Dashboard (Easiest)

1. Go to your Supabase project
2. Navigate to **Authentication** → **Users**
3. Click "Add user" → "Create new user"
4. Create these accounts:

**Admin User:**
- Email: `admin@issb.org`
- Password: `Demo2024!` (or your choice)
- Auto Confirm User: ✅ Yes

**Board Member:**
- Email: `board@issb.org`
- Password: `Demo2024!`
- Auto Confirm User: ✅ Yes

**Regular Member:**
- Email: `member@issb.org`
- Password: `Demo2024!`
- Auto Confirm User: ✅ Yes

### Method 2: Via App Signup

1. Open http://localhost:5173/signup
2. Fill in the form
3. Check your email for verification (if email is configured)

### Step 2: Set User Roles

After creating users, you need to set their roles in the database:

```sql
-- Run this in Supabase SQL Editor (Tools → SQL Editor)

-- Set admin role
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@issb.org';

-- Set board role
UPDATE profiles
SET role = 'board'
WHERE email = 'board@issb.org';

-- Set member role (default)
UPDATE profiles
SET role = 'member'
WHERE email = 'member@issb.org';
```

### Step 3: Add Sample Membership Data (Optional)

```sql
-- Give users active membership status
-- Run in Supabase SQL Editor

-- Insert sample memberships
INSERT INTO memberships (user_id, status, start_date, end_date, original_amount, balance_due)
SELECT
  id,
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  360.00,
  0.00
FROM profiles
WHERE email IN ('admin@issb.org', 'board@issb.org', 'member@issb.org');
```

---

## 🎯 Demo Checklist - Features to Showcase

### ✅ Core Features (Must Demo)

1. **User Authentication**
   - Login/Logout
   - Different dashboards for different roles

2. **Member Dashboard** (`/dashboard`)
   - Membership status widget
   - Volunteer hours progress
   - **Personalized recommendations** (NEW!)
   - Recent volunteer activity

3. **AI-Powered Announcements** (`/admin/announcements` - Admin only)
   - Generate announcements with AI
   - Purple "Generate with AI" section
   - One-click professional content creation

4. **Modular Architecture Demo** (`/config-demo` - All logged-in users)
   - Feature flag toggling
   - Component swapping (Default vs Premium widgets)
   - Live configuration viewer
   - **This is your WOW factor!** 🎉

5. **Volunteer Management**
   - View opportunities
   - Sign up for opportunities
   - Track hours toward fee waiver

6. **Events System**
   - Browse upcoming events
   - Event registration
   - Admin event management

### 🌟 Advanced Features (If Time Permits)

7. **AI Chatbot Assistant** (floating widget)
   - Ask questions about ISSB
   - Get instant answers
   - Knowledge base search

8. **Gamification System**
   - Badges and achievements
   - Contest participation
   - Member leaderboard

9. **Analytics Dashboard** (Admin only)
   - Membership metrics
   - Volunteer hour tracking
   - Financial overview

---

## 🎬 Demo Script (15-Minute Presentation)

### Opening (2 min)
"Today I'm excited to show you our new ISSB Membership Management Platform, built with cutting-edge technology to serve our community better."

### Part 1: Member Experience (5 min)

1. **Login as Member** (`member@issb.org`)
   ```
   Show: Clean, professional dashboard
   Highlight: Membership status, volunteer progress
   **NEW**: Personalized recommendations section
   ```

2. **Volunteer Portal**
   ```
   Show: Available opportunities
   Demo: Sign up for an opportunity
   Highlight: Fee waiver progress tracking
   ```

3. **Events**
   ```
   Show: Upcoming events calendar
   Demo: Register for an event
   ```

### Part 2: Admin Capabilities (5 min)

4. **Login as Admin** (`admin@issb.org`)
   ```
   Show: Enhanced admin dashboard
   Different interface based on role
   ```

5. **AI-Powered Announcements** ⭐
   ```
   Navigate to: /admin/announcements
   Demo:
   - Click "Generate with AI"
   - Enter: "Ramadan Iftar dinner on Friday at 7pm, bring your family"
   - Click "Generate Draft"
   - Show: Professional announcement generated instantly
   - Publish it
   ```

6. **User Management**
   ```
   Show: Member list
   Demo: Role assignment
   Highlight: Permission system
   ```

### Part 3: The Game Changer (3 min) 🚀

7. **Modular Architecture Demo** ⭐⭐⭐
   ```
   Navigate to: /config-demo

   Explain: "This is our secret weapon - a fully modular,
   configurable frontend that allows us to:"

   Demo:
   - Toggle feature flags in real-time
   - Show component swapping (Default → Premium widget)
   - Open debug panel
   - Explain: Different users see different experiences

   Impact:
   "We can personalize the experience for:
   - Regular members vs premium members
   - Different organizations if we expand
   - Sponsor branding
   - A/B testing new features
   - All without redeploying the app!"
   ```

### Closing (2 min)
"This platform positions ISSB at the forefront of community management technology. We can scale, customize, and evolve without limitations."

---

## 🔧 Troubleshooting Common Issues

### Issue: "Failed to fetch configuration"

**Solution:**
```bash
# Verify edge function is deployed
supabase functions list

# If not deployed:
supabase functions deploy get-user-config
```

### Issue: "Unauthorized" when loading app

**Solution:**
1. Check `.env` file has correct Supabase credentials
2. Verify user is created in Supabase Auth
3. Check profile exists in `profiles` table

### Issue: AI features not working

**Solution:**
```bash
# Verify Gemini API key is set
supabase secrets list

# If missing:
supabase secrets set GOOGLE_GEMINI_API_KEY=your-key-here

# Redeploy AI functions
supabase functions deploy generate-announcement-ai
```

### Issue: Component swapping not working

**Solution:**
1. Check browser console for errors
2. Verify `get-user-config` function is deployed
3. Check that user has a profile with membership status
4. Look at Network tab - is `/functions/v1/get-user-config` returning 200?

### Issue: Recommendations not showing

**Solution:**
```bash
# Deploy recommendations function
supabase functions deploy get-recommendations

# Verify user has membership data
# Run in Supabase SQL Editor:
SELECT * FROM membership_status_view WHERE user_id = 'USER_ID_HERE';
```

---

## 🌐 Deploying for Live Demo (Optional)

If you want to demo on a live URL instead of localhost:

### Option 1: Deploy to Vercel (Recommended - 10 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd issb-portal
vercel

# Follow prompts:
# - Link to new project: Yes
# - Project name: issb-membership-app
# - Framework: Vite
# - Build command: pnpm run build
# - Output directory: dist

# Set environment variables in Vercel dashboard
# or via CLI:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy production
vercel --prod
```

You'll get a URL like: `https://issb-membership-app.vercel.app`

### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd issb-portal
netlify deploy

# Follow prompts
# Build command: pnpm run build
# Publish directory: dist

# Set environment variables in Netlify dashboard
# Deploy to production
netlify deploy --prod
```

---

## 📊 Pre-Demo Testing Checklist

24 Hours before demo, test these critical paths:

- [ ] Login works for all three test accounts
- [ ] Admin can access `/admin` routes
- [ ] Member sees personalized recommendations
- [ ] AI announcement generation works
- [ ] `/config-demo` loads and feature flags toggle
- [ ] Component swapping visible (login as active member)
- [ ] No console errors in browser DevTools
- [ ] Mobile view looks good (test on phone)
- [ ] All images/logos load properly
- [ ] Floating AI chat widget appears

**Pro Tip:** Record a backup video of the demo in case of technical difficulties!

---

## 🎨 Customization for Your Demo

### Update Branding

Edit `supabase/functions/get-user-config/index.ts`:

```typescript
config.brandingAssets = {
  logoUrl: '/images/your-logo.png',  // Update this
  primaryColor: '#16a34a',           // Your brand color
};
```

### Add Sample Data

```sql
-- Add volunteer opportunities
INSERT INTO volunteer_opportunities (title, description, hours_required, status)
VALUES
  ('Ramadan Food Drive', 'Help distribute food to families in need', 4, 'active'),
  ('Mosque Cleanup', 'Weekly mosque maintenance and cleaning', 2, 'active'),
  ('Youth Mentorship', 'Mentor high school students', 3, 'active');

-- Add events
INSERT INTO events (title, description, date, location, capacity, status)
VALUES
  ('Friday Iftar Dinner', 'Community iftar during Ramadan', CURRENT_DATE + 7, 'ISSB Main Hall', 200, 'published'),
  ('Islamic Finance Workshop', 'Learn about halal investing', CURRENT_DATE + 14, 'Community Center', 50, 'published');
```

---

## 📞 Support & Resources

**Documentation:**
- Main README: `/README.md`
- Project Summary: `/PROJECT_SUMMARY.md`

**Tech Stack:**
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Supabase (PostgreSQL + Edge Functions)
- State: Redux Toolkit + Zustand
- AI: Google Gemini 2.0

**Emergency Contacts:**
- If demo breaks: Check browser console, Network tab, and Supabase logs
- Supabase Logs: Project Dashboard → Logs → Edge Functions

---

## 🎉 You're Ready!

Follow this guide and you'll have a fully functional demo ready for your board meeting.

**Key Talking Points:**
1. Modern, professional interface
2. AI-powered content generation
3. Personalized user experiences
4. Modular architecture for future scaling
5. Complete volunteer & membership management
6. Built on enterprise-grade technology

**Good luck with your demo!** 🚀

---

**Last Updated:** 2025-11-25
**Version:** 1.0
**Branch:** claude/code-review-01SiNSRoA5upR5Pk9UwuqCVS
