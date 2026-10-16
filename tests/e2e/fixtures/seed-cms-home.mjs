#!/usr/bin/env node
/**
 * Seeds a Shopping Experiences homepage that uses every core CMS block that
 * works outside a product/listing context, and assigns it to a storefront's
 * root category. The E2E suite (cms.spec.ts) and manual theme review use it.
 *
 * Idempotent: the layout has a fixed id and is deleted and re-created on each
 * run. The previous homepage layout is left untouched — re-assign it to the
 * root category in the Administration to roll back.
 *
 *   SW_URL=http://localhost SW_CLIENT_ID=… SW_CLIENT_SECRET=… \
 *   SW_SALES_CHANNEL=Storefront node tests/e2e/fixtures/seed-cms-home.mjs
 *
 * Credentials come from an integration (`bin/console integration:create`).
 * Images: product cover images when the shop has them, otherwise generated
 * monochrome SVG placeholders (the theme stack seeds products without media).
 */

const url = (process.env.SW_URL ?? 'http://localhost').replace(/\/$/, '');
const channelName = process.env.SW_SALES_CHANNEL ?? 'Storefront';
const PAGE_ID = '0193f1a0c0de7a11b0a5e7e5c0ffee01';
const PLACEHOLDER_FOLDER_NAME = 'KmhBaseTheme CMS placeholders';

let token;
async function api(method, path, body, raw = false) {
    const res = await fetch(`${url}/api${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': raw ? 'image/svg+xml' : 'application/json',
        },
        body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    });
    if (!res.ok && !(method === 'DELETE' && res.status === 404)) {
        throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
    }
    return res.status === 204 || res.status === 404 ? null : res.json().catch(() => null);
}

const hex = () => crypto.randomUUID().replace(/-/g, '');
const s = (value) => ({ source: 'static', value });

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------
const text = (html) => ({ type: 'text', config: { content: s(html), verticalAlign: s(null) } });
const image = (mediaId, displayMode = 'standard', minHeight = '340px') => ({
    type: 'image',
    config: {
        media: s(mediaId), displayMode: s(displayMode), minHeight: s(minHeight),
        url: s(null), newTab: s(false), verticalAlign: s(null), horizontalAlign: s(null), isDecorative: s(true),
    },
});
const productBox = (id) => ({
    type: 'product-box',
    config: { product: s(id), boxLayout: s('standard'), displayMode: s('standard'), verticalAlign: s(null) },
});

function block(type, slots, extra = {}) {
    return {
        type,
        sectionPosition: 'main',
        marginTop: '20px', marginBottom: '20px', marginLeft: '0', marginRight: '0',
        ...extra,
        slots: Object.entries(slots).map(([slot, v]) => ({ id: hex(), slot, ...v })),
    };
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
async function svgPlaceholders(count) {
    const folder = await api('POST', '/search/media-folder', {
        filter: [{ type: 'equals', field: 'name', value: PLACEHOLDER_FOLDER_NAME }], limit: 1,
    });
    const existing = folder.data[0]
        ? (await api('POST', '/search/media', {
            filter: [{ type: 'equals', field: 'mediaFolderId', value: folder.data[0].id }],
            sort: [{ field: 'fileName' }], limit: count,
        })).data.filter((m) => m.hasFile)
        : [];
    if (existing.length >= count) return existing.map((m) => m.id);

    let folderId = folder.data[0]?.id;
    if (!folderId) {
        folderId = hex();
        await api('POST', '/media-folder', {
            id: folderId, name: PLACEHOLDER_FOLDER_NAME, useParentConfiguration: false,
            configuration: { private: false },
        });
    }

    const ids = [];
    for (let i = 0; i < count; i++) {
        // Neutral greys; hue-free so placeholders read as "image" in both modes.
        const a = 228 - i * 14, b = a - 40;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">`
            + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgb(${a},${a},${a})"/>`
            + `<stop offset="1" stop-color="rgb(${b},${b},${b})"/></linearGradient></defs>`
            + `<rect width="1600" height="1000" fill="url(#g)"/></svg>`;
        const id = hex();
        await api('POST', '/media', { id, mediaFolderId: folderId });
        await api('POST', `/_action/media/${id}/upload?extension=svg&fileName=kmh-cms-placeholder-${i + 1}`, svg, true);
        ids.push(id);
    }
    return ids;
}

async function main() {
    const clientId = process.env.SW_CLIENT_ID;
    const clientSecret = process.env.SW_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('SW_CLIENT_ID and SW_CLIENT_SECRET are required');
    const auth = await fetch(`${url}/api/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
    });
    if (!auth.ok) throw new Error(`auth: ${auth.status} ${await auth.text()}`);
    token = (await auth.json()).access_token;

    const channel = (await api('POST', '/search/sales-channel', {
        filter: [{ type: 'equals', field: 'name', value: channelName }], limit: 1,
    })).data[0];
    if (!channel) throw new Error(`sales channel "${channelName}" not found`);

    const products = (await api('POST', '/search/product', {
        filter: [
            { type: 'equals', field: 'active', value: true },
            { type: 'equals', field: 'parentId', value: null },
            { type: 'equals', field: 'visibilities.salesChannelId', value: channel.id },
        ],
        associations: { cover: {} },
        sort: [{ field: 'productNumber' }],
        limit: 12,
    })).data;
    if (products.length < 3) throw new Error('need at least 3 products visible in the channel');
    const p = (i) => products[i % products.length].id;

    let media = products.map((x) => x.cover?.mediaId).filter(Boolean);
    if (media.length < 6) media = await svgPlaceholders(8);
    const m = (i) => media[i % media.length];

    // ------------------------------------------------------------------------
    // Layout
    // ------------------------------------------------------------------------
    const eyebrow = (label, title, lead = '') =>
        `<p class="kmh-eyebrow">${label}</p><h2>${title}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}`;
    const card = (title, body) => `<h3>${title}</h3><p>${body}</p>`;

    const main = [
        block('text-hero', { content: text(
            '<h1>Everyday goods, built to last.</h1>'
            + '<p class="lead">Independent makers, honest materials and delivery you can track to the door.</p>'
            + '<p><a class="btn btn-primary" href="#featured">Shop new arrivals</a> '
            + '<a class="btn btn-outline-secondary" href="#story">Our story</a></p>') }, { marginTop: '40px' }),
        block('image-slider', { imageSlider: { type: 'image-slider', config: {
            sliderItems: s([0, 1, 2].map((i) => ({ mediaId: m(i), url: null, newTab: false }))),
            navigationArrows: s('inside'), navigationDots: s('inside'), displayMode: s('cover'),
            minHeight: s('420px'), verticalAlign: s(null), speed: s(300), autoSlide: s(false), autoplayTimeout: s(5000),
            isDecorative: s(true),
        } } }),
        block('text', { content: text(eyebrow('Featured', 'Picked for the season', 'Three things the team keeps reaching for.')) }),
        block('product-three-column', { left: productBox(p(0)), center: productBox(p(1)), right: productBox(p(2)) }),
        block('text-three-column', {
            left: text(card('Free returns', '30 days to change your mind, no questions asked.')),
            center: text(card('Tracked delivery', 'Live updates from the warehouse to your door.')),
            right: text(card('Secure checkout', 'Card, bank transfer and pay on pickup.')),
        }, { cssClass: 'kmh-cms-cards' }),
        block('product-slider', { productSlider: { type: 'product-slider', config: {
            products: s(products.slice(0, 10).map((x) => x.id)), title: s('New this week'),
            displayMode: s('standard'), boxLayout: s('standard'), navigationArrows: s('outside'), rotate: s(false),
            autoplayTimeout: s(5000), speed: s(300), border: s(false), elMinWidth: s('260px'), verticalAlign: s(null),
            productStreamSorting: s('name:ASC'), productStreamLimit: s(10),
        } } }),
        block('image-text', {
            left: image(m(3), 'cover', '360px'),
            right: text(eyebrow('Our story', 'Made by people, not by machines', 'Every product is traceable to the workshop that made it. We visit them, we pay them fairly, and we tell you who they are.')
                + '<p><a href="#story">Read the full story</a></p>'),
        }),
        block('text-teaser-section', {
            left: text('<h2>Join 12,000 regulars</h2>'),
            right: text('<p>Early access to drops, restock alerts and a short note from the workshop every month. No spam, unsubscribe in one click.</p>'),
        }, { cssClass: 'kmh-cms-surface' }),
        block('image-text-row', {
            'left-image': image(m(4), 'cover', '240px'), 'left-text': text(card('Clothing', 'Natural fibres, cut to wear for years.')),
            'center-image': image(m(5), 'cover', '240px'), 'center-text': text(card('Home & Living', 'Objects that earn their place.')),
            'right-image': image(m(6), 'cover', '240px'), 'right-text': text(card('Electronics', 'Repairable, with real warranties.')),
        }),
        block('center-text', {
            left: image(m(1), 'cover', '280px'),
            center: text(eyebrow('Materials', 'Fewer, better things', 'Cotton, wool, oak and steel — sourced close to where they are made.')),
            right: image(m(2), 'cover', '280px'),
        }),
        block('image-three-cover', { left: image(m(3), 'cover', '320px'), center: image(m(4), 'cover', '320px'), right: image(m(5), 'cover', '320px') }, { marginLeft: '0', marginRight: '0' }),
        block('image-text-bubble', {
            'left-image': image(m(6), 'cover', '200px'), 'left-text': text(card('Lagos', 'Our first workshop, since 2016.')),
            'center-image': image(m(7), 'cover', '200px'), 'center-text': text(card('Accra', 'Hand-loomed textiles.')),
            'right-image': image(m(0), 'cover', '200px'), 'right-text': text(card('Nairobi', 'Leather and hardware.')),
        }),
        block('text-two-column', {
            left: text('<h3>For businesses</h3><p>Volume pricing, invoices and a named account manager for teams of every size.</p><p><a href="#">Talk to sales</a></p>'),
            right: text('<h3>For makers</h3><p>We are always looking for independent workshops. Tell us what you make and how you make it.</p><p><a href="#">Apply as a maker</a></p>'),
        }),
        block('image-bubble-row', { left: image(m(1), 'cover', '160px'), center: image(m(2), 'cover', '160px'), right: image(m(3), 'cover', '160px') }),
        block('image-highlight-row', { left: image(m(4), 'cover', '300px'), center: image(m(5), 'cover', '300px'), right: image(m(6), 'cover', '300px') }),
        block('image-text-gallery', {
            'left-image': image(m(7), 'cover', '220px'), 'left-text': text(card('Design', 'Drawn in-house, tested for a season.')),
            'center-image': image(m(0), 'cover', '220px'), 'center-text': text(card('Make', 'Small batches, named makers.')),
            'right-image': image(m(1), 'cover', '220px'), 'right-text': text(card('Repair', 'Spare parts for every product.')),
        }),
        block('image-text-cover', {
            left: image(m(2), 'cover', '400px'),
            right: text(eyebrow('Care', 'A lifetime of repairs', 'Send it back and we will fix it — or tell you exactly how to do it yourself.')),
        }),
        block('image-simple-grid', { 'left-top': image(m(3), 'cover', '200px'), 'left-bottom': image(m(4), 'cover', '200px'), right: image(m(5), 'cover', '420px') }),
        block('image-gallery', { imageGallery: { type: 'image-gallery', config: {
            sliderItems: s([5, 6, 7, 0].map((i) => ({ mediaId: m(i), url: null, newTab: false }))),
            navigationArrows: s('inside'), navigationDots: s('none'), galleryPosition: s('underneath'),
            displayMode: s('standard'), minHeight: s('340px'), verticalAlign: s(null),
            zoom: s(false), fullScreen: s(false), keepAspectRatioOnZoom: s(true), magnifierOverGallery: s(false),
        } } }),
        block('image-four-column', { left: image(m(6)), 'center-left': image(m(7)), 'center-right': image(m(0)), right: image(m(1)) }),
        block('image-three-column', { left: image(m(2)), center: image(m(3)), right: image(m(4)) }),
        block('image-two-column', { left: image(m(5)), right: image(m(6)) }),
        block('text-teaser', { content: text(eyebrow('Press', '“The rare shop that tells you who made your shirt.”', '— Design Weekly')) }),
        block('youtube-video', { video: { type: 'youtube-video', config: {
            videoID: s('aqz-KE-bpKQ'), iframeTitle: s('Inside the workshop'), autoPlay: s(false), loop: s(false),
            showControls: s(true), start: s(null), end: s(null), displayMode: s('standard'),
            advancedPrivacyMode: s(true), needsConfirmation: s(true), previewMedia: s(m(7)),
        } } }),
        block('text-on-image', { content: text(
            '<h2>Visit the flagship</h2><p class="lead">12 Admiralty Way, Lekki · Open daily 10–19</p>'
            + '<p><a class="btn btn-primary" href="#">Get directions</a></p>') }, { backgroundMediaId: m(0), backgroundMediaMode: 'cover' }),
        block('image', { image: image(m(1), 'cover', '420px') }),
        block('text', { content: text('<h2>Questions?</h2><p>Our team answers within one working day. Write to us or call the hotline in the footer.</p>') }),
        block('form', { content: { type: 'form', config: {
            type: s('newsletter'), title: s('Get the monthly note'), mailReceiver: s([]),
            defaultMailReceiver: s(true), confirmationText: s(''),
        } } }),
        block('image-cover', { image: image(m(2), 'cover', '360px') }, { marginBottom: '40px' }),
    ];

    // Sidebar section: the category tree beside a short intro + products.
    const sidebar = [
        block('category-navigation', { content: { type: 'category-navigation', config: {} } }, { sectionPosition: 'sidebar' }),
        block('text', { content: text(eyebrow('Browse', 'Shop by category')) }),
        block('product-three-column', { left: productBox(p(3)), center: productBox(p(4)), right: productBox(p(5)) }),
    ];

    const sections = [
        { type: 'default', sizingMode: 'boxed', mobileBehavior: 'wrap', blocks: main },
        { type: 'sidebar', sizingMode: 'boxed', mobileBehavior: 'wrap', blocks: sidebar },
    ].map((sec, si) => ({
        id: hex(), position: si, ...sec,
        blocks: sec.blocks.map((b, bi) => ({ id: hex(), position: bi, ...b })),
    }));

    // The page can't be deleted while a category uses it: drop its sections
    // (blocks and slots cascade) and upsert the page with the new ones.
    const old = await api('POST', '/search-ids/cms-section', {
        filter: [{ type: 'equals', field: 'pageId', value: PAGE_ID }],
    });
    for (const id of old.data) await api('DELETE', `/cms-section/${id}`);
    await api('POST', '/_action/sync', [{
        action: 'upsert', entity: 'cms_page',
        payload: [{ id: PAGE_ID, name: 'KmhBaseTheme — Homepage showcase', type: 'landingpage', sections }],
    }]);
    await api('PATCH', `/category/${channel.navigationCategoryId}`, { cmsPageId: PAGE_ID });

    console.log(`Homepage layout ${PAGE_ID} assigned to "${channelName}" (${sections[0].blocks.length + sections[1].blocks.length} blocks).`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
