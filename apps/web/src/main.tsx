import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Algunos destinos (p. ej. la vista previa de claude.ai) sustituyen el <html lang="es"> del documento.
if (!document.documentElement.lang) document.documentElement.lang = 'es';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
