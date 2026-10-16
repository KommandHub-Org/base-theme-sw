import { test, expect, paths, isMobile, authFile } from './support';

test.describe('Checkout — guest', () => {
    test('add to cart opens the cart drawer with a success notice', async ({ page }) => {
        await page.goto(paths.product);
        await page.locator('.btn-buy').first().click();

        const drawer = page.locator('.offcanvas.show');
        await expect(drawer).toBeVisible();
        const notice = drawer.locator('.alert-success');
        await expect(notice).toBeVisible();
        // Status tint, not the neutral surface.
        expect(await notice.evaluate((a) => getComputedStyle(a).backgroundColor)).not.toBe('rgb(255, 255, 255)');
        await expect(drawer.locator('.line-item')).not.toHaveCount(0);
    });

    test('cart page: title with muted item counter, summary and checkout CTA', async ({ page }) => {
        await page.goto(paths.product);
        await page.locator('.btn-buy').first().click();
        await expect(page.locator('.offcanvas.show')).toBeVisible();

        await page.goto('/checkout/cart');
        const title = page.locator('.cart-main-header');
        await expect(title).toBeVisible();
        await expect(title).toHaveCSS('font-weight', '600');
        const counter = page.locator('.cart-main-header-item-counter');
        await expect(counter).toHaveCSS('font-weight', '400');
        await expect(page.locator('.checkout-aside-summary')).toBeVisible();
        await expect(page.locator('a[href*="/checkout/confirm"], .begin-checkout-btn').first()).toBeVisible();
    });

    test('checkout register form flags missing fields', async ({ page }) => {
        await page.goto(paths.product);
        await page.locator('.btn-buy').first().click();
        await expect(page.locator('.offcanvas.show')).toBeVisible();

        await page.goto('/checkout/register');
        const form = page.locator('form.register-form');
        await form.locator('button[type=submit]').click();

        const invalid = form.locator('.form-control:invalid, .form-control.is-invalid').first();
        await expect(invalid).toBeVisible();
        await expect(invalid).toHaveCSS('border-color', 'rgb(220, 38, 38)'); // retries past the transition
    });
});

test.describe('Checkout — customer places an order', () => {
    test.use({ storageState: authFile });

    test('cart → confirm → finish → order history', async ({ page }, testInfo) => {
        test.skip(isMobile(testInfo), 'places a real order — run once per suite');

        await page.goto(paths.product);
        await page.locator('.btn-buy').first().click();
        await expect(page.locator('.offcanvas.show')).toBeVisible();

        await page.goto('/checkout/confirm');
        await expect(page.locator('.confirm-main-header')).toBeVisible();

        // Selected payment / shipping method reads as an ink ring.
        const selected = page.locator('.payment-method:has(input:checked)').first();
        expect(await selected.evaluate((m) => getComputedStyle(m).boxShadow)).toContain('inset');

        await page.locator('input[name="tos"]').check();
        await page.locator('#confirmFormSubmit').click();

        await expect(page).toHaveURL(/\/checkout\/finish/, { timeout: 30_000 });
        await expect(page.locator('.finish-header')).toBeVisible();
        const orderNumber = (await page.locator('.finish-ordernumber').textContent())!.match(/\d+/)![0];

        await page.goto('/account/order');
        const order = page.locator('.order-table', { hasText: orderNumber });
        await expect(order).toBeVisible();
        const badge = order.locator('.order-item-status-badge').first();
        await expect(badge).toBeVisible();
        // "Open" maps to the info tint.
        expect(await badge.evaluate((b) => getComputedStyle(b).color)).not.toBe('rgb(255, 255, 255)');

        await order.locator('.order-hide-btn').click();
        await expect(order.locator('.order-detail-content')).toBeVisible();
    });
});

test.describe('Account', () => {
    test.use({ storageState: authFile });

    test('pages share the page-header pattern and the sidebar marks the current page', async ({ page }, testInfo) => {
        for (const [path, label] of [
            ['/account', 'Overview'],
            ['/account/profile', 'Your profile'],
            ['/account/address', 'Addresses'],
            ['/account/order', 'Orders'],
        ]) {
            await page.goto(path);
            const h1 = page.locator('main h1, .account-content-main h1').first();
            await expect(h1, path).toHaveCSS('font-weight', '600');
            await expect(h1.locator('xpath=following-sibling::p[1]'), path).toBeVisible();

            if (!isMobile(testInfo)) {
                const current = page.locator('.account-aside .account-aside-item.is-active');
                await expect(current, path).toHaveText(label);
            }
        }
    });
});
