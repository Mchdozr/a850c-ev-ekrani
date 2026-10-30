import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('portable HTML loads its real designer, themes, TV and JSON download without external resources', async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const html = await readFile('release/Onizleme.html', 'utf8');
  await page.route('**/*', async route => {
    if (route.request().url() === 'http://127.0.0.1:34567/') await route.fulfill({ contentType: 'text/html', body: html });
    else { external.push(route.request().url()); await route.abort(); }
  });
  await page.goto('http://127.0.0.1:34567/');
  await expect(page.getByRole('heading', { name: 'Kendin yap', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Amber Salon temasını uygula' }).click();
  await expect(page.getByRole('button', { name: 'Amber Salon temasını uygula' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Tam ekran', exact: true }).click();
  await expect(page.getByLabel('A 850 C tam ekran', { exact: true })).toBeVisible();
  await expect(page.locator('[data-app-mark]')).toHaveCount(6);
  await expect(page.locator('[data-font]>div').first()).toHaveCSS('background-image', /data:image\/jpeg;base64,/);
  await page.screenshot({ path: '/tmp/a850c-portable.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Dosya ve REA', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Dışa aktar', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('a850c-ev-ekrani.json');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const design = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(design.wallpaper).toEqual({ type: 'preset', presetId: 'bakir-lamba' });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
