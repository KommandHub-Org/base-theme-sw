import { test as setup, expect, paths, authFile, fillRegistration } from './support';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

/**
 * Registers one throwaway customer per run and saves the logged-in session
 * for the specs that need an account (wishlist, account). Credentials live
 * only in the git-ignored tests/e2e/.auth folder.
 */
setup('register a customer', async ({ page }) => {
    const id = `${Date.now()}-${randomBytes(3).toString('hex')}`;
    const email = `kmh-e2e-${id}@example.com`;
    const password = `E2e-${randomBytes(9).toString('base64url')}`;

    await page.goto('/account/register');
    const form = page.locator('form.register-form');
    await fillRegistration(form, { email, password });
    await form.locator('button[type=submit]').click();

    await expect(page).toHaveURL(/\/account/);
    await page.goto(paths.home);
    mkdirSync('tests/e2e/.auth', { recursive: true });
    writeFileSync('tests/e2e/.auth/credentials.json', JSON.stringify({ email, password }, null, 2));
    await page.context().storageState({ path: authFile });
});
