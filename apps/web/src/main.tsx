import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Algunos destinos (p. ej. la vista previa de claude.ai) sustituyen el <html lang="es"> del documento.
if (!document.documentElement.lang) document.documentElement.lang = 'es';

// La unidad curada original (retina → potencial de acción, con evidencia por afirmación) sigue disponible
// en ?unidad y en sus URLs reproducibles (?s=…); el atlas multiescala es la portada.
const params = new URLSearchParams(location.search);
const legacy = ['unidad', 's', 'r', 'lesson'].some((k) => params.has(k));

const root = createRoot(document.getElementById('root')!);
if (legacy) {
  await import('./styles.css');
  const { App } = await import('./App');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  const { AtlasApp } = await import('./atlas/AtlasApp');
  root.render(
    <StrictMode>
      <AtlasApp />
    </StrictMode>,
  );
}
