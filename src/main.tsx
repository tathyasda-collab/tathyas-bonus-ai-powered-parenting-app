import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import { ErrorProvider } from '../context/ErrorContext';
import '../index.css';

const validateAndRender = () => {
  const missingKeys: string[] = [];

  // Check Vite environment variables
  const requiredEnvVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value === '') {
      missingKeys.push(key);
    }
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  if (missingKeys.length > 0) {
    rootElement.innerHTML = `
      <div style="padding: 2rem; font-family: sans-serif; background-color: #fff3f3; border: 1px solid #ffc0c0; border-radius: 8px; max-width: 600px; margin: 4rem auto; color: #5a2121;">
        <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Configuration Error</h1>
        <p style="margin-bottom: 1rem;">The application cannot start because some required environment variables are missing.</p>
        <p style="margin-bottom: 0.5rem;">Please configure the following environment variables in Vercel:</p>
        <ul style="list-style-type: disc; padding-left: 2rem; margin-bottom: 1.5rem;">
          ${missingKeys.map(key => `<li><strong>${key}</strong></li>`).join('')}
        </ul>
        <p style="font-size: 0.875rem; color: #7c3a3a;">After setting the environment variables, please redeploy the application.</p>
      </div>
    `;
  } else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorProvider>
          <App />
        </ErrorProvider>
      </React.StrictMode>
    );
  }
};

// Use DOMContentLoaded for better compatibility
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', validateAndRender);
} else {
  validateAndRender();
}