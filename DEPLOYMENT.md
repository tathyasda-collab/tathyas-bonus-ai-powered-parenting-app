# Deployment Guide: AI-Powered Parenting App

This guide will help you deploy your AI-powered parenting app with the backend on GitHub and the frontend on Vercel.

## Prerequisites

- GitHub account
- Vercel account (can sign up with GitHub)
- Supabase project set up and running
- Google AI (Gemini) API key

## Part 1: Deploy Backend to GitHub

### Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to [GitHub](https://github.com) and click "New repository"
   - Name it: `ai-powered-parenting-app`
   - Make it **public** or **private** (your choice)
   - Do NOT initialize with README (we already have one)
   - Click "Create repository"

2. **Connect your local repository to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ai-powered-parenting-app.git
   git branch -M main
   git push -u origin main
   ```
   
   Replace `YOUR_USERNAME` with your actual GitHub username.

3. **Verify the upload:**
   - Refresh your GitHub repository page
   - You should see all your project files

## Part 2: Deploy Frontend to Vercel

### Step 1: Connect GitHub to Vercel

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign up" and choose "Continue with GitHub"
   - Authorize Vercel to access your repositories

2. **Import your project:**
   - Click "New Project"
   - Find your `ai-powered-parenting-app` repository
   - Click "Import"

### Step 2: Configure Environment Variables

Before deploying, you need to set up environment variables in Vercel:

1. **In the Vercel import screen:**
   - Expand "Environment Variables" section
   - Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL | Production |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
   | `VITE_GEMINI_API_KEY` | Your Google AI API key | Production |

2. **Get your Supabase credentials:**
   - Go to your [Supabase dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings → API
   - Copy the "Project URL" and "anon public" key

3. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create or copy your API key

### Step 3: Deploy

1. **Click "Deploy"** in Vercel
2. **Wait for deployment** (usually 2-3 minutes)
3. **Get your deployment URL** (e.g., `https://ai-powered-parenting-app.vercel.app`)

## Part 3: Verification

### Test Your Deployment

1. **Visit your Vercel URL**
2. **Test key functionality:**
   - User registration/login
   - Profile setup
   - Recipe generation
   - Admin dashboard (if applicable)

### Common Issues and Solutions

1. **Environment Variables Not Working:**
   - Ensure all environment variables are set correctly in Vercel
   - Redeploy after adding environment variables

2. **Build Errors:**
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are in package.json

3. **Supabase Connection Issues:**
   - Verify your Supabase URL and API key
   - Check Supabase dashboard for any issues

## Part 4: Post-Deployment Setup

### Custom Domain (Optional)

1. **In Vercel dashboard:**
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain

### Monitoring

1. **Vercel Analytics:**
   - Enable analytics in your Vercel dashboard
   - Monitor performance and usage

2. **Supabase Monitoring:**
   - Monitor database usage in Supabase dashboard
   - Set up alerts if needed

## Part 5: Updates and Maintenance

### Making Updates

1. **Make changes locally**
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. **Vercel will automatically redeploy** when you push to main

### Environment Variables Updates

- Update environment variables in Vercel dashboard
- Redeploy if necessary

## Support

If you encounter issues:

1. Check Vercel build logs for errors
2. Verify all environment variables are set
3. Test locally with `npm run build` and `npm run preview`
4. Check Supabase dashboard for database issues

## Summary

✅ **Backend**: Your code is safely stored and version-controlled on GitHub  
✅ **Frontend**: Your app is deployed and accessible via Vercel  
✅ **Database**: Supabase provides your backend services  
✅ **AI**: Google Gemini powers your recipe generation  

Your AI-powered parenting app is now live and ready for users! 🚀

---

**Deployment URLs:**
- GitHub Repository: `https://github.com/YOUR_USERNAME/ai-powered-parenting-app`
- Live Application: `https://ai-powered-parenting-app.vercel.app` (or your custom domain)