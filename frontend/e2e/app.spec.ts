import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('la página de inicio muestra el laboratorio en vivo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('laboratorio de química');
  await expect(page.getByRole('img', { name: /Simulación en vivo/ })).toBeVisible();
});

test('un estudiante completa el nivel 1 y gana estrellas', async ({ page }) => {
  await page.goto('/#/ingresar');
  await page.getByRole('button', { name: 'Entrar como estudiante' }).click();
  await expect(page.getByRole('heading', { name: 'Misiones' })).toBeVisible();
  await page.getByRole('link', { name: 'Empezar práctica' }).click();
  await expect(page.getByRole('heading', { name: 'Moléculas en movimiento' })).toBeVisible();

  // Paso 1: inyectar 20 H₂ (30 + 20 = 50)
  await page.getByRole('button', { name: /Inyectar/ }).click();
  await expect(page.getByText('Calienta la cámara', { exact: true }).locator('xpath=..')).toHaveAttribute('aria-current', 'step', { timeout: 15_000 });
  // Paso 2: calentar a 650 K y sostener 2 s
  await page.getByLabel('Temperatura').fill('650');
  await expect(page.getByText('Congela el hidrógeno', { exact: true }).locator('xpath=..')).toHaveAttribute('aria-current', 'step', { timeout: 40_000 });
  // Paso 3: congelar
  await page.getByLabel('Temperatura').fill('5');
  await expect(page.getByRole('heading', { name: /Si aumentas la temperatura/ })).toBeVisible({ timeout: 60_000 });

  // Cuestionario: 3 respuestas correctas
  for (const correcta of ['se mueven más rápido', 'Sólido', '−273 °C']) {
    await page.getByLabel(correcta, { exact: true }).check();
    await page.getByRole('button', { name: 'Responder' }).click();
    await expect(page.getByText('¡Correcto!')).toBeVisible();
    await page.getByRole('button', { name: /Siguiente pregunta|Ver resultado/ }).click();
  }
  await expect(page.getByRole('heading', { name: '¡Nivel completado!' })).toBeVisible();
  await expect(page.getByRole('img', { name: '3 de 3 estrellas' })).toBeVisible();
  await expect(page.getByText('Primer experimento')).toBeVisible();
});

test('el docente ve el dashboard de uso', async ({ page }) => {
  await page.goto('/#/ingresar');
  await page.getByRole('button', { name: 'Entrar como docente' }).click();
  await page.goto('/#/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard de uso' })).toBeVisible();
  await expect(page.getByText('Embudo por nivel')).toBeVisible();
});

for (const ruta of ['/', '/#/mapa', '/#/laboratorio', '/#/ingresar']) {
  test(`accesibilidad WCAG 2.2 AA sin violaciones graves: ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    await page.waitForTimeout(1200);
    // Las casillas inertes de la tabla periódica son texto decorativo (WCAG 1.4.3, excepción "incidental").
    const r = await new AxeBuilder({ page }).exclude('[data-decorativo]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id}: ${v.nodes.length} → ${v.nodes[0]?.target}`)).toEqual([]);
  });
}
