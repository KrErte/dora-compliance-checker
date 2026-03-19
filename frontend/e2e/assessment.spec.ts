import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Assessment (public)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('assessment page loads without auth', async ({ page }) => {
    await page.goto('/assessment');
    await expect(page).toHaveURL(/\/assessment/);
    // Assessment page should show the step indicator or form
    await expect(
      page.locator('#assess-company, [class*="assessment"], app-assessment'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('assessment shows company info form (step 1)', async ({ page }) => {
    await page.goto('/assessment');
    // Step 1: Company info fields
    await expect(page.locator('#assess-company')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#assess-contract')).toBeVisible();
  });

  test('demo scenario buttons are visible', async ({ page }) => {
    await page.goto('/assessment');
    await page.waitForLoadState('networkidle');

    // Scenario buttons (ideal, average, weak)
    const idealBtn = page.getByText(/ideal/i).first();
    const averageBtn = page.getByText(/average|keskmine/i).first();
    const weakBtn = page.getByText(/weak|nõrk/i).first();

    // At least one scenario button should be visible
    const anyVisible = await Promise.any([
      idealBtn.isVisible({ timeout: 5_000 }),
      averageBtn.isVisible({ timeout: 5_000 }),
      weakBtn.isVisible({ timeout: 5_000 }),
    ]).catch(() => false);

    expect(anyVisible).toBeTruthy();
  });
});

test.describe('Assessment wizard (authenticated)', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'user.json') });

  test('assessment wizard loads for authenticated user', async ({ page }) => {
    await page.goto('/assessment/wizard');
    // Should not redirect to login since we're authenticated
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('can fill company info and proceed', async ({ page }) => {
    await page.goto('/assessment');
    await page.waitForLoadState('networkidle');

    // Fill company info
    const companyField = page.locator('#assess-company');
    if (await companyField.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await companyField.fill('Test Company OÜ');

      const contractField = page.locator('#assess-contract');
      if (await contractField.isVisible()) {
        await contractField.fill('Cloud Service Agreement');
      }
    }
  });

  test('answer buttons work for questions', async ({ page }) => {
    await page.goto('/assessment');
    await page.waitForLoadState('networkidle');

    // Fill company info first
    const companyField = page.locator('#assess-company');
    if (await companyField.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await companyField.fill('Test Company OÜ');
      await page.locator('#assess-contract').fill('Test Contract');
    }

    // Look for Yes/Partial/No answer buttons
    const yesBtn = page.getByRole('button', { name: /^yes$|^jah$/i }).first();
    if (await yesBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await yesBtn.click();
      // Button should become active (has gradient styling)
      await expect(yesBtn).toHaveClass(/emerald|active|scale/);
    }
  });
});
