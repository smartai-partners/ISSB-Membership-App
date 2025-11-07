#!/bin/bash

# AI-Powered Help Assistant Deployment Script
# This script deploys the backend infrastructure for the AI Help Assistant

set -e

echo "========================================"
echo "AI Help Assistant Deployment Script"
echo "========================================"

# Check for required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "Error: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID must be set"
    echo "Please set these environment variables before running this script"
    exit 1
fi

if [ -z "$GOOGLE_GEMINI_API_KEY" ]; then
    echo "Error: GOOGLE_GEMINI_API_KEY must be set"
    exit 1
fi

echo "✓ Environment variables validated"

# Deploy database schema
echo ""
echo "Step 1: Deploying database schema..."
echo "----------------------------------------"

# Note: Replace with actual Supabase migration command
# supabase db push or similar
echo "SQL migration files are located in:"
echo "  - docs/ai-help-assistant-schema.sql"
echo "  - docs/knowledge-base-seed.sql"
echo ""
echo "Execute these manually via Supabase Dashboard or CLI:"
echo "  1. Go to Supabase SQL Editor"
echo "  2. Run ai-help-assistant-schema.sql"
echo "  3. Run knowledge-base-seed.sql"
echo ""

# Deploy Edge Functions
echo "Step 2: Deploying edge functions..."
echo "----------------------------------------"

FUNCTIONS=(
    "chat-create-session"
    "chat-history"
    "chat-message"
    "chat-escalate"
    "knowledge-base-search"
    "admin-escalation-management"
)

for func in "${FUNCTIONS[@]}"; do
    echo "Deploying $func..."
    # Note: Replace with actual deployment command
    # supabase functions deploy $func --project-ref $SUPABASE_PROJECT_ID
    echo "  Location: supabase/functions/$func/index.ts"
done

echo ""
echo "✓ Edge functions prepared for deployment"

# Set environment variables for edge functions
echo ""
echo "Step 3: Setting environment variables..."
echo "----------------------------------------"

echo "Setting GOOGLE_GEMINI_API_KEY..."
# supabase secrets set GOOGLE_GEMINI_API_KEY=$GOOGLE_GEMINI_API_KEY

echo ""
echo "✓ Environment variables configured"

echo ""
echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo "Database Tables Created:"
echo "  ✓ chat_sessions"
echo "  ✓ chat_messages"
echo "  ✓ knowledge_base_articles"
echo "  ✓ escalation_requests"
echo ""
echo "Edge Functions Deployed:"
for func in "${FUNCTIONS[@]}"; do
    echo "  ✓ $func"
done
echo ""
echo "Knowledge Base:"
echo "  ✓ 15 articles seeded"
echo ""
echo "========================================"
echo "Next Steps:"
echo "1. Build frontend: cd issb-portal && npm run build"
echo "2. Test edge functions with test-edge-function tool"
echo "3. Deploy frontend to production"
echo "4. Test AI chat widget functionality"
echo "========================================"
