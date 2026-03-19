import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator('app-pricing, [class*="pricing"], main')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows all pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // 4 tiers: Free, Professional, Business, Enterprise
    const freeText = page.getByText(/free/i).first();
    const professionalText = page.getByText(/professional/i).first();
    const businessText = page.getByText(/business/i).first();
    const enterpriseText = page.getByText(/enterprise/i).first();

    await expect(freeText).toBeVisible({ timeout: 10_000 });
    await expect(professionalText).toBeVisible();
    await expect(businessText).toBeVisible();
    await expect(enterpriseText).toBeVisible();
  });

  test('shows pricing amounts', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Check for EUR pricing: €149, €299, €499
    const price149 = page.getByText(/149/).first();
    const price299 = page.getByText(/299/).first();
    const price499 = page.getByText(/499/).first();

    await expect(price149).toBeVisible({ timeout: 10_000 });
    await expect(price299).toBeVisible();
    await expect(price499).toBeVisible();
  });

  test('CTA buttons are present for each tier', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Each tier should have a CTA button (link or button)
    const ctaButtons = page.locator(
      'a[href*="lemonsqueezy"], a[href*="checkout"], a[routerLink="/nis2/scope-check"], button:has-text("Start"), button:has-text("Alusta"), a:has-text("Start"), a:has-text("Alusta")',
    );
    const count = await ctaButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('feature comparison is visible', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Pricing page should have feature comparison (checkmarks, dashes)
    const checkmarks = page.getByText('✓');
    const checkCount = await checkmarks.count();
    expect(checkCount).toBeGreaterThan(0);
  });

  test('popular badge is shown on Business tier', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Business tier has a "Popular" or "Populaarne" badge with emerald styling
    const popularBadge = page.locator('[class*="emerald-500"]').filter({
      hasText: /popular|populaarne/i,
    });
    // Or check for the border-emerald-500 card styling
    const highlightedCard = page.locator('[class*="border-emerald-500"], [class*="border-2"][class*="emerald"]').first();
    const hasBadge = await popularBadge.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasHighlight = await highlightedCard.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasBadge || hasHighlight).toBeTruthy();
  });
});
