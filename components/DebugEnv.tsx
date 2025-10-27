import React from 'react';

const DebugEnv: React.FC = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET',
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', backgroundColor: '#000', color: '#0f0' }}>
      <h2>Environment Variables Debug</h2>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
    </div>
  );
};

export default DebugEnv;