# AI Help Assistant - Quick Deployment Guide

## Current Status
- **Frontend**: Deployed at https://ngclt8fbwfb0.space.minimax.io
- **Backend**: Code complete, awaiting deployment
- **Gemini API Key**: Configured (AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o)

## Backend Deployment Instructions

### Option 1: Via Supabase Dashboard (Recommended)

1. **Deploy Database Schema**
   - Go to https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/sql
   - Execute SQL file: `issb-portal/supabase/migrations/[timestamp]_ai_help_assistant_complete.sql`
   - This creates 4 tables, RLS policies, and seeds 15 KB articles

2. **Deploy Edge Functions**
   - Option A: Via Supabase CLI
     ```bash
     cd issb-portal
     supabase functions deploy chat-create-session
     supabase functions deploy chat-history
     supabase functions deploy chat-message
     supabase functions deploy chat-escalate
     supabase functions deploy knowledge-base-search
     supabase functions deploy admin-escalation-management
     ```
   
   - Option B: Via Dashboard
     - Go to Edge Functions section
     - Upload each function from `issb-portal/supabase/functions/`

3. **Set Environment Variables**
   ```bash
   supabase secrets set GOOGLE_GEMINI_API_KEY=AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o
   ```

### Option 2: Via Tools (Requires Auth)

Use the following tools with Supabase credentials:
- `batch_deploy_edge_functions` for function deployment
- `execute_sql` or `apply_migration` for database schema

## Testing After Deployment

### 1. Test Edge Functions
```bash
# Test chat session creation
curl -X POST https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/chat-create-session \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'

# Test AI message (requires session ID from above)
curl -X POST https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/chat-message \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "[SESSION_ID]", "message": "How do I volunteer?"}'
```

### 2. Test Frontend Integration
1. Navigate to https://ngclt8fbwfb0.space.minimax.io
2. Log in as a member
3. Look for floating chat widget (bottom right)
4. Click to open and test chat functionality
5. Try sending a message about volunteering
6. Verify AI response includes knowledge base context

### 3. Test Admin Interface
1. Log in as admin user
2. Navigate to `/admin/ai-assistant`
3. Test Knowledge Base Management:
   - View existing articles
   - Create new article
   - Edit existing article
   - Verify access level filtering
4. Test Escalation Management:
   - View escalation queue
   - Assign escalation
   - Resolve with notes
   - Verify resolution appears in user chat

## File Locations for Manual Deployment

### SQL Migration
```
issb-portal/supabase/migrations/[timestamp]_ai_help_assistant_complete.sql
```

### Edge Function Code
```
issb-portal/supabase/functions/
├── chat-create-session/index.ts
├── chat-history/index.ts
├── chat-message/index.ts
├── chat-escalate/index.ts
├── knowledge-base-search/index.ts
└── admin-escalation-management/index.ts
```

## Verification Checklist

- [ ] Database tables created (check via Supabase Table Editor)
- [ ] Knowledge base seeded (15 articles visible)
- [ ] All 6 edge functions deployed and running
- [ ] Gemini API key configured in secrets
- [ ] Frontend can access edge functions
- [ ] Chat widget appears for authenticated users
- [ ] AI responses working with Gemini
- [ ] Knowledge base provides context to AI
- [ ] Escalation workflow functional
- [ ] Admin interface accessible
- [ ] Mobile responsive design working

## Troubleshooting

### If AI responses fail:
- Check Gemini API key is set correctly
- Verify edge function logs for errors
- Check RLS policies allow anon role access

### If chat widget doesn't appear:
- Verify user is authenticated
- Check browser console for errors
- Ensure FloatingChatWidget is in Layout component

### If escalations don't work:
- Verify escalation_requests table exists
- Check RLS policies for escalations
- Test admin-escalation-management function

## Next Steps After Deployment

1. **Initial Testing**: Complete verification checklist above
2. **Admin Training**: Train admins on KB management and escalation handling
3. **User Rollout**: Announce new AI assistant feature to members
4. **Monitor Usage**: Track chat volume, escalation rate, user satisfaction
5. **Iterate**: Update KB articles based on common questions
6. **Optimize**: Fine-tune AI prompts based on response quality

## Support

For deployment assistance or issues:
- Check edge function logs in Supabase Dashboard
- Review browser console for frontend errors
- Verify all environment variables are set
- Test edge functions individually before integration testing
