import { test, expect, paths, isMobile } from './support';

test.describe('Listing — horizontal filter row (no sidebar)', () => {
    test('filter controls form one even row under the title', async ({ page }, testInfo) => {
        test.skip(isMobile(testInfo), 'phone uses the filter sheet');
        await page.goto(paths.toolbarCategory);

        const boxes = await page.$$eval(
            '.filter-panel:not(.is--sidebar) .filter-panel-items-container > .filter-panel-item',
            (items) => items.map((i) => {
                const r = i.getBoundingClientRect();
                return { top: Math.round(r.top), h: Math.round(r.height) };
            }),
        );
        expect(boxes.length).toBeGreaterThan(2);
        expect(new Set(boxes.map((b) => b.h))).toEqual(new Set([40]));
        expect(new Set(boxes.map((b) => b.top)).size).toBe(1);

        // 24px between the page title and the filter row.
        const gap = await page.evaluate(() => {
            const h1 = document.querySelector('.cms-element-text h1')!.getBoundingClientRect();
            const row = document.querySelector('.filter-panel-items-container')!.getBoundingClientRect();
            return Math.round(row.top - h1.bottom);
        });
        expect(gap).toBeGreaterThanOrEqual(20);
        expect(gap).toBeLessThanOrEqual(32);
    });

    test('boolean filter toggles, shows its ring and an active chip', async ({ page }, testInfo) => {
        test.skip(isMobile(testInfo), 'phone uses the filter sheet');
        await page.goto(paths.toolbarCategory);
        const bool = page.locator('.filter-panel:not(.is--sidebar) .filter-boolean').first();
        await bool.locator('label').click();

        await expect(page).toHaveURL(/shipping-free=1/);
        await expect(page.locator('.filter-active').first()).toBeVisible();
        const ring = await page.locator('.filter-boolean').first()
            .evaluate((b) => getComputedStyle(b).boxShadow);
        expect(ring).toContain('inset');
    });

    test('phone: filter sheet stacks the controls full width', async ({ page }, testInfo) => {
        test.skip(!isMobile(testInfo), 'phone layout only');
        await page.goto(paths.toolbarCategory);
        await page.locator('.filter-panel-wrapper-toggle').click();
        const sheet = page.locator('.offcanvas.show .filter-panel');
        await expect(sheet).toBeVisible();

        const widths = await sheet.locator('.filter-panel-item-toggle, .filter-boolean')
            .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
        expect(widths.length).toBeGreaterThan(2);
        expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    });
});

test.describe('Listing — sidebar layout', () => {
    test('current category is highlighted in the sidebar nav', async ({ page }, testInfo) => {
        test.skip(isMobile(testInfo), 'sidebar collapses on phones');
        await page.goto(paths.sidebarCategory);
        const active = page.locator('.category-navigation-link.is-active');
        await expect(active).toHaveCount(1);
        const bg = await active.evaluate((a) => getComputedStyle(a).backgroundColor);
        expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('product cards in a row align their actions and images', async ({ page }) => {
        await page.goto(paths.sidebarCategory);
        const rows = await page.$$eval('.cms-listing-row .product-box', (boxes) => {
            const byTop = new Map<number, { img: number; action: number }[]>();
            for (const b of boxes) {
                const top = Math.round(b.getBoundingClientRect().top);
                const img = b.querySelector('.product-image-wrapper')!.getBoundingClientRect().height;
                const action = b.querySelector('.product-action')?.getBoundingClientRect().bottom ?? 0;
                byTop.set(top, [...(byTop.get(top) ?? []), { img: Math.round(img), action: Math.round(action) }]);
            }
            return [...byTop.values()].filter((r) => r.length > 1);
        });
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
            expect(new Set(row.map((c) => c.img)).size).toBe(1);
            expect(new Set(row.map((c) => c.action)).size).toBe(1);
        }
    });

    test('pagination marks the current page and navigates', async ({ page }) => {
        await page.goto(paths.sidebarCategory);
        const pagination = page.locator('.pagination').first();
        test.skip(!(await pagination.isVisible()), 'category fits on one page');
        await expect(pagination.locator('.page-item.active')).toHaveCount(1);
        await pagination.locator('.page-item:not(.active):not(.disabled) .page-link').filter({ hasText: '2' }).click();
        await expect(page).toHaveURL(/[?&]p=2/);
        await expect(page.locator('.pagination').first().locator('.page-item.active')).toContainText('2');
    });
});
