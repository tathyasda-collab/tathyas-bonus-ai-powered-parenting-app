import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Bootstrap function that validates environment variables and renders the app.
 * Works with Vite's `import.meta.env` system (using VITE_ prefix).
 */
async function validateAndRender() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const API_KEY = import.meta.env.VITE_API_KEY;

  // Check if we’re in dev mode
  const isDev =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.MODE === 'development';

  // Check for missing or empty values
  const missingKeys = Object.entries({
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    API_KEY,
  })
    .filter(([_, value]) => !value || String(value).trim() === '')
    .map(([key]) => key);

  if (missingKeys.length > 0 && !isDev) {
    document.body.innerHTML = `
      <div style="font-family: sans-serif; padding: 2rem; margin: auto; max-width: 800px; background-color: #fff3f3; color: #333; min-height: 100vh;">
        <h1 style="color: #d9534f; border-bottom: 2px solid #eea29f; padding-bottom: 0.5rem;">Configuration Error</h1>
        <p style="font-size: 1.1rem;">The application cannot start because environment variables are missing:</p>
        <p><strong>${missingKeys.join(', ')}</strong></p>
        <h2 style="margin-top: 2rem;">Action Required:</h2>
        <ul style="line-height: 1.6; padding-left: 1.5rem;">
          <li>Ensure these variables are set in your <strong>Vercel → Project → Settings → Environment Variables</strong>.</li>
          <li>Then redeploy your app.</li>
        </ul>
      </div>
    `;
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  if (isDev) {
    console.warn('Development mode: skipping strict environment validation.');
  }

  console.log('✅ Environment variables loaded successfully:', {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    API_KEY,
  });

  // Render the React app
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Could not find root element to mount to');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Run the bootstrap
validateAndRender().catch((err) => {
  console.error('Failed to validate and render application:', err);
});
