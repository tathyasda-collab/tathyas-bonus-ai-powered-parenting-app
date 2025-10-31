#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys all secure Gemini API edge functions

set -e

echo "🚀 Deploying Supabase Edge Functions"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    print_error "Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

print_status "Supabase CLI found and authenticated"

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    print_error "Project not linked to Supabase. Please run:"
    echo "supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

print_status "Project linked to Supabase"

# Prompt for Gemini API key if not set
echo "🔑 Setting up Gemini API key..."
read -p "Enter your Gemini API key (or press Enter if already set): " -r
if [[ $REPLY ]]; then
    supabase secrets set GEMINI_API_KEY="$REPLY"
    print_status "Gemini API key updated"
else
    print_warning "Skipping API key setup (assuming already configured)"
fi

# Deploy all functions
echo "📦 Deploying edge functions..."

echo "Deploying generate-parenting-plan..."
supabase functions deploy generate-parenting-plan
print_status "generate-parenting-plan deployed"

echo "Deploying generate-meal-plan..."
supabase functions deploy generate-meal-plan
print_status "generate-meal-plan deployed"

echo "Deploying generate-single-recipe..."
supabase functions deploy generate-single-recipe
print_status "generate-single-recipe deployed"

echo "Deploying get-emotion-support..."
supabase functions deploy get-emotion-support
print_status "get-emotion-support deployed"

# List deployed functions
echo "📋 Verifying deployment..."
supabase functions list

echo ""
echo "🎉 Edge Functions Deployment Complete!"
echo "======================================"
echo ""
echo "✅ All Gemini API calls are now secure and server-side"
echo "✅ API key is protected and not exposed to frontend"
echo "✅ Functions are ready for production use"
echo ""
echo "📝 Next Steps:"
echo "1. Update your frontend environment variables"
echo "2. Remove VITE_GEMINI_API_KEY from all .env files"
echo "3. Test the application functionality"
echo "4. Deploy the frontend to AWS"
echo ""
echo "🔗 Function URLs:"
PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d'"' -f2)
echo "• Parenting Plan: https://$PROJECT_REF.supabase.co/functions/v1/generate-parenting-plan"
echo "• Meal Plan: https://$PROJECT_REF.supabase.co/functions/v1/generate-meal-plan"
echo "• Single Recipe: https://$PROJECT_REF.supabase.co/functions/v1/generate-single-recipe"
echo "• Emotion Support: https://$PROJECT_REF.supabase.co/functions/v1/get-emotion-support"