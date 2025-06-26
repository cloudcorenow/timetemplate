import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LogProvider } from './context/LogContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LogProvider>
      <App />
    </LogProvider>
  </StrictMode>
);