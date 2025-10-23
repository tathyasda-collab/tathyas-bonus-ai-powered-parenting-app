This project is a small React + Vite single-page app that integrates with Supabase for
auth and persistence and calls Google/Gemini for AI features.

Quick orientation (what to know first)
- Entry points: `index.tsx` bootstraps the app and validates `env.js` / `env.local.js`.
- App root: `App.tsx` composes `ThemeProvider` and `AuthProvider` and chooses the page
  flow (Login, Setup, UserDashboard, AdminDashboard).
- Auth & sync: `context/AuthContext.tsx` uses `services/api.ts` and `services/supabaseClient.ts`.

Key architecture & patterns
- Services layer: `services/api.ts` exposes an `api` object of async functions (login, logout,
  savePlannerRun, getPlannerHistory, etc.). Use these for all backend interactions.
- Supabase client: `services/supabaseClient.ts` lazily initializes the Supabase client via
  `getSupabase()` and reads config from `APP_CONFIG.env` (from `env.js`). Guard against
  missing `SUPABASE_URL`/`SUPABASE_ANON_KEY`.
- Error surface: use the `ApiError` class (in `services/api.ts`) for user-facing messages.
  When wrapping lower-level errors, include the original error as `originalError`.
- Auth flow: `api.onAuthStateChange` sets up a Supabase listener. It will create a user row
  in `app_users` when missing. Many UI flows rely on this (e.g. `needsSetup`).
- Admin behavior: if `user.role === 'admin'` the app renders `AdminDashboard` unconditionally.

- Environment & build
- Local overrides: During local development you can keep using `env.js` / `env.local.js` for quick overrides. For production builds the project uses Vite environment variables (prefixed with `VITE_`).
- Important environment vars (Vite build-time):
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_API_KEY
- Commands:
  - npm install
  - npm run dev        (start Vite dev server)
  - npm run build      (vite build && node ./scripts/generate-env.cjs ./dist)
  - npm run preview

Repository-specific gotchas & conventions
- env validation: `index.tsx` will refuse to render if `APP_CONFIG.env` is missing or has
  placeholder values (production). In development a bypass exists via import of `env.local.js`.
- Database & RLS: many `api` calls assume tables like `app_users`, `user_profiles`, `children`,
  `planner_runs`, `mealplan_runs`, `emotion_logs`. Missing RLS policies or wrong permissions
  cause errors — logs include an RLS hint string for diagnosis.
- Use `api` functions instead of directly calling Supabase from components. This centralizes
  error handling and ensures `ApiError` is used consistently.
- When adding a new backend call, update `services/api.ts` and prefer `.select().single()` or
  explicit error handling consistent with existing functions.

Where to make common changes
- New UI pages/components: `components/*` (auth, dashboard, shared, tools).
- New server data shape / types: `types.ts` and update `services/api.ts` accordingly.
- Auth-related state changes: `context/AuthContext.tsx` and `hooks/useAuth.ts` (hook wraps context).

Examples (copyable reference)
- Call the planner save flow from a component:
  - import { api } from '../services/api';
  - await api.savePlannerRun({ user_id, prompt, result, tool_version });
- Ensure env keys are available during build: the `build` script runs
  `node ./scripts/generate-env.cjs ./dist` so environment values must be present at build time.

Debugging tips for agents
- If the app shows the "Configuration Error" page, check `env.js` / `env.local.js` and
  `APP_CONFIG.env` values. Index displays which keys are missing.
- For auth issues, inspect Supabase table `app_users` and Row Level Security (RLS).
- Look for logged messages containing "RLS_HINT" or `[API Error]` to find root causes.

If anything in these notes is unclear or you need examples for specific tasks (new endpoint,
UI page, or deployment), tell me what you want to implement and I'll extend the instructions.
