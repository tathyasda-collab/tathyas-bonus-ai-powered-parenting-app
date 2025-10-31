#!/bin/bash

# Security Verification Script
# Checks that Gemini API key is not exposed in the frontend build

set -e

echo "🔒 Security Verification Test"
echo "============================="

# Colors
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

echo "📦 Building application..."
npm run build:prod

if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Application built successfully"

echo ""
echo "🔍 Scanning build files for API key exposure..."

# Check if any Gemini API key patterns exist in build files
GEMINI_PATTERNS=("VITE_GEMINI_API_KEY" "gemini.*api.*key" "AIza[0-9A-Za-z\\-_]{35}" "@google/genai")

FOUND_ISSUES=0

for pattern in "${GEMINI_PATTERNS[@]}"; do
    echo "Checking for pattern: $pattern"
    if grep -r -i "$pattern" dist/ 2>/dev/null; then
        print_error "Found potential API key exposure: $pattern"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    else
        print_status "Pattern '$pattern' not found in build files"
    fi
done

echo ""
echo "🔍 Checking environment variable references..."

# Check for any references to removed environment variables
ENV_PATTERNS=("VITE_GEMINI_API_KEY" "import.meta.env.VITE_GEMINI_API_KEY")

for pattern in "${ENV_PATTERNS[@]}"; do
    echo "Checking for env pattern: $pattern"
    if grep -r "$pattern" dist/ 2>/dev/null; then
        print_error "Found environment variable reference: $pattern"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    else
        print_status "Environment pattern '$pattern' not found"
    fi
done

echo ""
echo "🔍 Verifying Edge Function integration..."

# Check that edge function calls are present
EDGE_FUNCTION_PATTERNS=("/functions/v1/generate-parenting-plan" "/functions/v1/generate-meal-plan" "/functions/v1/get-emotion-support")

FOUND_FUNCTIONS=0

for pattern in "${EDGE_FUNCTION_PATTERNS[@]}"; do
    echo "Checking for edge function: $pattern"
    if grep -r "$pattern" dist/ 2>/dev/null; then
        print_status "Found edge function call: $pattern"
        FOUND_FUNCTIONS=$((FOUND_FUNCTIONS + 1))
    else
        print_warning "Edge function call not found: $pattern"
    fi
done

echo ""
echo "📊 Security Verification Results:"
echo "================================="

if [ $FOUND_ISSUES -eq 0 ]; then
    print_status "No API key exposure detected in build files"
else
    print_error "Found $FOUND_ISSUES potential security issues"
fi

if [ $FOUND_FUNCTIONS -gt 0 ]; then
    print_status "Found $FOUND_FUNCTIONS edge function integrations"
else
    print_warning "No edge function calls detected - verify integration"
fi

echo ""
if [ $FOUND_ISSUES -eq 0 ] && [ $FOUND_FUNCTIONS -gt 0 ]; then
    echo "🎉 Security Verification PASSED!"
    echo "✅ API keys are properly secured"
    echo "✅ Edge functions are integrated"
    echo "✅ Safe to deploy to production"
else
    echo "⚠️  Security Verification requires attention"
    if [ $FOUND_ISSUES -gt 0 ]; then
        echo "❌ API key exposure detected"
    fi
    if [ $FOUND_FUNCTIONS -eq 0 ]; then
        echo "❌ Edge function integration missing"
    fi
    echo "🔧 Please review and fix issues before deployment"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Deploy Supabase Edge Functions: cd supabase && bash deploy-functions.sh"
echo "2. Test edge functions manually with curl"
echo "3. Deploy frontend to AWS: bash deployment/setup-aws.sh"
echo "4. Verify all AI features work correctly"