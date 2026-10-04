import { describe, expect, it } from 'vitest';
import { toArtifactPage } from './build-artifact';

describe('toArtifactPage', () => {
  it('quita el esqueleto del documento, deja el título primero y conserva los recursos', () => {
    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NeuroAtlas</title>
    <script type="module" crossorigin src="./assets/index-abc.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/index-abc.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    const page = toArtifactPage(html);
    expect(page.startsWith('<title>NeuroAtlas</title>')).toBe(true);
    expect(page).not.toMatch(/<!doctype|<html|<head|<body|<meta/i);
    expect(page).toContain('src="./assets/index-abc.js"');
    expect(page).toContain('href="./assets/index-abc.css"');
    expect(page).toContain('<div id="root"></div>');
  });
});
