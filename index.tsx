import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { APP_CONFIG as DEFAULT_APP_CONFIG } from './env.js';

/**
 * Validates that the necessary environment variables are configured.
 * If they are not, it displays a user-friendly error message instead of a blank screen.
 * If validation passes, it renders the React application.
 */
async function validateAndRender() {
    // Allow a local override file (env.local.js) to exist for development only.
    // env.local.js should export `APP_CONFIG`.
    // We use import.meta.glob to avoid bundler errors when the optional file is missing.
    let appConfig = DEFAULT_APP_CONFIG as any;
    try {
        const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'development';
        // Also allow a runtime bypass flag for local debugging (not for production)
        const runtimeBypass = (window as any).__DEV_BYPASS_ENV === true;
        if (isDev || runtimeBypass) {
            const modules = import.meta.glob('./env.local.js');
            if (modules['./env.local.js']) {
                const local = await modules['./env.local.js']();
                const anyLocal = local as any;
                if (anyLocal && anyLocal.APP_CONFIG) {
                    console.warn('Loaded local env override from env.local.js');
                    appConfig = anyLocal.APP_CONFIG;
                }
            }
        }
    } catch (e) {
        // Ignore if the optional local file doesn't exist or fails to load.
    }

    const env = appConfig?.env;

    const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'development') || (window as any).__DEV_BYPASS_ENV === true;

    if (!env) {
        document.body.innerHTML = `
            <div style="font-family: sans-serif; padding: 2rem; margin: auto; max-width: 800px; background-color: #fff3f3; color: #333; min-height: 100vh;">
                <h1 style="color: #d9534f; border-bottom: 2px solid #eea29f; padding-bottom: 0.5rem;">Configuration Error</h1>
                <p style="font-size: 1.1rem;">The application cannot start because the configuration file (env.js) is missing, empty, or failed to load.</p>
                <h2 style="color: #333; margin-top: 2rem;">Action Required:</h2>
                <p>Please ensure the <strong>env.js</strong> file exists in the project's root directory and is accessible.</p>
            </div>
        `;
        throw new Error("Configuration object from `env.js` module could not be loaded.");
    }

    // Additional runtime guard: if any env value is masked (contains '*') or missing, fail fast with a clear message
    const maskedKeys = Object.keys(env).filter(k => {
        const v = env[k as keyof typeof env];
        return !v || (typeof v === 'string' && v.includes('*')) || (typeof v === 'string' && v.trim() === '');
    });

    if (maskedKeys.length > 0 && !isDev) {
        document.body.innerHTML = `
            <div style="font-family: sans-serif; padding: 2rem; margin: auto; max-width: 800px; background-color: #fff3f3; color: #333; min-height: 100vh;">
                <h1 style="color: #d9534f; border-bottom: 2px solid #eea29f; padding-bottom: 0.5rem;">Configuration Error</h1>
                <p>The application cannot run because environment variables are missing or masked in the production build: <strong>${maskedKeys.join(', ')}</strong>.</p>
                <p>Please set these environment variables in your deployment platform (Netlify) and trigger a fresh server-side build.</p>
            </div>
        `;
        throw new Error(`Missing or masked environment variables: ${maskedKeys.join(', ')}`);
    }

    // In development, allow placeholders so developers can preview UI without real keys.
    if (!isDev) {
        const placeholders = {
            SUPABASE_URL: 'https://usbvlkjoeujncihgjvzw.supabase.co',
            SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYnZsa2pvZXVqbmNpaGdqdnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzkwMDIsImV4cCI6MjA3NTAxNTAwMn0.Tzo07BvbOMej7Tlc2sqAq8aYy4Id_KuYLuU-f6xFXGc',
            API_KEY: 'AIzaSyCGdxpJ1yo_3h5kTo5ACh_bUO0sTr4c6ys'
        };

        const missingOrInvalidKeys = Object.keys(placeholders).filter(key => {
            const value = env?.[key as keyof typeof env];
            return !value || value === placeholders[key as keyof typeof placeholders] || value.trim() === '';
        });

        if (missingOrInvalidKeys.length > 0) {
            document.body.innerHTML = `
                <div style="font-family: sans-serif; padding: 2rem; margin: auto; max-width: 800px; background-color: #fff3f3; color: #333; min-height: 100vh;">
                    <h1 style="color: #d9534f; border-bottom: 2px solid #eea29f; padding-bottom: 0.5rem;">Configuration Error</h1>
                    <p style="font-size: 1.1rem;">The application cannot start because its API keys are not configured correctly.</p>
                    <h2 style="color: #333; margin-top: 2rem;">Action Required:</h2>
                    <p>One or more of the following keys are missing or have placeholder values: <strong style="color: #d9534f;">${missingOrInvalidKeys.join(', ')}</strong>.</p>
                    
                    <div style="margin-top: 2rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                        <h3 style="margin-top: 0; color: #333;">For Local Development:</h3>
                        <p style="margin-top: 0.5rem;">
                            Edit the <strong>env.js</strong> file in your project's root directory and replace the placeholder values with your actual keys.
                        </p>
                    </div>

                    <div style="margin-top: 1.5rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                        <h3 style="margin-top: 0; color: #333;">For Deployment (Netlify, Vercel, etc.):</h3>
                         <p style="margin-top: 0.5rem;">
                            You must set these keys as <strong>environment variables</strong> in your deployment platform's settings.
                        </p>
                        <ul style="line-height: 1.6; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0;">
                            <li>Go to your site's settings in your deployment provider.</li>
                            <li>Navigate to the "Environment Variables" section.</li>
                            <li>Add the missing keys with their correct values.</li>
                        </ul>
                    </div>
                </div>
            `;
            throw new Error(`Environment variables are not configured or are empty: ${missingOrInvalidKeys.join(', ')}`);
        }
    } else {
        // Development: log a friendly notice and continue rendering so devs can preview UI.
        console.warn('Development mode: skipping strict API key placeholder validation.');
    }

    // If validation passes (or we're in dev), render the React app
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}

// Run the async bootstrap
validateAndRender().catch(err => {
    console.error('Failed to validate and render application:', err);
});