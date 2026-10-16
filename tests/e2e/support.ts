import { test as base, expect, type Page } from '@playwright/test';

/**
 * Storefront pages the suite visits. Defaults match the KmhDemoDataSW catalogue
 * on the local sandbox; override per environment with E2E_* variables.
 */
export const paths = {
    home: '/',
    /** Category whose CMS layout has a filter SIDEBAR and a 2-level breadcrumb. */
    sidebarCategory: process.env.E2E_SIDEBAR_CATEGORY ?? '/Fashion-Apparel/Men-s-Clothing/',
    /** Top-level category using the horizontal filter row (no sidebar). */
    toolbarCategory: process.env.E2E_TOOLBAR_CATEGORY ?? '/Clothing/',
    /** A purchasable product that sits in `sidebarCategory`. */
    product: process.env.E2E_PRODUCT ?? '/Delta-Oxford-Shirt/KMH-FLA-MENSA85-013',
    productName: process.env.E2E_PRODUCT_NAME ?? 'Delta Oxford Shirt',
    search: '/search?search=shirt',
};

/**
 * Every test starts with cookie consent already given (technically required
 * only) so the banner never covers controls.
 */
export const test = base.extend({
    context: async ({ context, baseURL }, use) => {
        const url = new URL(baseURL ?? 'http://localhost');
        await context.addCookies([{ name: 'cookie-preference', value: '1', domain: url.hostname, path: '/' }]);
        await use(context);
    },
});

export { expect };

export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
    await page.evaluate((t) => localStorage.setItem('kmh-theme', t), theme);
}

/** Freeze transitions so computed colours are final the moment we read them. */
export async function freezeMotion(page: Page): Promise<void> {
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
}

export interface ContrastIssue {
    element: string;
    text: string;
    ratio: number;
    fg: string;
    bg: string;
}

/**
 * WCAG 2.x text-contrast probe: every visible element with its own text must
 * reach 4.5:1 (3:1 for large text) against the nearest opaque background.
 * Disabled controls and visually-hidden text are exempt, as WCAG allows.
 */
export async function contrastIssues(page: Page): Promise<ContrastIssue[]> {
    return page.evaluate(() => {
        type RGBA = [number, number, number, number];

        // Handles rgb(), rgba() and the color(srgb …) form color-mix() resolves to.
        const parse = (c: string): RGBA => {
            const srgb = c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
            if (srgb) {
                return [+srgb[1] * 255, +srgb[2] * 255, +srgb[3] * 255, srgb[4] === undefined ? 1 : +srgb[4]];
            }
            const n = (c.match(/[\d.]+/g) ?? ['0', '0', '0', '0']).map(Number);
            return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
        };

        const lum = ([r, g, b]: RGBA): number => {
            const f = (v: number) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };

        const background = (el: Element | null): RGBA => {
            while (el) {
                const c = parse(getComputedStyle(el).backgroundColor);
                if (c[3] >= 0.5) return c;
                el = el.parentElement;
            }
            return [255, 255, 255, 1];
        };

        const issues: ContrastIssue[] = [];
        document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
            if (!el.offsetParent || el.closest('.sf-toolbar, [aria-hidden="true"], .visually-hidden, script, style')) return;
            if (el.closest(':disabled, .disabled, [aria-disabled="true"]')) return;
            const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
            if (!ownText) return;

            const cs = getComputedStyle(el);
            if (+cs.opacity === 0 || cs.visibility === 'hidden') return;
            const rect = el.getBoundingClientRect();
            if (rect.width < 2 || rect.height < 2) return;

            const fg = parse(cs.color);
            const bg = background(el);
            const l1 = lum(fg);
            const l2 = lum(bg);
            const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

            const size = parseFloat(cs.fontSize);
            const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
            if (ratio < (large ? 3 : 4.5)) {
                issues.push({
                    element: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')}`,
                    text: el.textContent!.trim().slice(0, 40),
                    ratio: Math.round(ratio * 100) / 100,
                    fg: cs.color,
                    bg: `rgb(${bg.slice(0, 3).map(Math.round).join(', ')})`,
                });
            }
        });
        return issues;
    });
}

/** Vertical centre of an element relative to another (px, 1 decimal). */
export async function centreWithin(page: Page, inner: string, outer: string): Promise<number[]> {
    return page.$$eval(
        outer,
        (outers, innerSel) =>
            outers
                .filter((o) => (o as HTMLElement).offsetParent)
                .map((o) => {
                    const i = o.querySelector(innerSel as string)!.getBoundingClientRect();
                    const r = o.getBoundingClientRect();
                    return Math.round((i.top + i.height / 2 - r.top) * 10) / 10;
                }),
        inner,
    );
}

/** True when every sampled point of the element is the topmost thing there. */
export async function isFullyVisible(page: Page, selector: string): Promise<boolean> {
    return page.$eval(selector, (el) => {
        const r = el.getBoundingClientRect();
        const pts: [number, number][] = [
            [r.left + 2, r.top + r.height / 2],
            [r.left + r.width / 2, r.top + 2],
            [r.left + r.width / 2, r.top + r.height / 2],
            [r.right - 2, r.top + r.height / 2],
        ];
        return pts.every(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return !!hit && (hit === el || el.contains(hit));
        });
    });
}

/**
 * Fills Shopware's registration fields (account register page and the
 * checkout register form share the ids). Billing country keeps its default.
 */
export async function fillRegistration(
    form: import('@playwright/test').Locator,
    { email, password }: { email: string; password?: string },
): Promise<void> {
    await form.locator('#billingAddress-personalFirstName').fill('E2E');
    await form.locator('#billingAddress-personalLastName').fill('Customer');
    await form.locator('#personalMail').fill(email);
    if (password) await form.locator('#personalPassword').fill(password);
    await form.locator('#billingAddress-AddressStreet').fill('Teststrasse 1');
    await form.locator('#billingAddressAddressZipcode').fill('10115');
    await form.locator('#billingAddressAddressCity').fill('Berlin');
}

/** Logged-in session saved by auth.setup.ts (git-ignored). */
export const authFile = 'tests/e2e/.auth/customer.json';

export const isMobile = (testInfo: { project: { name: string } }) => testInfo.project.name === 'mobile';
