# ISSB Portal Project Continuity Guide

## 🚀 Quick Resume Instructions

### To Continue This Project:
1. **Reference this guide** - It contains all essential information
2. **Check current status** - Review todo list and completed phases
3. **Review key documentation** - Located in `/workspace/issb-portal/docs/`
4. **Use existing admin credentials** - Provided below

## 📊 Current Status

### ✅ Completed
- **Phase 1A**: Foundational Security (RLS, rate limiting, security headers)
- **Phase 1**: Member Portal Foundation (Redux Toolkit, design tokens, RTK Query)
- **Admin Dashboard Analysis**: Technical architecture and patterns
- **Phase 2**: Admin User Management (DataTable, filtering, admin interface)

### 🔄 Active Issues
- **Registration Form**: "Failed to create account" error - no specific validation messages
- **Demo Ready**: Board presentation account created and working

### 📋 Next Steps (When Ready)
- **Phase 1B**: Wait for ISSB data (deferred until actual member data provided)
- **Phase 3**: API Security Hardening (JWT migration, schema validation)
- **Phase 4**: Authorization Governance & Monitoring
- **Phase 5**: Testing & Validation
- **Phase 6**: Deployment & Go-Live

## 🔑 Essential Credentials

### Admin Accounts
- **Demo Account** (for board): `qphrlclp@minimax.com` / `QNpokhXIny`
- **Personal Admin**: `topojqak@minimax.com` / `piMMZV62AT`

### Infrastructure
- **Supabase Project**: `ewbzpjpbmtnavfaogneq`
- **Live URL**: https://6op3uk8bqhzd.space.minimax.io
- **Admin Dashboard**: https://6op3uk8bqhzd.space.minimax.io/admin/users

## 📁 Key Files & Documentation

### Core Documentation
- **`/workspace/issb-portal/README_PHASE2.md`** (346 lines) - Complete Phase 2 setup guide
- **`/workspace/issb-portal/docs/ADMIN_ACCESS_SETUP.md`** (299 lines) - Admin account setup
- **`/workspace/issb-portal/docs/EDGE_FUNCTIONS_DEPLOYMENT.md`** (340 lines) - Edge Functions deployment
- **`/workspace/issb-portal/docs/PHASE2_MANUAL_TESTING_GUIDE.md`** (573 lines) - Comprehensive testing

### Technical Analysis
- **`/workspace/docs/admin_dashboard/`** - All technical analysis documents
- **`/workspace/admin_dashboard_enhancement_strategy.md`** (166 lines) - Implementation strategy

### Project Structure
```
/workspace/issb-portal/
├── src/
│   ├── pages/ (React components)
│   ├── store/ (Redux Toolkit)
│   ├── features/ (Feature modules)
│   ├── components/ (UI components)
│   └── lib/ (Supabase config)
├── supabase/
│   └── functions/ (Edge Functions)
├── docs/ (Documentation)
└── dist/ (Built application)
```

## 🎯 Current Priority: Registration Fix

### Issue Analysis
- **Problem**: Registration form shows "Failed to create account" with no error details
- **Impact**: Real users cannot sign up for the portal
- **Urgency**: HIGH - Critical for portal launch

### Next Action Items
1. **Fix registration error handling** - Add specific validation messages
2. **Test registration flow** - Ensure users can successfully register
3. **Verify membership logic** - Check volunteer hours and fee waiver system

## 🛠️ If You Need to Deploy/Restart

### Edge Functions (Already Deployed)
1. **create-admin**: https://ewbzpjpbmtnavfaogneq.supabase.co/functions/v1/create-admin
2. **admin-update-user-role**: https://ewbzpjpbmtnavfaogneq.supabase.co/functions/v1/admin-update-user-role

### Admin Account Creation (If Needed)
```bash
curl -X POST 'https://ewbzpjpbmtnavfaogneq.supabase.co/functions/v1/create-admin' \
  -H 'Content-Type: application/json' \
  -H 'apikey: [SUPABASE_SERVICE_ROLE_KEY]' \
  -H 'Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]' \
  -d '{"email":"[EMAIL]","verificationCode":"ISSB_ADMIN_2024"}'
```

## 📞 Technical Contact Points

### Supabase Dashboard
- **Project**: https://supabase.com/dashboard/project/ewbzpjpbmtnavfaogneq
- **Edge Functions**: Functions tab
- **Database**: SQL Editor tab

### Live Application
- **Frontend**: https://6op3uk8bqhzd.space.minimax.io
- **Admin**: https://6op3uk8bqhzd.space.minimax.io/admin/users

## 🎨 Design System

### Green Mosque Theme
- **Primary**: Green (#10B981, #059669)
- **Secondary**: Neutral grays
- **Components**: shadcn/ui with custom styling
- **Accessibility**: WCAG 2.1 AA compliant

## 🔧 Key Technologies

### Frontend
- **React** with TypeScript
- **Redux Toolkit** for state management
- **RTK Query** for API calls
- **TailwindCSS** for styling
- **shadcn/ui** for components

### Backend
- **Supabase** (Database, Auth, Storage)
- **Edge Functions** (Deno runtime)
- **PostgREST** for database API
- **RLS** for security

## 📈 Phase Roadmap

### Phase 1B (Deferred)
- Wait for actual ISSB member data
- Implement granular RLS policies
- Create role-based access controls

### Phase 3 (Next)
- JWT security hardening (HS256 → RS256/ES256)
- Schema validation in Edge Functions
- Layered rate limiting
- RFC 7807 error handling

### Phase 4-6 (Future)
- Authorization governance
- Testing & validation
- Production go-live

---

## 🆘 Quick Recovery Commands

If you need to quickly restore access:

1. **Create test admin account**:
   ```bash
   # Use supabase toolkit create_test_account tool
   ```

2. **Grant admin access**:
   ```bash
   # Use create-admin Edge Function with verification code ISSB_ADMIN_2024
   ```

3. **Check project status**:
   ```bash
   # Review todo list and current phase completion
   ```

---

**Last Updated**: 2025-11-01
**Project Phase**: 2 (Admin User Management - Complete)
**Status**: Ready for Registration Fix
---

## 💾 Session Memory Reference

### For AI Agent Continuity
**Project**: Islamic Society of Sarasota and Bradenton (ISSB) Portal  
**Current Phase**: 2 Complete - Admin User Management  
**Next Priority**: Registration form fix  
**Key Issue**: "Failed to create account" with no validation details  

### Supabase Configuration
- **Project ID**: ewbzpjpbmtnavfaogneq
- **URL**: https://ewbzpjpbmtnavfaogneq.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3YnpwanBibXRuYXZmYW9nbmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTk4ODEsImV4cCI6MjA3NzQ5NTg4MX0.vBhprmsd5pPVQyPSki81uB2aK-cdSQdde7Sd0SzlBdI
- **Service Role Key**: Available via get_all_secrets()

### Authentication Information
- **Verification Code**: ISSB_ADMIN_2024 (for create-admin function)
- **Edge Functions**: create-admin, admin-update-user-role (deployed and working)

### Board Demo Credentials
- **Email**: qphrlclp@minimax.com
- **Password**: QNpokhXIny
- **Admin Dashboard**: https://6op3uk8bqhzd.space.minimax.io/admin/users

### Development Credentials  
- **Email**: topojqak@minimax.com
- **Password**: piMMZV62AT
- **Admin Dashboard**: https://6op3uk8bqhzd.space.minimax.io/admin/users

### File References for AI Agent
- **Project Guide**: `/workspace/PROJECT_CONTINUITY_GUIDE.md`
- **Quick Start**: `/workspace/QUICK_START_CHECKLIST.md`
- **Phase 2 Docs**: `/workspace/issb-portal/README_PHASE2.md`
- **Admin Setup**: `/workspace/issb-portal/docs/ADMIN_ACCESS_SETUP.md`
- **Testing Guide**: `/workspace/issb-portal/docs/PHASE2_MANUAL_TESTING_GUIDE.md`

**When resuming this project, start by checking the current status and prioritizing the registration form fix before continuing to Phase 3.**