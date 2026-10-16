# Contributing

Contributions are **welcome** and will be fully **credited**.

## Licensing of contributions

This project is licensed under the [Apache License 2.0](LICENSE). Under Section 5
of that license, **any contribution you submit is provided under the same
license**, unless you explicitly state otherwise. You retain the copyright to
your contribution.

We use the **Developer Certificate of Origin (DCO)** rather than a Contributor
License Agreement — a one-line assertion, added by signing off your commits,
that you have the right to submit the code under the project license:

```bash
git commit -s -m "fix(header): align the wishlist counter"
```

`-s` appends a `Signed-off-by:` line using your configured Git identity. The full
text of what you are certifying is at <https://developercertificate.org>.

## Trademarks

The code license does **not** grant rights to the Kommandhub name or logo. If you
fork and redistribute your own version, you must rebrand it. See
[TRADEMARKS.md](TRADEMARKS.md).

## Getting started

The theme ships its own Shopware 6.7 stack on `http://localhost:8100`:

```bash
make up            # build + start the stack, install the theme and demo data
make e2e-setup     # seed the catalogue + CMS homepage, assign the theme
make e2e-install   # once, on the host: Playwright + Chromium
make shell         # then: bin/console theme:compile after SCSS edits
```

See [README.md](README.md#development) for every command.

## How the theme is built

Read the [Design system](README.md#design-system) section first. In short:

- **Tokens, not values.** Components use `var(--…)` from
  `abstract/_tokens-css.scss`; dark mode is a token flip. Add a token rather
  than a hard-coded colour or size.
- **Monochrome by default.** Hue is reserved for status and ratings.
- **Keep core markup.** Prefer SCSS over Twig. When a Twig override is needed,
  extend the core block and call `{{ parent() }}`.
- **Match core specificity.** Use `!important` only to beat core utilities,
  inline CMS styles or deep Bootstrap chains, and say why in a comment.
- **No plugin dependencies.** Skins for other plugins live in `scss/plugins/`
  and must only match that plugin's own markup.
- **scssphp compiles the theme.** No `@use 'sass:…'` in partials, and wrap
  values that mix units (e.g. `clamp()` with `vw` and `rem`) in a string.

## Tests

Every change must keep both suites green:

```bash
make check   # php-cs-fixer, PHPStan, PHPUnit
make e2e     # Playwright, desktop + phone, light + dark contrast
```

Add or update a Playwright check for any visual or behavioural fix, in light
and dark mode, desktop and phone where it applies. A test should fail without
your change.

## Branching and pull requests

We use **GitHub Flow**:

- **main** holds releasable code.
- Branch **feature/…** or **fix/…** from `main` and open the pull request
  against `main`.

Please:

- **Use [Conventional Commits](https://www.conventionalcommits.org)**
  (`feat:`, `fix:`, `docs:`, …) with a scope where it helps.
- **One pull request per change.** Send several for unrelated work.
- **Keep history coherent.** Squash fix-up commits before review.
- **Document behaviour changes** in `README.md` and `CHANGELOG.md`
  (and `CHANGELOG_de-DE.md`).
- **Follow [PSR-12](https://www.php-fig.org/psr/psr-12/)** for PHP; SCSS follows
  the existing files (4-space indent, one partial per area).
