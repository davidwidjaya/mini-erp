import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

// Error boundary for the root render
try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <>
      <AuthProvider>
        <App />
      </AuthProvider>
    </>
  );
} catch (error) {
  console.error("Fatal Application Error during mount:", error);
  document.body.innerHTML = `<div style="padding: 20px; font-family: sans-serif; color: red;"><h1>Application Error</h1><p>Failed to mount the application. Please check the console for details.</p></div>`;
}