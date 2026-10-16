import { test, expect, paths, authFile, isMobile, freezeMotion, setTheme, contrastIssues } from './support';

/**
 * Optional plugin skins (scss/plugins/*). The theme does not depend on any
 * Kommandhub plugin: each test skips itself when its plugin's markup isn't on
 * the page, so the suite passes on a shop with or without them.
 */

test.describe('Plugin skins (optional)', () => {
    test('KmhSmsSW: dial-code phone field keeps rounded outer corners', async ({ page }) => {
        await page.goto('/account/register');
        const national = page.locator('.register-form .kmh-dial-code-phone__national').first();
        test.skip((await national.count()) === 0, 'KmhSmsSW not active');

        const radius = await national.evaluate((i) => getComputedStyle(i).borderTopRightRadius);
        expect(parseFloat(radius)).toBeGreaterThan(0);
    });

    test.describe('customer', () => {
        test.use({ storageState: authFile });

        test('Paystack/Flutterwave: bank details use the label/value pattern', async ({ page }, testInfo) => {
            await page.goto('/account');
            const content = page.locator('.bank-details-content').first();
            test.skip((await content.count()) === 0, 'no bank-data plugin active (or collection disabled)');

            const label = content.locator('strong').first();
            await expect(label).toHaveCSS('display', 'block');
            await expect(label).toHaveCSS('font-weight', '500');

            const cards = page.locator('.overview-bank-details');
            if (!isMobile(testInfo) && (await cards.count()) > 1) {
                const tops = await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
                expect(new Set(tops).size, 'two bank cards sit side by side').toBe(1);
            }
        });

        test('KmhClickAndPickSW: pickup controls match theme forms, light and dark', async ({ page }, testInfo) => {
            test.skip(isMobile(testInfo), 'checkout state is per customer — desktop only');

            await page.goto(paths.home);
            await setTheme(page, 'light');
            await page.goto('/checkout/cart');
            if (await page.locator('.line-item').count() === 0) {
                const link = await page.goto(paths.sidebarCategory).then(() =>
                    page.locator('.cms-listing-row .product-box a.product-name').first().getAttribute('href'));
                await page.goto(link!);
                await page.locator('.btn-buy').first().click();
                await expect(page.locator('.offcanvas.show')).toBeVisible();
            }

            await page.goto('/checkout/confirm');
            const pickup = page.locator('.shipping-method', { hasText: /pick-?up/i }).first();
            test.skip((await pickup.count()) === 0, 'KmhClickAndPickSW not active');

            if (!(await pickup.locator('input[type=radio]').isChecked())) {
                await pickup.locator('input[type=radio]').check();
                await page.waitForLoadState('networkidle');
            }
            const field = page.locator('[data-sales-channel-pickup-location]');
            await expect(field.locator('label').first()).toHaveCSS('font-size', '14px');
            const chevron = await page.locator('#pickup-location-location-field-id')
                .evaluate((s) => getComputedStyle(s).backgroundImage);
            expect(chevron).toContain('svg');

            for (const theme of ['light', 'dark'] as const) {
                await setTheme(page, theme);
                await page.reload();
                await freezeMotion(page);
                expect(await contrastIssues(page), theme).toEqual([]);
            }

            // Leave the customer on the default shipping method for other specs.
            await setTheme(page, 'light');
            await page.reload();
            await page.locator('.shipping-method input[type=radio]').first().check();
            await page.waitForLoadState('networkidle');
        });
    });
});
