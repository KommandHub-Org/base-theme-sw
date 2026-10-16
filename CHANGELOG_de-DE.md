# 1.0.0

Erste stabile Version. Ein modernes, neutral-monochromes Basis-Theme für
Shopware 6.7, das den gesamten Storefront im hellen und dunklen Modus auf
Desktop und Smartphone abdeckt.

- Design-Tokens als CSS Custom Properties: Farbe, Typografie-Skala,
  4-px-Abstandsraster, Radien, Schatten und Bewegung. Markenfarben, Logo,
  Eckenradius und Bewertungsfarbe werden in der Theme-Konfiguration gesetzt.
- Dark Mode mit Umschalter im Header, pro Besucher gespeichert und vor dem
  ersten Rendern angewendet (kein Aufblitzen). Farben, die Shopware beim
  Kompilieren festschreibt, werden überbrückt, damit der Dark Mode jede
  Komponente erreicht.
- Header: fixierte, weichgezeichnete Leiste, ausgerichtete Aktions-Icons mit
  sichtbaren Zählern, eine Top-Bar über die volle Breite, deren Währungs- und
  Sprachmenüs über dem Header öffnen, Suchvorschläge, Markierung der aktiven
  Navigation.
- Breadcrumbs und Seitenköpfe: ein einheitliches Muster für Listing-,
  Produkt-, Konto- und Checkout-Seiten; die aktuelle Seite ist Text mit
  `aria-current`.
- Listing: horizontale Filterleiste, Seitenleisten-Filter, Paginierung und
  Produktkarten mit gleicher Höhe, rotes Wunschlisten-Herz, wenn gemerkt.
- Produktdetailseite: Galerie, Kaufbox, Beschreibung mit gut lesbarer
  Zeilenlänge und schlanker Eigenschaftstabelle sowie ein Bewertungs-Tab mit
  deutlicher Durchschnittsnote, ausgerichteter Bewertungsverteilung, gut
  lesbaren Bewertungen und Händlerantworten.
- Slider überall (Galerie, Bild-Slider, Produkt-Slider, Cross-Selling): runde
  40-px-Pfeile, die nie abgeschnitten werden, dezente Punkte, gleich hohe
  Karten und Platz für den Hover-Effekt der Karten.
- Checkout und Konto: Warenkorb, Bestellbestätigung, Abschluss,
  Bestellhistorie mit Status-Chips sowie die Adressverwaltung von Shopware 6.7
  und ihr Checkout-Dialog.
- Erlebniswelten: alle Standard-CMS-Blöcke gestaltet, Einstellungen aus der
  Administration bleiben erhalten, dazu drei optionale Block-Klassen
  (`kmh-cms-surface`, `kmh-cms-cards`, `kmh-cms-center`).
- Hinweise, Badges, Modals, Dropdowns, Off-Canvas-Bereiche, Formulare und
  Fokusringe im Design-System; WCAG-AA-Textkontrast in beiden Farbschemata.
- Optionale Skins für Kommandhub-Plugins (Click and Pick, Paystack,
  Flutterwave, SMS), die nur greifen, wenn diese Plugins installiert sind; das
  Theme hängt von keinem davon ab.
