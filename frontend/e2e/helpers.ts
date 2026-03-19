import { Page, expect } from '@playwright/test';

const API_URL = process.env['E2E_API_URL'] || 'http://localhost:8080';

/**
 * Log in via the backend API and set localStorage tokens directly.
 */
export async function loginViaAPI(page: Page, email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`API login failed for ${email}: ${res.status}`);
  }

  const data = await res.json();
  const user = {
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    accountTier: data.accountTier,
    trialEndsAt: data.trialEndsAt,
  };

  await page.evaluate(
    ({ token, refreshToken, userObj }) => {
      localStorage.setItem('dora_token', token);
      if (refreshToken) localStorage.setItem('dora_refresh_token', refreshToken);
      localStorage.setItem('dora_user', JSON.stringify(userObj));
    },
    { token: data.token, refreshToken: data.refreshToken, userObj: user },
  );
}

/**
 * Log in by filling the UI login form.
 */
export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('form button[type="submit"]').click();
}

/**
 * Assert a toast notification appears with the given type and optional text.
 */
export async function expectToast(
  page: Page,
  type: 'success' | 'error' | 'warning' | 'info',
  text?: string,
): Promise<void> {
  const colorMap: Record<string, string> = {
    success: 'emerald',
    error: 'red',
    warning: 'amber',
    info: 'blue',
  };
  const color = colorMap[type];

  // Toast container uses fixed positioning with color-coded borders/backgrounds
  const toastLocator = page.locator(`[class*="border-${color}"]`).last();
  await expect(toastLocator).toBeVisible({ timeout: 5_000 });

  if (text) {
    await expect(toastLocator).toContainText(text);
  }
}
