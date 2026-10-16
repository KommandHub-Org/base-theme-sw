import { test, expect, paths, isMobile, isFullyVisible, authFile } from './support';

/**
 * Wishlist state is per customer and both projects share the run's customer,
 * so the state-changing flow runs on desktop only.
 */
test.use({ storageState: authFile });

test('wishlist: red heart, visible header counter, consistent page', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'mutates the shared customer — desktop only');

    await page.goto(paths.product);
    const action = page.locator('.product-detail-wishlist .product-wishlist-action, .product-wishlist-action').first();
    if (await action.evaluate((b) => b.classList.contains('product-wishlist-added'))) {
        await action.click();
        await expect(action).toHaveClass(/product-wishlist-not-added/);
    }

    await action.click();
    await expect(action).toHaveClass(/product-wishlist-added/);
    const heart = action.locator('.icon-wishlist-added');
    await expect(heart).toHaveCSS('color', 'rgb(220, 38, 38)');

    const badge = page.locator('.header-wishlist-badge');
    await expect(badge).toHaveText(/\d+/);
    expect(await isFullyVisible(page, '.header-wishlist-badge')).toBe(true);

    await page.goto('/wishlist');
    const title = page.locator('.wishlist-headline');
    await expect(title).toHaveCSS('font-weight', '600');
    // Left-aligned like every other page title: text starts at the content edge.
    const offset = await page.evaluate(() => {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('.wishlist-headline')!);
        const text = range.getBoundingClientRect().left;
        const card = document.querySelector('.product-box')!.getBoundingClientRect().left;
        return Math.abs(text - card);
    });
    expect(offset).toBeLessThanOrEqual(4);
    await expect(page.locator('.product-box')).not.toHaveCount(0);
    // The empty sorting/pagination row is hidden on a one-page wishlist.
    await expect(page.locator('.cms-element-product-listing-actions')).toBeHidden();

    // Clean up: remove the product again.
    await page.goto(paths.product);
    await page.locator('.product-wishlist-action').first().click();
    await expect(page.locator('.product-wishlist-action').first()).toHaveClass(/product-wishlist-not-added/);
});
