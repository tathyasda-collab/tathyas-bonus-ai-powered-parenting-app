# Environment Variables Reference

This file documents all the environment variables required for the AI-Powered Parenting App deployment.

## Required Environment Variables

### For Vercel Deployment

Set these in your Vercel project dashboard under Settings → Environment Variables:

| Variable Name | Description | Example Value | Where to Get It |
|---------------|-------------|---------------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abcdefghijklmnop.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Dashboard → Settings → API |
| `VITE_GEMINI_API_KEY` | Google AI (Gemini) API key | `AIzaSyB...` | Google AI Studio → API Keys |

## Local Development

For local development, these should be in your `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

## How to Get Each Variable

### 1. Supabase Variables

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - **Project URL** → use as `VITE_SUPABASE_URL`
   - **anon public** key → use as `VITE_SUPABASE_ANON_KEY`

### 2. Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key → use as `VITE_GEMINI_API_KEY`

## Security Notes

- ⚠️ **Never commit these values to Git**
- ✅ The `.env.local` file is already in `.gitignore`
- ✅ Use environment variables in production (Vercel)
- ✅ These are client-side variables (VITE_ prefix) - they're safe to expose to the browser
- ✅ Supabase anon key is designed to be public (with Row Level Security)

## Vercel Configuration

In your `vercel.json`, these variables are referenced as:

```json
{
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key", 
    "VITE_GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

But in the Vercel dashboard, set them with their actual values, not the @ references.

## Troubleshooting

### If Variables Aren't Working:

1. **Check the variable names** - they must match exactly (case-sensitive)
2. **Verify in Vercel dashboard** - go to Settings → Environment Variables
3. **Redeploy after adding variables** - changes require a new deployment
4. **Test locally first** - ensure `.env.local` works before deploying

### Common Errors:

- `Supabase client not initialized` → Check SUPABASE_URL and SUPABASE_ANON_KEY
- `Gemini API error` → Check GEMINI_API_KEY and API quota
- `Variables undefined` → Check VITE_ prefix and exact variable names

## Testing Variables

You can test if your environment variables are working by checking the browser console:

```javascript
// In browser dev tools console:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Gemini key:', !!import.meta.env.VITE_GEMINI_API_KEY);
```

Never log the actual API keys in production!