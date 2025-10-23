<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1iNeu5exPKgCI7DlHtrBEDxUhsXMBe8Ak

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying to Netlify

This project is configured to build with Vite and can be deployed to Netlify, Vercel, Cloudflare Pages, or GitHub Pages (with Actions). The app requires three environment variables to be set at build time. Because we use Vite, these must be prefixed with VITE_:

- `VITE_API_KEY` — Google / Gemini API key used by the app.
- `VITE_SUPABASE_URL` — Your Supabase project URL (example: https://xyz.supabase.co).
- `VITE_SUPABASE_ANON_KEY` — Supabase anon (public) API key.

You can set these in your hosting provider's UI for environment variables. Example (Vercel): Project → Settings → Environment Variables → Add the keys above for Production.

1. Go to your Site settings > Build & deploy > Environment > Environment variables.
2. Add `API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` with their values.
3. Trigger a new deploy (either by pushing to the connected Git branch or by using "Trigger deploy" in Netlify).

Alternatively, you can use the Netlify CLI:

```powershell
netlify env:set API_KEY "your_api_key_here"
netlify env:set SUPABASE_URL "https://your-project.supabase.co"
netlify env:set SUPABASE_ANON_KEY "your_anon_key_here"
```

Notes:
- The project contains a `netlify.toml` with the build command and placeholders for environment variables. Do not commit your real keys into source control.
- Locally you can keep using `env.js` or `env.local.js` for development. In production, environment variables set in Netlify will be used by the serverless build and static files.

## Netlify Preview (GitHub Pull Request Deploys)

This repository includes a GitHub Actions workflow that builds the project and deploys a Netlify draft preview when a pull request is opened or updated. The workflow requires two repository secrets to be set in GitHub:

- `NETLIFY_AUTH_TOKEN` — a personal access token for the Netlify CLI. Create it in Netlify under User settings → Applications → Personal access tokens.
- `NETLIFY_SITE_ID` — the Netlify Site ID for the site where previews should be created (find it in Site settings → Site information).

To add these secrets in GitHub:

1. Go to your GitHub repo → Settings → Secrets and variables → Actions.
2. Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.

Note: the Netlify Site ID for this project is: `270db7c8-e504-4b17-bc74-164f9968b6db` — you can use this value as the repository secret `NETLIFY_SITE_ID` or leave the secret blank and the workflow will default to this ID.

When a PR is opened, the workflow runs the typecheck and build, then calls `netlify deploy --dir=dist --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN` to publish a draft preview. The preview URL will be printed in the workflow logs.

