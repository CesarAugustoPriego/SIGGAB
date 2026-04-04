import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

function apiEnvelope(data: unknown, message = 'OK') {
  return {
    success: true,
    data,
    message,
    errors: null,
  };
}

async function mockRespaldosEndpoints(page: Page) {
  const files = [
    {
      fileName: 'siggab-backup-2026-04-04T16-20-10-120Z.json',
      sizeBytes: 18432,
      createdAt: '2026-04-04T16:20:10.120Z',
      modifiedAt: '2026-04-04T16:20:10.120Z',
    },
    {
      fileName: 'siggab-backup-2026-04-03T11-00-00-000Z.json',
      sizeBytes: 15220,
      createdAt: '2026-04-03T11:00:00.000Z',
      modifiedAt: '2026-04-03T11:00:00.000Z',
    },
  ];

  const calls = {
    list: 0,
    ejecutar: 0,
    descargar: 0,
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.endsWith('/respaldos') && method === 'GET') {
      calls.list += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope(files, 'Listado de respaldos obtenido')),
      });
      return;
    }

    if (path.endsWith('/respaldos/ejecutar') && method === 'POST') {
      calls.ejecutar += 1;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          fileName: 'siggab-backup-2026-04-04T17-45-00-000Z.json',
          filePath: 'C:/SIGGAB/backups/siggab-backup-2026-04-04T17-45-00-000Z.json',
          generatedAt: '2026-04-04T17:45:00.000Z',
          source: 'MANUAL',
          executedBy: 1,
          cloud: null,
        }, 'Respaldo generado correctamente')),
      });
      return;
    }

    if (/\/respaldos\/.+\/descargar$/.test(path) && method === 'GET') {
      calls.descargar += 1;
      const requestedFileName = decodeURIComponent(path.split('/respaldos/')[1].replace('/descargar', ''));
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'content-disposition': `attachment; filename="${requestedFileName}"`,
        },
        body: JSON.stringify({ backup: true }),
      });
      return;
    }

    await route.continue();
  });

  return { calls, files };
}

test('Respaldos: lista historial, ejecuta respaldo manual y descarga archivo', async ({ page }) => {
  await loginAsAdmin(page);
  const { calls, files } = await mockRespaldosEndpoints(page);

  await page.goto('/#/app/respaldos');
  await expect(page.getByTestId('respaldos-header')).toBeVisible();
  await expect(page.getByTestId('respaldos-history-list')).toBeVisible();
  await expect(page.getByText(files[0].fileName)).toBeVisible();

  await page.getByTestId('respaldos-run-manual').click();
  await expect.poll(() => calls.ejecutar).toBeGreaterThan(0);
  await expect.poll(() => calls.list).toBeGreaterThan(1);
  await expect(page.getByText('Respaldo manual generado')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId(`respaldos-download-${files[0].fileName}`).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(files[0].fileName);
  await expect.poll(() => calls.descargar).toBeGreaterThan(0);
});
