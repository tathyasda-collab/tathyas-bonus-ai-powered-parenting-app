import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import { ErrorProvider } from '../context/ErrorContext';
import '../index.css';

const validateAndRender = () => {
  const config = window.APP_CONFIG?.env;
  const missingKeys: string[] = [];

  // Use generic placeholders for validation. This allows any valid key to be used.
  const requiredKeys = {
    SUPABASE_URL: "SUPABASE_URL",
    SUPABASE_ANON_KEY: "SUPABASE_ANON_KEY",
    API_KEY: "API_KEY",
  };

  if (!config) {
    missingKeys.push(...Object.keys(requiredKeys));
  } else {
    for (const key in requiredKeys) {
      const placeholder = requiredKeys[key as keyof typeof requiredKeys];
      // This now correctly checks if the provided key is either missing or is still a placeholder.
      if (!config[key] || config[key] === placeholder) {
        missingKeys.push(key);
      }
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
        <p style="margin-bottom: 1rem;">The application cannot start because some required environment variables are missing or have placeholder values.</p>
        <p style="margin-bottom: 0.5rem;">Please configure the following keys in your <strong>env.js</strong> file:</p>
        <ul style="list-style-type: disc; padding-left: 2rem; margin-bottom: 1.5rem;">
          ${missingKeys.map(key => `<li><strong>${key}</strong></li>`).join('')}
        </ul>
        <p style="font-size: 0.875rem; color: #7c3a3a;">After updating the file, please refresh the page.</p>
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