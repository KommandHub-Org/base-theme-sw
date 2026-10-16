<?php

declare(strict_types=1);

namespace Kommandhub\BaseTheme\Tests;

$loader = (new TestBootstrapper())
    ->setPlatformEmbedded(true)
    ->addCallingPlugin()
    ->setForceInstallPlugins(true)
    ->addActivePlugins(
        'KmhBaseTheme',
    )
    ->bootstrap()
    ->getClassLoader();

$loader->addPsr4('Kommandhub\BaseTheme\\Tests\\', __DIR__);
