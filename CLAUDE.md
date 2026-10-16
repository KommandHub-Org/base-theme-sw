# KmhBaseTheme

Modern, premium base theme for Shopware 6.7 — neutral monochrome UI, colour
reserved for meaning (status, ratings). A reusable foundation for storefront
projects, not a single-store skin. PHP namespace root: `Kommandhub\BaseTheme\`
→ `src/` (the plugin class is the only PHP; everything else is SCSS + Twig).

## Commands

The stack is the plugin's own dockware container (see `Makefile`,
`docker-compose.yml`); the storefront is published on `localhost:8100`
(`E2E_PORT`). The plugin is mounted at `custom/static-plugins/KmhBaseTheme`.

- `make up` / `make down` — start (and composer-install the theme + KmhDemoDataSW) / tear down
- `make check` — `cs` + `analyse` + `test` in one go; run before committing
- `make test` — PHPUnit. Filter: `make test FILTER=KmhBaseThemeTest`
- `make analyse` — PHPStan, `src` only · `make cs` / `make cs-fix` — php-cs-fixer
- `make e2e-install` — once, on the host: npm deps + Chromium
- `make e2e-setup` — activate theme + demo data, seed, map domains to :8100, assign + compile the theme (idempotent)
- `make e2e` — Playwright suite on the host against the stack (`make e2e ARGS="--project=desktop -g Breadcrumb"`)
- `make validate-plugin` — shopware-cli store-compliance check
- `make shell` — bash into the container; `bin/console theme:compile` after SCSS edits

## Architecture

```
src/Resources/
  theme.json                      config fields + style/script/view inheritance
  app/storefront/src/scss/
    overrides.scss                BEFORE @Storefront — Bootstrap/Shopware !default vars → tokens
    base.scss                     AFTER @Storefront — imports everything below
    abstract/  _palette (raw scale, status hues) · _config (theme.json → radius/spacing)
               _tokens-css (ALL CSS custom properties + dark mode) · _mixins
    base/      reboot/typography, focus, buttons, forms, _core-colors (dark-mode bridge)
    component/ cards+tables, overlays, alerts+badges, page-header+breadcrumb, listing, product card
    layout/    header+nav, off-canvas, footer, chrome, container
    page/      product-detail, checkout, account
    plugins/   OPTIONAL skins for Kommandhub plugins (selectors = plugin markup only)
  views/storefront/               small block-preserving Twig overrides
  snippet/                        storefront.<locale>.json
tests/Unit/                       PHPUnit (theme class, theme.json, snippets)
tests/e2e/                        Playwright (see README → End-to-end tests)
```

## Conventions

- **Tokens only.** Components use `var(--…)` from `_tokens-css.scss`; never a
  hex value or a Bootstrap colour variable in a component rule. Dark mode is the
  same token names re-valued under `[data-theme="dark"]`.
- **Hue means something.** Neutral UI; colour only for status
  (`--color-{success,warning,danger,info}` + `-text/-bg/-border`) and ratings.
- **Twig overrides call `parent()`** and keep core blocks, so plugins extending
  the same blocks keep working. Prefer SCSS over markup changes.
- **Core colours baked at compile time** (`color: $sw-text-color` etc.) escape
  the token layer. When a core element is dark-on-dark, add it to
  `base/_core-colors.scss`; `tests/e2e/theme.spec.ts` (WCAG contrast, light +
  dark) is the guard.
- **Specificity, not `!important`.** Match core's selector specificity; use
  `!important` only to beat a core utility class or inline CMS style, with a
  comment saying which.
- **Plugins are optional.** Style a plugin's UI in `scss/plugins/<plugin>.scss`
  using only that plugin's own selectors; never reference a plugin from the
  theme's Twig, `theme.json` or composer.json. Its E2E test must `test.skip`
  when the plugin's markup is absent.
- Add a test with each behaviour change: PHPUnit for theme.json/snippets, a
  Playwright assertion for anything visible.

## Shopware traps that fail silently

- **Some pages replace `base_head` without `parent()`** (the product page does).
  Anything that must be in every `<head>` goes in `layout/meta.html.twig`.
- **`sw_include … only`** passes nothing implicitly — e.g. the PDP breadcrumb
  include gets no `page`; pass what you need explicitly (see
  `page/content/product-detail.html.twig`).
- **`.btn .icon > svg { top: 6px }`** in core nudges icons onto a text
  baseline; icon-only buttons must reset it or they drift.
- **Same-specificity `display` on `.btn`** un-hides elements core hides with a
  plain `display: none` (e.g. the search close button). Never set `display` on
  `.btn` globally.
- **`:has()` cannot be nested** — `:not(:has(...))` is fine, `:has(:has(...))`
  silently invalidates the whole rule.
- **`trans|default(...)` never falls back**: a missing snippet returns the key,
  not an empty string. Add the snippet in every locale.

- **Themes compile with scssphp, not dart-sass.** `@use 'sass:map'` /
  `color.mix()` inside an imported partial is a parse error at
  `theme:compile`; keep the global functions (`map-get`, `mix`, `red`) and the
  scoped `stylelint-disable scss/no-global-function-names` that explains why.
- **Recreating the container wipes `vendor/`** (only the DB is a volume). After
  `docker compose up -d` with a changed compose file, run `make prepare` (or
  just use `make up`), then `make e2e-setup`.

## Store compliance (`make validate-plugin`)

Currently: 0 errors; the remaining warnings are `!important` / element
selectors that exist to beat core utility classes and CMS markup.

- `composer.json` descriptions must be **150–185 characters** (en and de).
- CSS: `overflow-wrap: break-word`, never `word-break: break-word`.
