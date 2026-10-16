import { test, expect, paths, isMobile } from './support';
import type { Page } from '@playwright/test';

/**
 * Slider controls and clipping (component/_slider.scss) and the top-bar
 * dropdown stacking (layout/_header.scss).
 */

// Every visible arrow: a round 40px button, icon centred, fully inside the
// clipping slider (core's "outside" arrows sit half past the edge).
async function arrowIssues(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const issues: string[] = [];
        document.querySelectorAll<HTMLElement>('.base-slider-controls-prev, .base-slider-controls-next').forEach((btn) => {
            const r = btn.getBoundingClientRect();
            const cs = getComputedStyle(btn);
            if (!r.width || cs.visibility === 'hidden' || +cs.opacity === 0) return;
            const name = [...btn.classList].find((c) => /-controls-(prev|next)$/.test(c) && !c.startsWith('base-'))!;

            if (Math.abs(r.width - r.height) > 1) issues.push(`${name}: ${r.width}x${r.height} not round`);
            const icon = btn.querySelector('.icon')?.getBoundingClientRect();
            if (icon && (Math.abs(icon.left + icon.width / 2 - (r.left + r.width / 2)) > 1.5
                || Math.abs(icon.top + icon.height / 2 - (r.top + r.height / 2)) > 1.5)) {
                issues.push(`${name}: icon off-centre`);
            }
            const clip = btn.closest('.base-slider, .gallery-slider-row');
            if (clip && !name.includes('thumbnails')) {
                const c = clip.getBoundingClientRect();
                if (r.left < c.left - 0.5 || r.right > c.right + 0.5) issues.push(`${name}: clipped by the slider`);
            }
        });
        return issues;
    });
}

// Distance from each visible card's bottom to its slider's clipping edge.
const cardClearance = (page: Page, scope: string) =>
    page.locator(`${scope} .product-slider`).evaluateAll((sliders) => sliders.flatMap((s) => {
        if (!s.getBoundingClientRect().height) return []; // inactive tab pane
        const bottom = s.getBoundingClientRect().bottom;
        return [...s.querySelectorAll('.tns-slide-active .product-box')].map((c) => Math.round(bottom - c.getBoundingClientRect().bottom));
    }));

test.describe('Sliders', () => {
    test('home: arrows are round, centred and unclipped', async ({ page }) => {
        await page.goto(paths.home);
        test.skip((await page.locator('.base-slider').count()) === 0, 'no sliders on the homepage');
        expect(await arrowIssues(page)).toEqual([]);
    });

    test('PDP: gallery and cross-selling arrows', async ({ page, product }) => {
        await page.goto(product.path);
        expect(await arrowIssues(page)).toEqual([]);
    });

    test('PDP cross-selling: product cards are not clipped', async ({ page, product }) => {
        await page.goto(product.path);
        const cs = page.locator('.product-detail-cross-selling');
        test.skip((await cs.count()) === 0, 'product has no cross-selling');
        await cs.scrollIntoViewIfNeeded();
        const clearance = await cardClearance(page, '.product-detail-cross-selling');
        expect(clearance.length).toBeGreaterThan(0);
        for (const px of clearance) expect(px, 'card bottom inside the slider').toBeGreaterThanOrEqual(1);
    });

    test('product slider leaves room for the card hover lift', async ({ page }) => {
        await page.goto(paths.home);
        const slider = page.locator('.cms-element-product-slider .product-slider').first();
        test.skip((await slider.count()) === 0, 'no product slider on the homepage');
        await slider.scrollIntoViewIfNeeded();
        await slider.locator('.tns-slide-active .product-box').first().hover();
        for (const px of await cardClearance(page, '.cms-element-product-slider')) {
            expect(px, 'shadow room below lifted card').toBeGreaterThanOrEqual(4);
        }
    });
});

test('top bar: currency menu opens above the header', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'top bar is desktop-only (phones use the off-canvas menu)');
    await page.goto(paths.home);
    const toggle = page.locator('.top-bar .currencies-menu .dropdown-toggle').first();
    test.skip((await toggle.count()) === 0, 'single-currency shop');
    await toggle.click();
    const items = page.locator('.top-bar .currencies-menu .dropdown-menu.show .dropdown-item');
    await expect(items.first()).toBeVisible();

    // Each item is the topmost element at its own centre: nothing in the
    // header row or nav paints over the menu.
    const covered = await items.evaluateAll((els) => els.filter((e) => {
        const r = e.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(hit && (hit === e || e.contains(hit)));
    }).map((e) => e.textContent!.trim()));
    expect(covered).toEqual([]);
});
