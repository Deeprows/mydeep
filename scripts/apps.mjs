// Renders the apps catalog (apps.html) and one detail page per app (app-<slug>.html)
// from data/apps.json. Called from build.mjs.
import fs from 'node:fs';
import path from 'node:path';

export function buildApps({ OUT, SITE, site, esc, abs, ld, read, finish }) {
  const apps = (JSON.parse(read('data/apps.json')).apps || []).map(a => ({
    ...a,
    apk: a.useSiteApk ? (site.apkUrl || '') : (a.apkUrl || ''),
    page: `app-${a.slug}.html`,
  }));

  const waDigits = String(site.whatsapp || '').replace(/\D/g, '');
  const waFor = a => waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi! Please send me the download link for ${a.name}.`)}`
    : `mailto:${site.supportEmail || 'support@deeprowss.com'}`;

  const dlIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg>';
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d6d"/><stop offset="1" stop-color="#d6103a"/></linearGradient></defs></svg>`;

  const head = ({ title, desc, file, ogTitle, ldJson = '' }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta name="theme-color" content="#070b10">
  <meta name="color-scheme" content="dark">
  <meta name="application-name" content="Deeprowss">
  <link rel="canonical" href="__SITE_URL__/${file}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Deeprowss">
  <meta property="og:title" content="${esc(ogTitle || title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="__SITE_URL__/${file}">
  <meta property="og:image" content="__SITE_URL__/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(ogTitle || title)}">
  <meta name="twitter:image" content="__SITE_URL__/assets/og-image.png">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
  <link rel="manifest" href="assets/manifest.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/apps.css">
  ${ldJson}
</head>`;

  const header = `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="index.html" aria-label="Deeprowss home">
    <span class="brand-mark" aria-hidden="true">D</span>
    <span>DEEPROWSS</span>
  </a>
  <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="main-nav">
    <span></span><span></span><span></span>
  </button>
  <nav class="nav" id="main-nav" aria-label="Main navigation">
    <a href="index.html">Home</a>
    <a href="apps.html">Apps</a>
    <a href="learn.html">Learn to Build Apps</a>
    <a href="privacy.html">Privacy Policy</a>
  </nav>
</header>`;

  const footer = `
<footer class="footer">
  <strong>DEEPROWSS</strong>
  <nav aria-label="Footer navigation">
    <a href="index.html">Home</a>
    <a href="apps.html">Apps</a>
    <a href="learn.html">Learn to Build Apps</a>
    <a href="privacy.html">Privacy Policy</a>
  </nav>
  <small>&copy; <span id="year">2026</span> Deeprowss. All rights reserved.</small>
</footer>
<script src="js/app.js"></script>
<script src="js/apps.js"></script>`;

  /* ---------- catalog card ---------- */
  const card = a => `
        <article class="app-card" data-name="${esc([a.name, a.tagline, a.group, ...(a.tags || [])].join(' ').toLowerCase())}" data-group="${esc(a.group)}">
          <a class="app-card-main" href="${esc(a.page)}" aria-label="About ${esc(a.name)}">
            <img class="app-icon" src="${esc(a.icon)}" width="72" height="72" alt="" loading="lazy">
            <span class="app-card-text">
              <h3>${esc(a.name)}</h3>
              <span class="app-group">${esc(a.group)}</span>
              <span class="app-tagline">${esc(a.tagline)}</span>
            </span>
          </a>
          <div class="app-card-actions">
            <a class="app-about" href="${esc(a.page)}">About</a>
            ${a.apk
              ? `<a class="app-get" href="${esc(a.apk)}" rel="noopener">Download</a>`
              : `<a class="app-get soon" href="${esc(a.page)}">Coming soon</a>`}
          </div>
        </article>`;

  const groups = [...new Set(apps.map(a => a.group))];
  const chips = ['All', ...groups]
    .map((g, i) => `<button class="chip${i === 0 ? ' on' : ''}" type="button" data-filter="${i === 0 ? '' : esc(g)}" aria-pressed="${i === 0}">${esc(g)}</button>`)
    .join('\n          ');

  let catalog = read('apps.html');
  catalog = catalog
    .replace(/<!--build:chips-->[\s\S]*?<!--\/build:chips-->/, () => chips)
    .replace(/<!--build:apps-->[\s\S]*?<!--\/build:apps-->/, () => apps.map(card).join('') + '\n      ')
    .replace(/<!--build:jsonld-->[\s\S]*?<!--\/build:jsonld-->/, () => ld({
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Deeprowss Apps',
      itemListElement: apps.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${a.page}`, name: a.name })),
    }));
  fs.writeFileSync(path.join(OUT, 'apps.html'), finish(catalog));

  /* ---------- detail pages ---------- */
  const feature = f => `<li class="feat"><span class="feat-ic" aria-hidden="true">${esc(f.icon || '•')}</span><div><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div></li>`;

  for (const a of apps) {
    const others = apps.filter(x => x.slug !== a.slug);
    const desc = `${a.name}: ${a.tagline} Free for Android. About page, features and download.`;
    const graph = {
      '@context': 'https://schema.org', '@type': 'MobileApplication', name: a.name,
      operatingSystem: 'ANDROID', applicationCategory: a.schemaCategory || 'UtilitiesApplication',
      description: a.tagline, url: `${SITE}/${a.page}`, image: abs(a.icon),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'Deeprowss', url: `${SITE}/` },
    };

    const cta = a.apk
      ? `<a class="dl-btn dl-btn-main" href="${esc(a.apk)}" rel="noopener">${dlIcon}<span><b>Download APK</b><small>Free &middot; Android</small></span></a>`
      : `<span class="dl-btn dl-btn-main is-disabled" aria-disabled="true">${dlIcon}<span><b>Coming soon</b><small>The download isn't live yet</small></span></span>
         <a class="dl-btn dl-btn-alt" href="${esc(waFor(a))}" rel="noopener" target="_blank"><span><b>Ask for the link</b><small>Message us and we'll send it</small></span></a>`;

    const shots = (a.screenshots || []).length
      ? `<section class="ad-section" aria-labelledby="shots-title">
      <h2 id="shots-title">Preview</h2>
      <div class="shots" tabindex="0" aria-label="${esc(a.name)} screenshots">
        ${a.screenshots.map((s, i) => `<img src="${esc(s.src)}" alt="${esc(s.alt || `${a.name} screenshot ${i + 1}`)}" width="${s.width || 1024}" height="${s.height || 1536}" loading="${i ? 'lazy' : 'eager'}">`).join('\n        ')}
      </div>
    </section>`
      : '';

    const quick = (a.quickLinks || []).length
      ? `<section class="ad-section" aria-labelledby="ql-title">
      <h2 id="ql-title">${esc(a.quickLinksTitle || 'What\'s inside')}</h2>
      <ul class="tiles">
        ${a.quickLinks.map(q => `<li class="tile"><span class="tile-ic" aria-hidden="true">${esc(q.icon || '•')}</span><h3>${esc(q.title)}</h3><p>${esc(q.text)}</p></li>`).join('\n        ')}
      </ul>
    </section>`
      : '';

    const more = others.length
      ? `<section class="ad-section" aria-labelledby="more-title">
      <h2 id="more-title">More from Deeprowss</h2>
      <div class="app-grid">${others.map(card).join('')}
      </div>
    </section>`
      : '';

    const html = `${head({ title: `${a.name}: Free Android App | Deeprowss`, desc, file: a.page, ogTitle: `${a.name} for Android`, ldJson: ld(graph) })}
<body class="apps-page">
${sprite}${header}

<main id="main">

  <nav class="crumbs" aria-label="Breadcrumb"><a href="apps.html">&larr; All apps</a></nav>

  <section class="ad-hero">
    <img class="ad-icon" src="${esc(a.icon)}" width="128" height="128" alt="${esc(a.name)} icon">
    <div class="ad-head">
      <p class="eyebrow">${esc(a.group.toUpperCase())}</p>
      <h1>${esc(a.name)}</h1>
      <p class="ad-dev">Deeprowss</p>
      <p class="ad-tag">${esc(a.tagline)}</p>
    </div>
  </section>

  <dl class="ad-facts">
    ${(a.facts || []).map(f => `<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join('\n    ')}
  </dl>

  <div class="ad-cta">
    ${cta}
    <button class="share-btn" type="button" data-share data-title="${esc(a.name)}" aria-label="Share ${esc(a.name)}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/></svg>
      <span>Share</span>
    </button>
  </div>

  ${shots}

  <section class="ad-section" aria-labelledby="about-title">
    <h2 id="about-title">About this app</h2>
    ${(a.about || []).map(p => `<p class="ad-about">${esc(p)}</p>`).join('\n    ')}
  </section>

  ${quick}

  <section class="ad-section" aria-labelledby="feat-title">
    <h2 id="feat-title">Features</h2>
    <ul class="feats">
      ${(a.features || []).map(feature).join('\n      ')}
    </ul>
  </section>

  <section class="ad-section" aria-labelledby="inst-title">
    <h2 id="inst-title">How to install</h2>
    <ol class="mini-steps">
      <li><b>Download.</b> Tap the download button. If your browser warns about the file, choose <b>Download anyway</b>.</li>
      <li><b>Allow install.</b> Open the file and, if Android asks, allow installs from your browser.</li>
      <li><b>Install.</b> If Play Protect shows a notice, choose <b>Install anyway</b>, then open the app.</li>
    </ol>
  </section>

  <section class="ad-section" aria-labelledby="info-title">
    <h2 id="info-title">App info</h2>
    <dl class="info">
      <div><dt>Developer</dt><dd>Deeprowss</dd></div>
      <div><dt>Category</dt><dd>${esc(a.group)}</dd></div>
      <div><dt>Platform</dt><dd>Android (APK)</dd></div>
      <div><dt>Price</dt><dd>Free</dd></div>
      <div><dt>Support</dt><dd><a href="mailto:${esc(site.supportEmail || 'support@deeprowss.com')}">${esc(site.supportEmail || 'support@deeprowss.com')}</a></dd></div>
      <div><dt>Privacy</dt><dd><a href="privacy.html">Privacy Policy</a></dd></div>
    </dl>
  </section>

  ${more}

</main>
${footer}

</body>
</html>
`;
    fs.writeFileSync(path.join(OUT, a.page), finish(html));
    if (!a.apk) console.warn(`WARNING: "${a.name}" has no apkUrl in data/apps.json, so its download button shows "Coming soon".`);
  }

  return apps;
}
