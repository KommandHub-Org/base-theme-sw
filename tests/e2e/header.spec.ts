import { test, expect, paths, centreWithin, isMobile, freezeMotion } from './support';

test.describe('Header', () => {
    test('action icons share one vertical centre and size', async ({ page }) => {
        await page.goto(paths.sidebarCategory);

        const centres = await centreWithin(page, 'svg', '.header-actions-btn');
        expect(centres.length).toBeGreaterThanOrEqual(4);
        for (const c of centres) expect(Math.abs(c - centres[0])).toBeLessThanOrEqual(1);

        const sizes = await page.$$eval('.header-actions-btn svg', (svgs) =>
            svgs.filter((s) => (s as SVGElement).getBoundingClientRect().width > 0)
                .map((s) => Math.round(s.getBoundingClientRect().width)));
        expect(new Set(sizes).size).toBe(1);
    });

    test('page never scrolls sideways', async ({ page }) => {
        for (const path of [paths.home, paths.sidebarCategory, paths.product]) {
            await page.goto(path);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(overflow, path).toBeLessThanOrEqual(0);
        }
    });

    test('phone header fits on one row', async ({ page }, testInfo) => {
        test.skip(!isMobile(testInfo), 'phone layout only');
        await page.goto(paths.home);
        const row = await page.locator('.header-row').boundingBox();
        expect(row!.height).toBeLessThanOrEqual(72);
        const tops = await page.$$eval('.header-actions-btn', (bs) =>
            bs.filter((b) => (b as HTMLElement).offsetParent).map((b) => Math.round(b.getBoundingClientRect().top)));
        expect(new Set(tops).size).toBe(1);
    });

    test('top bar band spans the full viewport and is 32px tall', async ({ page }, testInfo) => {
        test.skip(isMobile(testInfo), 'top bar is desktop-only (core d-lg-block)');
        await page.goto(paths.home);
        const bar = page.locator('.top-bar');
        await expect(bar).toBeVisible();
        expect((await bar.boundingBox())!.height).toBe(32);

        // The band is a ::before on .top-bar; hit-testing the far-left gutter
        // (outside the container) must land on it.
        const hit = await page.evaluate(() => {
            const r = document.querySelector('.top-bar')!.getBoundingClientRect();
            return document.elementFromPoint(2, r.top + r.height / 2)?.classList.contains('top-bar');
        });
        expect(hit).toBe(true);
    });

    test('active main-nav section shows the indicator', async ({ page }, testInfo) => {
        test.skip(isMobile(testInfo), 'main nav is desktop-only');
        await page.goto(paths.sidebarCategory);
        await freezeMotion(page);
        const active = page.locator('.main-navigation-link.active').first();
        await expect(active).toBeVisible();
        const transform = await active.evaluate((a) => getComputedStyle(a, '::after').transform);
        expect(transform).toMatch(/matrix\(1, 0, 0, 1/);
    });

    test('dark-mode toggle switches, persists and switches back', async ({ page }) => {
        await page.goto(paths.home);
        const toggle = page.locator('[data-kmh-theme-toggle]');
        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-label', /dark mode/i);

        await toggle.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await page.goto(paths.sidebarCategory);
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

        await page.locator('[data-kmh-theme-toggle]').click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
        expect(await page.evaluate(() => localStorage.getItem('kmh-theme'))).toBe('light');
    });
});

test.describe('Breadcrumb', () => {
    test('category: parents are links, current page is plain text', async ({ page }) => {
        await page.goto(paths.sidebarCategory);
        const crumbs = page.locator('ol.breadcrumb > *');
        await expect(crumbs).toHaveCount(2);
        expect(await page.$$eval('ol.breadcrumb > *', (els) => els.every((e) => e.tagName === 'LI'))).toBe(true);

        const current = page.locator('ol.breadcrumb [aria-current="page"]');
        await expect(current).toHaveCount(1);
        await expect(current.locator('a')).toHaveCount(0);
        await expect(crumbs.first().locator('a.breadcrumb-link')).toHaveCount(1);
    });

    test('product: categories are links and the product is the current crumb', async ({ page }) => {
        await page.goto(paths.product);
        const current = page.locator('ol.breadcrumb [aria-current="page"]');
        await expect(current).toHaveCount(1);
        await expect(current).toHaveText(paths.productName);
        await expect(page.locator('ol.breadcrumb a.breadcrumb-link')).toHaveCount(2);
    });

    test('top-level category hides a single-item trail', async ({ page }) => {
        await page.goto(paths.toolbarCategory);
        await expect(page.locator('.cms-breadcrumb')).toBeHidden();
    });

    test('phone collapses the trail to … / parent / current', async ({ page }, testInfo) => {
        test.skip(!isMobile(testInfo), 'phone layout only');
        await page.goto(paths.product);
        await expect(page.locator('.breadcrumb-item').first()).toBeHidden();
        const before = await page.locator('.breadcrumb-item').nth(1)
            .evaluate((li) => getComputedStyle(li, '::before').content);
        expect(before).toContain('…');
    });

    test('keyboard focus on a crumb shows the focus ring', async ({ page }, testInfo) => {
        test.skip(isMobile(testInfo), 'keyboard test on desktop');
        await page.goto(paths.product);
        await page.locator('.cms-breadcrumb').click({ position: { x: 1, y: 1 } });
        await page.keyboard.press('Tab');
        const focused = page.locator('.breadcrumb-link:focus-visible');
        await expect(focused).toHaveCount(1);
        expect(await focused.evaluate((a) => getComputedStyle(a).outlineStyle)).toBe('solid');
    });
});

test.describe('Page headers', () => {
    const titleFont = async (page: import('@playwright/test').Page, selector: string) =>
        page.locator(selector).first().evaluate((h) => {
            const cs = getComputedStyle(h);
            return { weight: cs.fontWeight, align: cs.textAlign };
        });

    test('product, category and search titles share one style', async ({ page }) => {
        const seen: string[] = [];
        for (const [path, selector] of [
            [paths.product, '.product-detail-name'],
            [paths.sidebarCategory, '.cms-element-text h1'],
            [paths.search, '.search-headline'],
        ]) {
            await page.goto(path);
            const f = await titleFont(page, selector);
            expect(f.align, path).toMatch(/left|start/);
            seen.push(f.weight);
        }
        expect(new Set(seen)).toEqual(new Set(['600']));
    });
});
