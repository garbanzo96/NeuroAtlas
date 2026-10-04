import { type Page, expect, test } from '@playwright/test';

/**
 * Recorrido mínimo integrado (docs/architecture.md §7): carga, selección por teclado, capas,
 * transición con aviso de contexto, escena bloqueada, simulación en Worker, URL reproducible y móvil.
 */

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

// Los proyectos de playwright.config.ts filtran por la etiqueta @mobile.
test.describe('escritorio', () => {
  test('carga la vía visual con aviso de borrador y visor 3D', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('.na-viewer__title')).toHaveText('Vía visual: de la retina a V1');
    await expect(page.locator('.na-draft-notice')).toContainText('0 de 25 afirmaciones');
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('.na-3d-label', { hasText: 'Quiasma óptico' })).toBeVisible();
    await expect(page.locator('.na-disclaimer')).toContainText('Esquema didáctico');
    expect(errors).toEqual([]);
  });

  test('búsqueda y selección por teclado abren la ficha con evidencia', async ({ page }) => {
    await page.goto('/');
    await page.locator('.na-viewer__title').waitFor();
    await page.keyboard.press('/');
    await expect(page.locator('#na-search')).toBeFocused();
    await page.keyboard.type('quiasma');
    await page
      .getByRole('button', { name: /Quiasma óptico/ })
      .first()
      .click();
    await expect(page.locator('.na-info h2')).toContainText('Quiasma óptico');
    await expect(page.locator('.na-info')).toContainText('hemirretina nasal');
    await expect(page.locator('.na-info .na-badge--status-draft').first()).toHaveText('Borrador');
    await expect(page).toHaveURL(/e=ent\.human\.optic_chiasm/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.na-info h2')).toHaveText('Vía visual: de la retina a V1');

    // Lista de estructuras: ↓ mueve el foco, Enter selecciona.
    await page.locator('.na-entities button').first().focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('.na-info h2')).toContainText('Quiasma óptico');
  });

  test('las capas se pueden ocultar y quedan en la URL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Nervios, tractos y radiaciones' }).uncheck();
    await expect(page).toHaveURL(/l=structures%2Chemiretinas%2Cfibers/);
  });

  test('una transición anuncia el cambio de especie y abstracción', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Explorar el circuito laminar/ }).click();
    const notice = page.getByRole('status', { name: 'Cambio de contexto' });
    await expect(notice).toContainText('Especie');
    await expect(notice).toContainText('Nivel de abstracción');
    await expect(notice).toContainText('no es un acercamiento continuo');
    await page.getByRole('button', { name: 'Entendido' }).click();
    await expect(notice).toHaveCount(0);
    await expect(page.locator('.na-viewer__title')).toHaveText(
      'Circuito laminar neocortical (esquema)',
    );
  });

  test('la escena anatómica sin asset autorizado se muestra bloqueada, con su información', async ({
    page,
  }) => {
    await page.goto('/?s=scene.visual.v1_location');
    await expect(page.getByText('Escena bloqueada')).toBeVisible();
    await expect(page.locator('.na-blocked')).toContainText('WP-020');
    await expect(page.locator('.na-blocked')).toContainText('surco calcarino');
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('la simulación HH corre en un Worker y responde al protocolo', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/?s=scene.visual.excitability');
    const status = page.locator('.na-sim__status');
    await expect(status).toContainText('Web Worker', { timeout: 15_000 });
    await expect(status).toContainText('6 potencial(es) de acción');

    await page.getByRole('button', { name: /Pulso subumbral/ }).click();
    await page.getByRole('button', { name: 'Ejecutar simulación' }).click();
    await expect(status).toContainText('0 potencial(es) de acción');

    await page.getByRole('button', { name: /Pulso supraumbral/ }).click();
    await page.getByRole('button', { name: 'Ejecutar simulación' }).click();
    await expect(status).toContainText('1 potencial(es) de acción a t = 6.30');
    await expect(page).toHaveURL(/sim=amp%3A20%2Cstart%3A5%2Cdur%3A1%2Ctotal%3A30/);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar experimento/ }).click();
    expect((await download).suggestedFilename()).toMatch(/^neuroatlas-model\.hh_classic-.*\.json$/);
    expect(errors).toEqual([]);
  });

  test('una URL compartida restaura escena, selección y protocolo', async ({ page }) => {
    await page.goto(
      '/?s=scene.visual.v1_laminar_circuit&e=ent.neocortex.l4_excitatory&l=cortical_layers,populations',
    );
    await expect(page.locator('.na-info h2')).toContainText('Neuronas excitadoras de capa 4');
    await expect(
      page.getByRole('checkbox', { name: 'Proyecciones principales (esquema canónico)' }),
    ).not.toBeChecked();
  });

  test('el recorrido guiado avanza con el teclado y anuncia cambios de contexto', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recorrido guiado' }).click();
    await expect(page.locator('.na-lesson')).toContainText('paso 1 de 8');
    await page.locator('body').press(']');
    await expect(page.locator('#na-lesson-title')).toHaveText('El quiasma óptico');
    await page.locator('body').press(']');
    await page.locator('body').press(']');
    await expect(page.locator('.na-viewer__title')).toHaveText(
      'Circuito laminar neocortical (esquema)',
    );
    await expect(page.getByRole('status', { name: 'Cambio de contexto' })).toBeVisible();
  });
});

test.describe('móvil @mobile', () => {
  test('pestañas conservan la selección entre visor y ficha', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/?s=scene.visual.pathway&e=ent.human.lgn');
    await expect(page.getByRole('tab', { name: 'Visor' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('canvas')).toBeVisible();
    await page.getByRole('tab', { name: 'Ficha' }).tap();
    await expect(page.locator('.na-info h2')).toContainText('Núcleo geniculado lateral');
    await page.getByRole('tab', { name: 'Explorar' }).tap();
    await expect(page.getByRole('button', { name: /Núcleo geniculado lateral/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(errors).toEqual([]);
  });
});
