import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const API_URL = process.env['E2E_API_URL'] || 'http://localhost:8080';
const USER_EMAIL = process.env['E2E_USER_EMAIL'] || 'user@doraaudit.eu';
const USER_PASSWORD = process.env['E2E_USER_PASSWORD'] || 'User1234';
const ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL'] || 'admin@doraaudit.eu';
const ADMIN_PASSWORD = process.env['E2E_ADMIN_PASSWORD'] || 'Admin1234';

const AUTH_DIR = path.join(__dirname, '.auth');

async function loginAndSave(
  baseURL: string,
  email: string,
  password: string,
  outputPath: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${res.statusText}`);
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

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto('/');
  await page.evaluate(
    ({ token, refreshToken, userObj }) => {
      localStorage.setItem('dora_token', token);
      if (refreshToken) localStorage.setItem('dora_refresh_token', refreshToken);
      localStorage.setItem('dora_user', JSON.stringify(userObj));
    },
    { token: data.token, refreshToken: data.refreshToken, userObj: user },
  );

  await context.storageState({ path: outputPath });
  await browser.close();
}

async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:4200';

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  await loginAndSave(baseURL, USER_EMAIL, USER_PASSWORD, path.join(AUTH_DIR, 'user.json'));
  await loginAndSave(baseURL, ADMIN_EMAIL, ADMIN_PASSWORD, path.join(AUTH_DIR, 'admin.json'));
}

export default globalSetup;
