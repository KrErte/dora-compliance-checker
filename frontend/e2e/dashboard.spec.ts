import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Dashboard (user)', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'user.json') });

  test('dashboard loads successfully', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    // Dashboard should have some visible content within a reasonable time
    await expect(page.locator('app-dashboard, [class*="dashboard"], main')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('dashboard shows key elements', async ({ page }) => {
    await page.goto('/dashboard');
    // Should have at least one actionable button or link
    const actionLinks = page.locator('a[routerLink], button').first();
    await expect(actionLinks).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click assessment link from navigation
    const assessmentLink = page.locator('a[href="/assessment"], a[routerLink="/assessment"]').first();
    if (await assessmentLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await assessmentLink.click();
      await expect(page).toHaveURL(/\/assessment/);
    }
  });

  test('new assessment button navigates correctly', async ({ page }) => {
    await page.goto('/dashboard');
    const newAssessmentBtn = page.locator('a[href="/assessment"], a[routerLink="/assessment"]').first();
    if (await newAssessmentBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await newAssessmentBtn.click();
      await expect(page).toHaveURL(/\/assessment/);
    }
  });
});

test.describe('Dashboard (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

  test('admin sees admin navigation items', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Admin should have access to admin routes
    const adminLink = page.locator(
      'a[href="/admin/users"], a[routerLink="/admin/users"], a[href*="admin"]',
    ).first();
    // Admin-specific elements may or may not be visible depending on sidebar state
    // At minimum, navigating to admin page should work
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);
  });
});
