import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@goal-tracker/ui/globals.css';
import { App } from './app';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Root element was not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
