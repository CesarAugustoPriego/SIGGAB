import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './features/auth/auth-context';
import './style.css';
import './premium-design.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

