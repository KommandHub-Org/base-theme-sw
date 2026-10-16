# Security Policy

The theme is front-end code: SCSS, a few Twig overrides and a small inline
script for dark mode. It handles no payments or credentials itself, but it
renders every storefront page, so issues such as cross-site scripting through
a template are taken seriously.

## Supported versions

Security fixes are provided for the latest minor release of the current major
version.

| Version | Supported |
| ------- | --------- |
| `1.x` (latest minor) | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

**Please do not report security issues in public GitHub issues, pull requests,
or discussions.** A public report tells attackers before merchants can patch.

Report privately in one of these ways:

1. **GitHub Security Advisories** (preferred): open a private report via the
   repository's **Security → Report a vulnerability** tab.
2. **Email**: **security@kommandhub.com** (or **info@kommandhub.com**).

Please include, as far as you can:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- Affected version(s) and environment (Shopware version, PHP version, browser).
- Any suggested remediation.

## What to expect

- **Acknowledgement** within 3 business days.
- An initial **assessment** within 10 business days.
- We will keep you updated on remediation and coordinate a disclosure timeline
  with you. Please allow us a reasonable period to release a fix before any
  public disclosure.
- With your consent, we are happy to **credit** you in the release notes and
  advisory.

## Scope

In scope: the theme's own source in this repository (templates, styles,
scripts, configuration).

Out of scope: vulnerabilities in Shopware itself or in third-party plugins and
dependencies (please report those to their maintainers). If one of them affects
this theme, we still want to know.

## Handling of secrets

Never include real credentials, API keys or production customer data in a
report, issue or pull request. Use redacted or test values.
