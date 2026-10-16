# 1.0.0

First stable release. A modern, neutral-monochrome base theme for Shopware 6.7,
covering the full storefront in light and dark mode on desktop and phone.

- Design tokens as CSS custom properties: colour, type scale, 4px spacing grid,
  radius, elevation and motion. Brand colours, logo, radius and rating colour
  are set in the theme configuration.
- Dark mode with a header toggle, remembered per visitor and applied before
  first paint (no flash). Core colours that Shopware bakes at compile time are
  bridged so dark mode reaches every component.
- Header: sticky blurred bar, aligned action icons with visible counters, a
  full-width top bar whose currency and language menus open above the header,
  search suggestions, active navigation indicator.
- Breadcrumbs and page headers: one pattern for listing, product, account and
  checkout pages; current page is text with `aria-current`.
- Listing: horizontal filter row, sidebar filters, pagination and product cards
  with equal heights, a red wishlist heart when saved.
- Product detail page: gallery, buy box, description with readable measure and
  hairline properties, and a reviews tab with a prominent average score,
  aligned rating distribution, readable review rows and shop replies.
- Sliders everywhere (gallery, image sliders, product sliders, cross-selling):
  round 40px arrows that are never clipped, quiet pill dots, equal card
  heights and room for the card hover lift.
- Checkout and account: cart, confirm, finish, order history with status
  chips, and the Shopware 6.7 address manager and its checkout modal.
- Shopping Experiences: every core CMS block styled, editor settings respected,
  and three opt-in block classes (`kmh-cms-surface`, `kmh-cms-cards`,
  `kmh-cms-center`).
- Alerts, badges, modals, dropdowns, off-canvas panels, forms and focus rings
  on the design system; WCAG AA text contrast in both colour schemes.
- Optional skins for Kommandhub plugins (Click and Pick, Paystack, Flutterwave,
  SMS) that apply only when those plugins are installed; the theme depends on
  none of them.
