import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Compliance tools (authenticated)', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'user.json') });

  test('contract analysis page loads', async ({ page }) => {
    await page.goto('/contract-analysis');
    await expect(page).toHaveURL(/\/contract-analysis/);
    // Should show file upload area or form
    await expect(
      page.locator('#contract-company, input[type="file"], [class*="contract"], app-contract-analysis'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('contract analysis shows upload zone', async ({ page }) => {
    await page.goto('/contract-analysis');
    await page.waitForLoadState('networkidle');

    // File input should exist (may be hidden, triggered by drag-drop zone)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 10_000 });
  });

  test('fine calculator page loads', async ({ page }) => {
    await page.goto('/fine-calculator');
    await expect(page).toHaveURL(/\/fine-calculator/);
    await page.waitForLoadState('networkidle');
    // Should have some interactive elements
    await expect(page.locator('main, [class*="calculator"], [class*="fine"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('NIS2 scope check page loads and has inputs', async ({ page }) => {
    await page.goto('/nis2/scope-check');
    await expect(page).toHaveURL(/\/nis2\/scope-check/);
    // Should show sector dropdown and other fields
    await expect(page.locator('#nis2-sector, select, app-nis2-scope-check').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('NIS2 scope check accepts input', async ({ page }) => {
    await page.goto('/nis2/scope-check');
    await page.waitForLoadState('networkidle');

    const sectorSelect = page.locator('#nis2-sector');
    if (await sectorSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Select a sector
      const options = await sectorSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await sectorSelect.selectOption({ index: 1 });
      }
    }

    // Fill employee count
    const employeesInput = page.locator('#nis2-employees');
    if (await employeesInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await employeesInput.fill('150');
    }

    // Fill revenue
    const revenueInput = page.locator('#nis2-revenue');
    if (await revenueInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revenueInput.fill('15000000');
    }
  });
});

test.describe('Compliance tools (public / free)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('assessment page loads without auth', async ({ page }) => {
    await page.goto('/assessment');
    await expect(page).toHaveURL(/\/assessment/);
    await expect(page.locator('#assess-company, app-assessment').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('NIS2 scope check loads without auth', async ({ page }) => {
    await page.goto('/nis2/scope-check');
    await expect(page).toHaveURL(/\/nis2\/scope-check/);
  });

  test('contract analysis loads without auth', async ({ page }) => {
    await page.goto('/contract-analysis');
    await expect(page).toHaveURL(/\/contract-analysis/);
  });

  test('fine calculator loads without auth', async ({ page }) => {
    await page.goto('/fine-calculator');
    await expect(page).toHaveURL(/\/fine-calculator/);
  });

  test('contract checklist loads without auth', async ({ page }) => {
    await page.goto('/contract-checklist');
    await expect(page).toHaveURL(/\/contract-checklist/);
  });
});
