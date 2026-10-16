# KmhBaseTheme

A modern, premium base theme for Shopware 6.7 in a contemporary product-UI
style (think Linear / Vercel / Stripe) — a reusable foundation for storefront
projects, not a single-store skin. The interface is **neutral monochrome**:
hierarchy and interaction come from tone, typography, spacing and hairline
borders. **Hue is reserved for meaning** — status (success / warning / danger /
info) and rating stars — so the few coloured things carry information.

## Design system

All visual decisions flow from one token layer, so brands customise through
theme config / SCSS variables rather than editing components. Bootstrap stays
the foundation; its variables and `--bs-*` custom properties are re-pointed at
the tokens instead of being fought with per-selector overrides.

```
app/storefront/src/scss/
  overrides.scss          ← loads BEFORE @Storefront: Bootstrap & Shopware
                            !default variables (type scale, control sizes,
                            radii, surfaces) → tokens
  base.scss               ← loads AFTER @Storefront: token CSS vars + layers
  abstract/
    _palette.scss         ← neutral scale (mono-0…mono-1000), semantic aliases,
                            status hues (+ derived -text / -bg / -border)
    _config.scss          ← theme.json config → radius scale, widths, spacing
    _tokens-css.scss      ← ALL tokens as :root custom properties + dark mode
    _mixins.scss          ← focus-ring, elevation, motion-safe helpers
  base/                   ← reboot/typography & links, focus, buttons, forms,
                            core-colour bridge (dark mode)
  component/              ← cards/lists/tables, overlays (dropdown, modal,
                            tooltip), alerts & badges, listing, product card
  layout/                 ← header & nav, off-canvas, footer, chrome, container
  page/                   ← PDP, checkout, account
```

### Tokens (`_tokens-css.scss`)

| Group | Tokens |
|---|---|
| Colour | `--color-text-*`, `--color-bg-*`, `--color-surface`, `--color-border(-subtle/-strong/-input)`, `--color-action*`, `--color-disabled-*`, `--color-focus-ring` |
| Status | `--color-{success,warning,danger,info}` + `-text` (AA), `-bg` (tint), `-border` |
| Type | `--font-size-2xs … 3xl` (11 → 34px fluid), `--font-weight-*`, `--line-height-*`, `--tracking-*` |
| Space | `--space-1 … 16` (4px grid) |
| Controls | `--control-height-sm/-/-lg` (32 / 40 / 46px) |
| Radius | `--radius-sm` (chips, menu rows) · `--radius` (controls, 8px) · `--radius-lg` (cards, 12px) · `--radius-xl` (dialogs, 16px) · `--radius-full` |
| Elevation | `--shadow-xs/sm/md/lg`, `--focus-halo` |
| Motion | `--ease-standard`, `--transition-fast/base` |

Dark mode is the same names re-valued under `[data-theme="dark"]`.

### Principles

- **Typography** — Inter (self-hosted by core). Semibold headings with tight
  tracking; 16px/1.6 body; 14px medium for labels, nav and controls; muted
  text stays ≥ 4.5:1.
- **Links** — no default underline. Chrome links (nav, footer, cards,
  breadcrumbs) read by position. Links inside running text keep a hairline
  underline because they share the text colour (WCAG 1.4.1). `.btn-link`
  looks like a link.
- **Navigation** — muted at rest → ink on hover with a tinted pill; the active
  section (and the one whose flyout is open) gets a 2px ink indicator on the
  bar's hairline. Account, category and drawer navs use the same inset
  rounded-row idiom.
- **Buttons** — primary (ink), secondary (surface + hairline), outline, ghost
  (`.btn-light`), link, destructive (`.btn-danger`, `.btn-outline-danger`);
  disabled via tokens (not opacity); loading keeps the button's look and shows
  core's spinner in `currentColor`.
- **Forms** — 40px, 16px text (no iOS zoom), borders kept at 3:1 (WCAG 1.4.11),
  ink border + soft halo on focus, status-red invalid state + message.
- **Breadcrumb → page header → content** — 13px muted trail with `/`
  separators (current page in ink, plain text, `aria-current`; on product
  pages the product is the current crumb), 12px to a semibold title, 8px to an
  optional description, 32px to content. Phones collapse the trail to
  `… / parent / current`. Reuse the `.page-header` component
  (`component/_page-header.scss` documents the markup: title, description,
  meta badges, actions, tabs, toolbar); core headers are mapped onto the same
  mixins.
- **Surfaces** — hairline border + xs shadow for cards; lg shadow for anything
  floating (dropdowns, modals, search suggest, flyout).
- **Focus** — one solid 2px ring, `:focus-visible` only, never suppressed.
- **Reduced motion** — global `prefers-reduced-motion` safety net.
- **Ratings** — `--color-rating` (amber, theme config *Rating stars*).

## Theme configuration

Beyond the standard Shopware colour/logo/typography fields (neutral defaults;
*Status colours* drive the status system), two extra blocks expose base-theme
controls:

- **Layout** — container width (fixed/fluid), content max-width, section spacing,
  sticky header, top bar, breadcrumb visibility, navigation style, footer columns.
- **Components** — corner radius, primary button style, card style, product image
  ratio, product-grid columns per breakpoint,
  dark-mode toggle.

### Dark mode

*Dark mode toggle* (on by default) adds a moon button next to the account and
cart icons, at every breakpoint. It's implemented inline (a no-flash `<head>`
script + a small wiring script, both gated on the setting) — no webpack build
required. The visitor's choice is stored in `localStorage` and the whole palette
flips via `[data-theme="dark"]` on `<html>`. Turn the setting off to ship zero
extra markup/script.

Core Shopware bakes some colours in at compile time; `base/_core-colors.scss`
re-points those elements at the tokens so they follow the flip too. When a new
core element shows up dark-on-dark, add it there.

Config fields are consumed in SCSS (`$kmh-*`) and, in later phases, in Twig via
`theme_config('kmh-...')`.

## Branding assets

Master artwork lives in `src/Resources/config/` (`plugin.png` = icon only,
`kommandhub.png` = logo + wordmark). Derived, web-optimised copies are generated
into `src/Resources/app/storefront/src/assets/`:

| Asset | Source | Used for | Size |
|---|---|---|---|
| `config/plugin.png` | — | Plugin-manager icon (`composer.json` → `extra.plugin-icon`) | 256² |
| `.../logo/favicon.png` | plugin.png | Favicon (`sw-logo-favicon`) | 96² |
| `.../logo/kommandhub-logo.png` | kommandhub.png | Storefront logo — desktop/tablet/mobile + share (one shared file) | 600×144 |
| `.../preview.png` | kommandhub.png | Theme preview card (`theme.json` → `previewMedia`) | 1530×1000 |

The logo is monochrome (pure black), so dark mode inverts it via CSS
(`[data-theme="dark"] .header-logo-main-img`) rather than shipping a second file.
Merchants override any of these through the theme settings.

## Fonts

Performance/privacy first: **no Google Fonts CDN**. Uses the Inter variable font
that Shopware core already self-hosts (`@Storefront` assets), falling back to the
system stack. To use another font, add an `@font-face` in `base.scss` and point
`sw-font-family-base` / `sw-font-family-headline` at it.

## Kommandhub plugin skins (optional)

The theme styles the storefront UI of the Kommandhub plugins so they match the
design system — and depends on none of them. Every rule in `scss/plugins/`
targets the plugin's own markup, so with a plugin absent nothing matches; no
Twig of the theme references a plugin.

| Plugin | What the theme adjusts |
|---|---|
| KmhClickAndPickSW | pickup labels and selects at checkout; the pickup card's inline styles (gradient, fixed colours, Segoe UI) replaced with tokens — light + dark |
| KmhPaystackSW / KmhFlutterwaveSW | bank details as label/value pairs; with both active, the two account-overview cards sit side by side |
| KmhSmsSW | dial-code + number field keeps its rounded outer corners |
| KmhAfricaCommerceCoreSW | none needed — its address fields use core form markup |

Generic fix that also serves plugins: any `<select class="form-control">` gets
the same chevron as `.form-select`. `tests/e2e/plugins.spec.ts` checks each skin
and skips itself when the plugin isn't on the shop.

## End-to-end tests

A Playwright suite in `tests/e2e/` drives a live storefront that has the theme
assigned — desktop (1440×900) and phone (Pixel 7) — and checks behaviour the
theme is responsible for:

| Spec | Covers |
|---|---|
| `header.spec.ts` | header icons share one centre/size, no sideways scroll, one-row phone header, full-bleed 32px top bar, active nav indicator, dark-mode toggle (switch, persist, revert); breadcrumb semantics (current page is text + `aria-current`, product crumb on PDP, single-item trail hidden, phone collapse, keyboard focus ring); page titles share one style |
| `listing.spec.ts` | horizontal filter row (even 40px row, 24px under title), boolean filter ring + active chip, phone filter sheet stacks full width; sidebar active category, card rows align, pagination |
| `wishlist.spec.ts` | red heart when saved, header counter fully visible, wishlist page header + no empty toolbar |
| `checkout.spec.ts` | cart drawer + success tint, cart page title/counter, register-form validation colour; logged-in customer places an order → finish page → order history with status chip; account pages share the page-header pattern |
| `theme.spec.ts` | WCAG AA text contrast (4.5:1 / 3:1 large) on guest and customer pages and the open account menu, light and dark |
| `plugins.spec.ts` | optional plugin skins (pickup controls + contrast, bank details layout, dial-code field); each skips when its plugin is absent |

Run it against the plugin's own stack (recommended — see *Development*):

```bash
make up            # once: build + start the stack, composer-install theme + demo data
make e2e-setup     # activate, seed demo catalogue, map domains to :8100, assign theme
make e2e-install   # once, on the host: npm deps + Chromium
make e2e           # run the suite; `make e2e-report` opens the HTML report
```

…or against any storefront that has the theme assigned:

```bash
E2E_BASE_URL=https://staging.example.com npx playwright test
```

Notes:
- Page paths default to the KmhDemoDataSW catalogue; override with
  `E2E_SIDEBAR_CATEGORY`, `E2E_TOOLBAR_CATEGORY`, `E2E_SEARCH`. The product the
  suite opens is the first one listed in the sidebar category, unless
  `E2E_PRODUCT` and `E2E_PRODUCT_NAME` are both set (see `tests/e2e/support.ts`).
- Each run registers one throwaway customer (`kmh-e2e-…@example.com`) and
  places **one real order** (cash on delivery) — run it against dev/staging,
  not production. Its session and credentials stay in the git-ignored
  `tests/e2e/.auth/`.
- Cookie consent is pre-set, so the banner never covers controls.
- Order- and wishlist-changing tests run on the desktop project only (both
  projects share the run's customer); skipped tests are these plus
  device-specific checks.

## Development

The theme carries its own dockware stack (Shopware 6.7.8 + shopware-cli),
published on `http://localhost:8100` so it can run beside other shops.

| Command | What it does |
|---|---|
| `make up` / `make down` | start (and composer-install the theme + KmhDemoDataSW) / tear down |
| `make check` | php-cs-fixer dry-run + PHPStan + PHPUnit |
| `make test` · `make analyse` · `make cs-fix` | the individual steps |
| `make e2e-setup` · `make e2e` | prepare the storefront and run Playwright |
| `make validate-plugin` | shopware-cli store-compliance check |
| `make shell` | shell in the container (`bin/console theme:compile` after SCSS edits) |

CI (`.github/workflows/php.yml`) runs the PHP checks with coverage, then the
Playwright suite in the same stack.

## Build

```bash
bin/console theme:compile
# or, for local asset rebuilds:
./bin/build-storefront.sh
```

Activate the theme in Admin → Sales Channel → Theme, then assign *KmhBaseTheme*.

## Coverage

The storefront is styled end-to-end. All work is token-driven SCSS; the Twig
overrides are small and block-preserving (sticky-header wrapper, header actions
for the theme toggle, dark logo, top-bar gate, breadcrumb (setting gate,
non-link current crumb, product crumb) and the PDP breadcrumb include).

| Area | Files |
|---|---|
| Design system, base layer | `abstract/*`, `base/*` |
| Header, nav, search, actions | `layout/_header.scss`, `views/…/header.html.twig`, `header/header.html.twig`, `header/logo.html.twig`, `top-bar.html.twig` |
| Listing + product cards | `component/_product-card.scss` |
| Product detail (PDP) | `page/_product-detail.scss` |
| Breadcrumb + page headers | `component/_page-header.scss`, `views/…/breadcrumb.html.twig`, `views/…/page/content/product-detail.html.twig` |
| Filters, pagination, category nav | `component/_listing.scss` |
| Off-canvas nav + cart, line items | `layout/_offcanvas.scss`, `component/_line-item.scss` |
| Checkout (cart/confirm/finish/register) | `page/_checkout.scss` |
| Alerts, badges, order status | `component/_alert.scss` |
| Dropdowns, modals, tooltips, popovers | `component/_modal.scss` |
| Footer + global switches | `layout/_footer.scss`, `layout/_container.scss`, `base/_buttons.scss` |
| Cards, list groups, tables, account | `component/_card.scss`, `page/_account.scss` |
| Dark-mode bridge for core's baked colours | `base/_core-colors.scss` |

### State signalling — where it lives

- **Alerts & badges** — status tint + border + AA text shade, plus the per-type
  icon core renders (colour is never the only cue).
- **Order status** — open/in progress = info, completed = success,
  cancelled/failed = danger chips.
- **Selection** (payment/shipping method, address, swatch) — ink ring + the
  control's own check/radio.
- **Navigation & lists** — tinted row + ink + semibold for the current item;
  2px indicator on the main nav.
- **Pagination** — current page in solid ink.

CMS text/HTML blocks and CMS forms inherit the base typography and form styles —
no dedicated overrides needed.
