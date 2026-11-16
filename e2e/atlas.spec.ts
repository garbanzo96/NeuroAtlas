import { expect, test } from '@playwright/test';

test.describe('atlas multiescala', () => {
  test('carga la portada con riel de niveles y escena 3D', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Niveles de organización' })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  });

  test('el teclado cambia de nivel y abre la lámina', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press('5');
    const rail = page.getByRole('navigation', { name: 'Niveles de organización' });
    await expect(rail.locator('[aria-current="step"]')).toContainText('Neurona');
    await expect(page.getByRole('complementary', { name: 'Lámina informativa' })).toContainText(
      'neurona',
      { ignoreCase: true },
    );
  });

  test('las vías se listan y se activan con su recorrido', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Vías', exact: true }).click();
    await page.getByRole('button', { name: /corticoespinal/i }).click();
    await expect(page.getByText(/paso 1 de/i)).toBeVisible();
    // por teclado: con WebGL por software el hilo principal no alcanza la comprobación de estabilidad del clic
    await page.getByRole('button', { name: /Siguiente/ }).press('Enter');
    await expect(page.getByText(/paso 2 de/i)).toBeVisible();
  });

  test('la búsqueda encuentra estructuras y abre su ficha', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar estructura o vía' }).fill('putamen');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 2, name: /putamen/i })).toBeVisible();
  });

  test('el enlace copiado reproduce selección, capa y cámara', async ({ browser }) => {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/?n=areas&e=putamen_L&capa=sistemas&desconocido=1');
    await expect(page.getByRole('heading', { level: 2, name: /putamen/i })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.na-atlas')).toHaveAttribute('data-level', 'areas', {
      timeout: 15_000,
    });
    await page.waitForTimeout(3000); // espera el enfoque inicial antes de capturar la pose
    await page.getByRole('button', { name: 'Copiar enlace' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Enlace copiado' })).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    const url = new URL(link);
    expect(url.searchParams.get('n')).toBe('areas');
    expect(url.searchParams.get('e')).toBe('putamen_L');
    expect(url.searchParams.get('capa')).toBe('sistemas');
    expect(url.searchParams.get('cam')?.split(',')).toHaveLength(6);
    await page.goto(link);
    await expect(page.getByRole('heading', { level: 2, name: /putamen/i })).toBeVisible();
    await expect(page.locator('.na-atlas')).toHaveAttribute('data-level', 'areas', {
      timeout: 15_000,
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(3000); // la cámara vuela hasta la pose restaurada
    await page.getByRole('button', { name: 'Copiar enlace' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Enlace copiado' })).toBeVisible();
    const restored = new URL(await page.evaluate(() => navigator.clipboard.readText()));
    expect(restored.searchParams.get('cam')).toBe(url.searchParams.get('cam'));
    expect(restored.searchParams.get('capa')).toBe('sistemas');
    await context.close();
  });

  test('los créditos acreditan las licencias de las mallas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Créditos' }).click();
    await expect(page.getByRole('dialog', { name: 'Créditos y fuentes' })).toContainText(
      'CC BY 4.0',
    );
  });

  test('recorre los siete niveles con el teclado sin errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => r.status() >= 400 && errors.push(r.url()));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
    const current = page
      .getByRole('navigation', { name: 'Niveles de organización' })
      .locator('[aria-current="step"]');
    await page.waitForTimeout(3000); // el vuelo de entrada (≈2,7 s) pisa órdenes de cámara anteriores
    for (const [key, name] of [
      ['1', 'Sistema nervioso'],
      ['3', 'Áreas'],
      ['4', 'Columnas'],
      ['6', 'Sinapsis'],
      ['7', 'Membrana'],
      ['2', 'Encéfalo'],
    ] as const) {
      await page.keyboard.press(key);
      await expect(current).toContainText(name, { ignoreCase: true });
    }
    expect(errors).toEqual([]);
  });

  test('con movimiento reducido no se monta el destello de transición', async ({ browser }) => {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press('5');
    await expect(page.locator('.na-warp')).toHaveCount(0);
    await page.close();
  });
});
