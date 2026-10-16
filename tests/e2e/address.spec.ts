import { test, expect, paths, isMobile, authFile, setTheme, freezeMotion, contrastIssues, registerCustomer, addToCart } from './support';

/**
 * Address manager (Shopware 6.7): the account address book and the checkout
 * "Addresses" modal share its utility-built markup (page/_account.scss).
 */
test.describe('Address manager', () => {
    test.use({ storageState: authFile });

    test('account: rounded cards, neutral default chip, search row fits', async ({ page }, testInfo) => {
        await page.goto('/account/address');
        const card = page.locator('.address-manager-select-address').first();
        await expect(card).toBeVisible();
        expect(parseFloat(await card.evaluate((e) => getComputedStyle(e).borderTopLeftRadius))).toBeGreaterThan(0);

        const chip = page.locator('.address-item-default-badge').first();
        // Core: text-bg-info (bright blue). Ours: a neutral tint.
        const bg = await chip.evaluate((e) => getComputedStyle(e).backgroundColor);
        const [r, g, b] = bg.match(/\d+/g)!.map(Number);
        expect(Math.max(r, g, b) - Math.min(r, g, b), `chip is hue-free: ${bg}`).toBeLessThan(12);

        const search = page.locator('.address-manager-list-search');
        const box = (await search.boundingBox())!;
        expect(box.width, 'search field is not squeezed').toBeGreaterThan(isMobile(testInfo) ? 250 : 400);
    });

    test('new address page: title clears the form card', async ({ page }) => {
        await page.goto('/account/address/create');
        const [title, card] = await Promise.all([
            page.locator('.account-address-form .account-welcome').boundingBox(),
            page.locator('.account-address-form .card').first().boundingBox(),
        ]);
        expect(card!.y - (title!.y + title!.height)).toBeGreaterThanOrEqual(16);
    });
});

// Its own customer, outside the shared-session block.
test.describe('Address manager — checkout', () => {
    test('checkout modal: compact title, segmented tabs, themed in light and dark', async ({ page, product }, testInfo) => {
        test.skip(isMobile(testInfo), 'one viewport is enough for the modal');

        await registerCustomer(page); // own cart: checkout.spec.ts empties the shared one
        await page.goto(product.path);
        await addToCart(page);

        for (const theme of ['light', 'dark'] as const) {
            await page.goto(paths.home);
            await setTheme(page, theme);
            await page.goto('/checkout/confirm');
            await page.locator('[data-address-manager]').first().click();
            const modal = page.locator('.modal.show .address-manager-modal');
            await expect(modal.locator('.address-manager-select-address').first()).toBeVisible();
            await freezeMotion(page);

            await expect(modal.locator('.modal-header h1')).toHaveCSS('font-size', '18px');
            const tabs = modal.locator('.address-manager-modal-tab-navigation-list');
            const [tabsBg, surface] = await tabs.evaluate((e) => [
                getComputedStyle(e).backgroundColor,
                getComputedStyle(e.closest('.modal-content')!).backgroundColor,
            ]);
            // Tinted track behind the active segment (core: bg-white, also in dark).
            expect(tabsBg).not.toBe(surface);
            expect(tabsBg).not.toBe('rgb(255, 255, 255)');

            expect(await contrastIssues(page), theme).toEqual([]);
        }
    });
});
