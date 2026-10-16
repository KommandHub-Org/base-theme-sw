import { test, expect, paths, setTheme, freezeMotion } from './support';
import type { Page } from '@playwright/test';

/**
 * Shopping Experiences blocks (component/_cms.scss) on the homepage seeded by
 * tests/e2e/fixtures/seed-cms-home.mjs (`make e2e-cms`). Each check skips
 * itself when its block isn't on the page, so a hand-built homepage works too.
 */
async function block(page: Page, type: string) {
    const loc = page.locator(`.cms-block-${type}`).first();
    test.skip((await loc.count()) === 0, `no ${type} block on the homepage`);
    await loc.scrollIntoViewIfNeeded();
    return loc;
}

// Distinct card heights among cards sharing a row (stacked phone layouts
// are free to differ). Rows are keyed by rounded top edge.
const rowHeights = (loc: ReturnType<Page['locator']>) =>
    loc.evaluateAll((els) => {
        const rows = new Map<number, Set<number>>();
        for (const e of els) {
            const r = e.getBoundingClientRect();
            const top = Math.round(r.top);
            rows.set(top, (rows.get(top) ?? new Set()).add(Math.round(r.height)));
        }
        return Math.max(...[...rows.values()].map((h) => h.size));
    });

test.describe('Shopping Experiences', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(paths.home);
        await freezeMotion(page);
    });

    test('no horizontal overflow', async ({ page }) => {
        const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        expect(scroll).toBeLessThanOrEqual(inner);
    });

    test('bubble images are circles', async ({ page }) => {
        const b = await block(page, 'image-bubble-row');
        for (const box of await b.locator('.cms-image-container').all()) {
            const r = (await box.boundingBox())!;
            expect(Math.abs(r.width - r.height)).toBeLessThan(2);
        }
    });

    test('highlight row: elevation, no baked white frame', async ({ page }) => {
        const b = await block(page, 'image-highlight-row');
        const el = b.locator('.cms-element-image').first();
        await expect(el).toHaveCSS('border-top-width', '0px');
        expect(await el.evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe('none');
    });

    test('product cards in a row share one height', async ({ page }) => {
        const b = await block(page, 'product-three-column');
        expect(await rowHeights(b.locator('.product-box'))).toBe(1);

        const slider = page.locator('.cms-element-product-slider').first();
        if (await slider.count()) {
            await slider.scrollIntoViewIfNeeded();
            expect(await rowHeights(slider.locator('.tns-item .product-box'))).toBe(1);
        }
    });

    test('text on image: light copy over a scrim', async ({ page }) => {
        const b = await block(page, 'text-on-image');
        test.skip(!(await b.evaluate((e) => e.classList.contains('bg-image'))), 'no background image set');
        await expect(b.locator('.cms-element-text h2, .cms-element-text h1').first()).toHaveCSS('color', 'rgb(255, 255, 255)');
        expect(await b.evaluate((e) => getComputedStyle(e, '::after').backgroundImage)).toContain('gradient');
    });

    for (const theme of ['light', 'dark'] as const) {
        test(`video consent card follows the theme — ${theme}`, async ({ page }) => {
            await setTheme(page, theme);
            await page.reload();
            const b = await block(page, 'youtube-video');
            const card = b.locator('.cms-element-youtube-video__backdrop > div');
            test.skip((await card.count()) === 0, 'video needs no confirmation (or consent given)');
            const [bg, surface] = await card.evaluate((e) => [
                getComputedStyle(e).backgroundColor,
                getComputedStyle(document.body).getPropertyValue('--color-surface'),
            ]);
            expect(bg).not.toBe('rgba(255, 255, 255, 0.9)'); // core's baked backdrop
            expect(surface.trim()).not.toBe('');
        });
    }

    test('opt-in classes: kmh-cms-surface and kmh-cms-cards', async ({ page }) => {
        const surface = page.locator('.cms-block.kmh-cms-surface').first();
        const cards = page.locator('.cms-block.kmh-cms-cards').first();
        test.skip((await surface.count()) + (await cards.count()) === 0, 'no opt-in classes used');

        if (await surface.count()) {
            expect(parseFloat(await surface.evaluate((e) => getComputedStyle(e).paddingTop))).toBeGreaterThan(0);
            expect(parseFloat(await surface.evaluate((e) => getComputedStyle(e).borderTopLeftRadius))).toBeGreaterThan(0);
        }
        if (await cards.count()) {
            const col = cards.locator('.cms-row > [class*="col"] > *').first();
            await expect(col).toHaveCSS('border-top-style', 'solid');
        }
    });
});
