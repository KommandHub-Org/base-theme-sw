<?php

declare(strict_types=1);

namespace Kommandhub\BaseTheme\Tests\Unit;

use Kommandhub\BaseTheme\KmhBaseTheme;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Shopware\Storefront\Framework\ThemeInterface;

/**
 * The theme's PHP surface is the plugin class plus its declarative files.
 * These tests pin the contract Shopware relies on — the theme.json path, the
 * inheritance chain, and config fields the SCSS/Twig read — so a broken edit
 * fails here rather than at `theme:compile` on a shop.
 */
#[CoversClass(KmhBaseTheme::class)]
final class KmhBaseThemeTest extends TestCase
{
    private const RESOURCES = __DIR__ . '/../../src/Resources';

    public function testIsAThemeReadingThemeJson(): void
    {
        $plugin = new KmhBaseTheme(true, \dirname(__DIR__, 2));

        static::assertInstanceOf(ThemeInterface::class, $plugin);
        static::assertSame('theme.json', $plugin->getThemeConfigPath());
        static::assertFileExists(self::RESOURCES . '/' . $plugin->getThemeConfigPath());
    }

    public function testThemeJsonInheritsFromTheStorefront(): void
    {
        $theme = $this->themeJson();

        static::assertSame('KmhBaseTheme', $theme['name']);
        static::assertSame(['@Storefront', '@Plugins', '@KmhBaseTheme'], $theme['views']);
        // overrides.scss must load BEFORE @Storefront (it sets !default variables),
        // base.scss after it.
        static::assertSame(
            ['app/storefront/src/scss/overrides.scss', '@Storefront', 'app/storefront/src/scss/base.scss'],
            $theme['style'],
        );

        foreach ($theme['style'] as $entry) {
            if ($entry[0] !== '@') {
                static::assertFileExists(self::RESOURCES . '/' . $entry);
            }
        }
    }

    /**
     * Every config field the SCSS (`$kmh-*`) and Twig (`theme_config(...)`) read
     * must exist, sit in a declared block, and carry an English label.
     */
    public function testConfigFieldsAreDeclaredAndLabelled(): void
    {
        $config = $this->themeJson()['config'];
        $blocks = array_keys($config['blocks']);

        foreach ([
            'kmh-dark-mode-toggle', 'kmh-logo-dark', 'kmh-show-breadcrumb', 'kmh-show-topbar',
            'kmh-sticky-header', 'kmh-border-radius', 'kmh-rating-color', 'kmh-nav-layout',
            'sw-color-success', 'sw-color-warning', 'sw-color-danger', 'sw-color-info',
        ] as $required) {
            static::assertArrayHasKey($required, $config['fields'], "theme.json is missing $required");
        }

        foreach ($config['fields'] as $name => $field) {
            static::assertArrayHasKey('type', $field, $name);
            static::assertNotEmpty($field['label']['en-GB'] ?? null, "$name has no en-GB label");
            static::assertContains($field['block'], $blocks, "$name uses an undeclared block");
        }
    }

    public function testRadiusOptionsMatchTheScssMap(): void
    {
        $field = $this->themeJson()['config']['fields']['kmh-border-radius'];
        $options = array_column($field['custom']['options'], 'value');
        $scss = (string)file_get_contents(self::RESOURCES . '/app/storefront/src/scss/abstract/_config.scss');

        static::assertContains($field['value'], $options);

        foreach ($options as $option) {
            static::assertStringContainsString("'$option':", $scss, "radius option $option has no SCSS value");
        }
    }

    public function testStorefrontSnippetsHaveTheSameKeysInEveryLocale(): void
    {
        $en = $this->flatten($this->json(self::RESOURCES . '/snippet/storefront.en-GB.json'));
        $de = $this->flatten($this->json(self::RESOURCES . '/snippet/storefront.de-DE.json'));

        static::assertNotEmpty($en);
        static::assertSame(array_keys($en), array_keys($de));
    }

    /** @return array<string, mixed> */
    private function themeJson(): array
    {
        return $this->json(self::RESOURCES . '/theme.json');
    }

    /** @return array<string, mixed> */
    private function json(string $path): array
    {
        $data = json_decode((string)file_get_contents($path), true, 512, \JSON_THROW_ON_ERROR);
        static::assertIsArray($data);

        return $data;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    private function flatten(array $data, string $prefix = ''): array
    {
        $flat = [];

        foreach ($data as $key => $value) {
            $path = $prefix === '' ? (string)$key : $prefix . '.' . $key;
            $flat += \is_array($value) ? $this->flatten($value, $path) : [$path => $value];
        }

        return $flat;
    }
}
