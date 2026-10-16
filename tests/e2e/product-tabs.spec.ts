import { test, expect, isMobile, setTheme, freezeMotion, contrastIssues, paths } from './support';
import type { Page, TestInfo } from '@playwright/test';

/**
 * PDP description and reviews tabs (page/_product-tabs.scss). Phones open a
 * tab as an off-canvas copy of its content, so assertions are scoped to
 * whichever container is showing.
 */
async function openTab(page: Page, testInfo: TestInfo, tab: 'description' | 'review') {
    await page.locator(`.product-detail-tab-navigation-link.${tab}-tab`).first().click();
    const root = isMobile(testInfo)
        ? page.locator('.offcanvas.show')
        : page.locator('.product-detail-tabs .tab-pane.active').filter({ has: page.locator(`.product-detail-${tab}`) });
    await expect(root).toBeVisible();
    return root;
}

test.describe('Product detail tabs', () => {
    test('description: compact title, readable measure, unstriped properties', async ({ page, product }, testInfo) => {
        await page.goto(product.path);
        const root = await openTab(page, testInfo, 'description');

        await expect(root.locator('.product-detail-description-title')).toHaveCSS('font-size', '18px');
        const text = root.locator('.product-detail-description-text');
        if (await text.count()) {
            const { width, ch } = await text.evaluate((el) => ({
                width: el.getBoundingClientRect().width,
                ch: parseFloat(getComputedStyle(el).fontSize) * 0.6,
            }));
            expect(width / ch, 'body text stays near 70ch').toBeLessThan(90);
        }

        const cells = root.locator('.product-detail-properties-table .properties-row > *:first-child');
        if ((await cells.count()) > 1) {
            const fills = await cells.evaluateAll((els) => els.map((e) => getComputedStyle(e).boxShadow));
            expect(new Set(fills).size, 'no zebra stripes').toBe(1);
        }
    });

    test('reviews: score, aligned distribution, clean shop reply', async ({ page, product }, testInfo) => {
        await page.goto(product.path);
        const root = await openTab(page, testInfo, 'review');
        const widget = root.locator('.product-detail-review-widget');
        await expect(widget).toBeVisible();
        await expect(widget.locator('.product-detail-review-teaser-btn')).toBeVisible();

        test.skip((await root.locator('.product-detail-review-item').count()) === 0, 'product has no reviews');

        await expect(widget.locator('.kmh-review-score')).toHaveText(/^\d[.,]\d$/);

        const bars = await widget.locator('.product-detail-review-progressbar-container').evaluateAll((els) =>
            els.map((e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.left)}-${Math.round(r.right)}`; }));
        expect(bars.length).toBe(5);
        expect(new Set(bars).size, 'bars share one column').toBe(1);

        const item = root.locator('.product-detail-review-item').first();
        const date = item.locator('.product-detail-review-item-date');
        const stars = item.locator('.product-detail-review-item-points');
        const [d, s] = [await date.boundingBox(), await stars.boundingBox()];
        expect(Math.abs(d!.y + d!.height / 2 - (s!.y + s!.height / 2)), 'date shares the stars row').toBeLessThan(6);
        expect(d!.x).toBeGreaterThan(s!.x);

        const reply = root.locator('.product-detail-review-item-comment .blockquote').first();
        if (await reply.count()) {
            expect(await reply.evaluate((e) => getComputedStyle(e, '::before').content)).toBe('none');
            await expect(reply.locator('.blockquote-footer')).toHaveCSS('font-style', 'normal');
        }
    });

    test('reviews: CTA toggles the form / login panel', async ({ page, product }, testInfo) => {
        await page.goto(product.path);
        const root = await openTab(page, testInfo, 'review');
        await root.locator('.product-detail-review-teaser-btn').click();
        const panel = root.locator('#review-form .product-detail-review-login, #review-form .product-detail-review-form');
        await expect(panel).toBeVisible();
        await expect(root.locator('.product-detail-review-teaser-hide')).toBeVisible();
    });

    for (const theme of ['light', 'dark'] as const) {
        test(`reviews contrast — ${theme}`, async ({ page, product }, testInfo) => {
            await page.goto(paths.home);
            await setTheme(page, theme);
            await page.goto(product.path);
            await openTab(page, testInfo, 'review');
            await freezeMotion(page);
            expect(await contrastIssues(page)).toEqual([]);
        });
    }
});
