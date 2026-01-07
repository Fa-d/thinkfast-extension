import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { Settings } from './popup/Settings';
import { ThemeManager } from './lib/theme';

// Initialize theme
ThemeManager.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Settings />
  </StrictMode>
);
