import { test, expect, paths, setTheme, freezeMotion, contrastIssues, authFile } from './support';

/**
 * Every visible text node meets WCAG AA contrast (4.5:1, 3:1 for large text)
 * in both colour schemes — the guard for core colours that are baked at
 * compile time and escape the token layer (see base/_core-colors.scss).
 */
// 'product' is resolved per worker (see support.ts).
const guestPages = [paths.home, paths.sidebarCategory, paths.toolbarCategory, 'product', paths.search, '/account/login'];
const customerPages = ['/account', '/account/profile', '/account/address', '/account/order', '/checkout/cart'];

for (const theme of ['light', 'dark'] as const) {
    test.describe(`Contrast — ${theme}`, () => {
        for (const path of guestPages) {
            test(`guest ${path}`, async ({ page, product }) => {
                await page.goto(paths.home);
                await setTheme(page, theme);
                await page.goto(path === 'product' ? product.path : path);
                await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
                await freezeMotion(page);
                expect(await contrastIssues(page)).toEqual([]);
            });
        }

        // Floating surfaces only exist once opened — sweep them open, since
        // Bootstrap bakes their colours separately from the page.
        test('guest: open account menu', async ({ page }, testInfo) => {
            test.skip(testInfo.project.name === 'mobile', 'phones open the account menu as an off-canvas page');
            await page.goto(paths.home);
            await setTheme(page, theme);
            await page.goto(paths.home);
            await freezeMotion(page);
            await page.locator('.account-menu-btn').click();
            const menu = page.locator('.account-menu-dropdown.show');
            await expect(menu).toBeVisible();
            expect(await contrastIssues(page)).toEqual([]);
        });

        test.describe('customer', () => {
            test.use({ storageState: authFile });

            test('customer: open account menu', async ({ page }, testInfo) => {
                test.skip(testInfo.project.name === 'mobile', 'phones open the account menu as an off-canvas page');
                await page.goto(paths.home);
                await setTheme(page, theme);
                await page.goto(paths.home);
                await freezeMotion(page);
                await page.locator('.account-menu-btn').click();
                const menu = page.locator('.account-menu-dropdown.show');
                await expect(menu.locator('.account-aside-item').first()).toBeVisible();
                expect(await contrastIssues(page)).toEqual([]);
            });

            for (const path of customerPages) {
                test(`customer ${path}`, async ({ page }) => {
                    await page.goto(paths.home);
                    await setTheme(page, theme);
                    await page.goto(path);
                    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
                    await freezeMotion(page);
                    expect(await contrastIssues(page)).toEqual([]);
                });
            }
        });
    });
}
