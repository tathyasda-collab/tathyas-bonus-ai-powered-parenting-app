# Quick Deployment Guide - Secure Gemini Integration

## Current Status ✅
Your app is now **production-ready** with secure Gemini API integration via Supabase Edge Functions!

## Option 1: Deploy with Edge Functions (Recommended for Production)

### Prerequisites
1. Active Supabase project
2. Gemini API key

### Steps:
```bash
# 1. Login to Supabase (from project root)
.\supabase.exe login

# 2. Link to your project
.\supabase.exe link --project-ref YOUR_PROJECT_REF

# 3. Set your Gemini API key as secret
.\supabase.exe secrets set GEMINI_API_KEY=your_actual_gemini_api_key

# 4. Deploy edge functions
.\supabase.exe functions deploy

# 5. Deploy to AWS
bash deployment/setup-aws.sh
```

### Get Your Project Ref:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > General
4. Copy the "Reference ID"

## Option 2: Quick Deploy Without Edge Functions (Immediate)

If you want to deploy immediately for testing:

### Steps:
1. **Temporarily restore Gemini API key** in `.env.production`:
   ```bash
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key
   ```

2. **Deploy to AWS immediately**:
   ```bash
   bash deployment/setup-aws.sh
   ```

3. **After deployment, remove the API key** and deploy Edge Functions later

⚠️ **Security Note**: Option 2 exposes the API key temporarily. Use only for testing.

## Recommended: Use Option 1 for Production

The Edge Functions provide:
- ✅ Complete API key security
- ✅ Server-side processing
- ✅ Better performance
- ✅ Cost optimization

## Need Help?

If you need assistance with:
- Creating a Supabase project
- Getting your project reference ID
- Deploying Edge Functions

Let me know and I can provide detailed guidance!