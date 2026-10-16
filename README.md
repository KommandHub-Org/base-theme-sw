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
for the theme toggle, dark logo, top-bar and breadcrumb config gates).

| Area | Files |
|---|---|
| Design system, base layer | `abstract/*`, `base/*` |
| Header, nav, search, actions | `layout/_header.scss`, `views/…/header.html.twig`, `header/header.html.twig`, `header/logo.html.twig`, `top-bar.html.twig` |
| Listing + product cards | `component/_product-card.scss` |
| Product detail (PDP) | `page/_product-detail.scss` |
| Breadcrumb, filters, pagination | `component/_listing.scss`, `views/…/breadcrumb.html.twig` |
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
