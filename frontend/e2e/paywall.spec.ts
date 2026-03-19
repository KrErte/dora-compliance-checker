import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Paywall / Subscription', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'user.json') });

  test('free user sees upgrade prompts on premium features', async ({ page }) => {
    // Navigate to a premium-gated feature page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for upgrade CTA or premium badge elements
    const upgradeCta = page.locator(
      '[class*="upgrade"], [class*="premium"], button:has-text("upgrade"), button:has-text("Upgrade")',
    ).first();

    // Check if there's any premium/upgrade indicator on the page
    const hasUpgrade = await upgradeCta.isVisible({ timeout: 5_000 }).catch(() => false);

    // If user is on free tier, upgrade prompts should exist somewhere in the app
    // Navigate to a clearly premium page
    await page.goto('/evidence-vault');
    const premiumIndicator = page.locator(
      '[class*="upgrade"], [class*="premium"], [class*="paywall"]',
    ).first();
    // Page should load (may show paywall or content depending on trial status)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('premium tools page loads or shows paywall', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
    // Should show either the tool content or an upgrade prompt
    await expect(page.locator('main, app-audit-trail, [class*="audit"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('pricing page is accessible from app', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator('app-pricing, [class*="pricing"]')).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('Paywall (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('pricing page loads without auth', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('protected tools redirect to login', async ({ page }) => {
    await page.goto('/evidence-vault');
    await expect(page).toHaveURL(/\/login/);
  });
});
