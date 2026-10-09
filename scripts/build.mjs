// Builds the deployable site into ./_site
//   node scripts/build.mjs                      (uses https://deeprowss.com)
//   SITE_URL=http://localhost:8080 node scripts/build.mjs   (override, e.g. local testing)
// - copies site files
// - pre-renders matches/movies from data/*.json into the HTML (crawler-friendly)
// - injects JSON-LD structured data
// - writes sitemap.xml and robots.txt
import fs from 'node:fs';
import path from 'node:path';

const SITE = (process.env.SITE_URL || 'https://deeprowss.com').replace(/\/+$/, '');
if (!/^https?:\/\//.test(SITE)) {
  console.error('SITE_URL must start with http:// or https://');
  process.exit(1);
}
const OUT = '_site';
const read = f => fs.readFileSync(f, 'utf8');
const json = f => JSON.parse(read(f));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const abs = p => (/^https?:\/\//.test(p) ? p : `${SITE}/${p.replace(/^\.?\//, '')}`);

const site = json('data/site.json');
const matchesIn = json('data/matches.json').matches || [];
const moviesIn = json('data/movies.json').movies || [];

/* ---------- copy ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const f of ['index.html', 'privacy.html', '404.html']) fs.copyFileSync(f, path.join(OUT, f));
for (const d of ['css', 'js', 'assets', 'data']) fs.cpSync(d, path.join(OUT, d), { recursive: true });
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
if (fs.existsSync('CNAME')) fs.copyFileSync('CNAME', path.join(OUT, 'CNAME'));

/* ---------- matches ---------- */
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const resolve = m => {
  if (m.date) return new Date(m.date);
  const [h, mi] = (m.time || '00:00').split(':').map(Number);
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + (m.inDays || 0));
  d.setUTCHours(h, mi, 0, 0);
  return d;
};
const upcoming = matchesIn
  .map(m => ({ ...m, when: resolve(m) }))
  .filter(m => m.when.getTime() > now.getTime() - 2 * 3600e3)
  .sort((a, b) => a.when - b.when);

const fmtDate = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtTime = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
const apk = site.apkUrl || '#download';

const matchesHtml = upcoming.length
  ? upcoming.map(m => `
        <article class="match-card"><div><span class="match-date"><time datetime="${m.when.toISOString()}">${fmtDate(m.when)} • ${fmtTime(m.when)}</time></span><h3>${esc(m.home)} <b>vs</b> ${esc(m.away)}</h3></div><a href="${esc(apk)}" aria-label="Watch ${esc(m.home)} vs ${esc(m.away)} in the app">Watch in App →</a></article>`).join('')
  : '\n        <p class="empty">No upcoming matches listed right now. Open the app for the latest schedule.</p>';

const moviesHtml = moviesIn.length
  ? moviesIn.map((m, i) => {
      const posterUrl = typeof m.image === 'string' && m.image.trim()
        ? m.image.trim()
        : (typeof m.poster === 'string' ? m.poster.trim() : '');
      return `
        <article class="movie-card"><div class="poster poster-${(i % 4) + 1}">${posterUrl
          ? `<img src="${esc(posterUrl)}" alt="${esc(m.title)} poster" loading="lazy" width="300" height="450">`
          : `<span aria-hidden="true">POSTER ${String(i + 1).padStart(2, '0')}</span>`}</div><h3>${esc(m.title)}</h3><p>${esc(m.year || '')}</p></article>`;
    }).join('')
  : '\n        <p class="empty">Open the app to browse the latest titles.</p>';

/* ---------- structured data ---------- */
const faqs = [...read('index.html').matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)]
  .map(([, q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }));

const graph = [
  { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Deeprowss', url: `${SITE}/`,
    logo: abs('assets/icon-512.png'),
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: site.supportEmail } },
  { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Deeprowss',
    description: 'Free Android app for upcoming football matches and the latest movies, with no ads.',
    inLanguage: 'en', publisher: { '@id': `${SITE}/#org` } },
  { '@type': 'MobileApplication', '@id': `${SITE}/#app`, name: 'Deeprowss', operatingSystem: 'ANDROID',
    applicationCategory: 'SportsApplication', url: `${SITE}/`, image: abs('assets/og-image.png'),
    description: 'Upcoming football matches and the latest movies in one ad-free Android app.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${SITE}/#org` } },
];
if (faqs.length) graph.push({ '@type': 'FAQPage', mainEntity: faqs });

// Only real fixtures/titles get structured data; entries flagged "sample": true are skipped
// so placeholder content never reaches search engines as markup.
for (const m of upcoming.filter(x => !x.sample)) {
  graph.push({ '@type': 'SportsEvent', name: `${m.home} vs ${m.away}`, sport: 'Football',
    startDate: m.when.toISOString(), eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: m.venue ? 'https://schema.org/OfflineEventAttendanceMode' : 'https://schema.org/OnlineEventAttendanceMode',
    location: m.venue ? { '@type': 'Place', name: m.venue } : { '@type': 'VirtualLocation', url: `${SITE}/` },
    homeTeam: { '@type': 'SportsTeam', name: m.home }, awayTeam: { '@type': 'SportsTeam', name: m.away },
    ...(m.competition ? { superEvent: { '@type': 'SportsEvent', name: m.competition } } : {}) });
}
const realMovies = moviesIn.filter(x => !x.sample);
if (realMovies.length) {
  graph.push({ '@type': 'ItemList', name: 'Latest Movies', itemListElement: realMovies.map((m, i) => ({
    '@type': 'ListItem', position: i + 1,
    item: { '@type': 'Movie', name: m.title, ...(m.year ? { dateCreated: String(m.year) } : {}), ...((m.image || m.poster) ? { image: abs(m.image || m.poster) } : {}) } })) });
}
const jsonLd = ld({ '@context': 'https://schema.org', '@graph': graph });
const breadcrumb = ld({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Privacy Policy | Deeprowss', url: `${SITE}/privacy.html`, isPartOf: { '@id': `${SITE}/#website` } });

/* ---------- apply ---------- */
const mark = (html, name, content) => html.replace(new RegExp(`<!--build:${name}-->[\\s\\S]*?<!--/build:${name}-->`), () => content);
const finish = html => html
  .replaceAll('__SITE_URL__', SITE)
  .replaceAll('assets/deeprowss.apk', site.apkUrl || 'assets/deeprowss.apk')
  .replaceAll('support@deeprowss.com', site.supportEmail || 'support@deeprowss.com');

let index = read(path.join(OUT, 'index.html'));
index = mark(index, 'jsonld', jsonLd);
index = mark(index, 'matches', matchesHtml + '\n      ');
index = mark(index, 'movies', moviesHtml + '\n      ');
fs.writeFileSync(path.join(OUT, 'index.html'), finish(index));

let privacy = read(path.join(OUT, 'privacy.html'));
privacy = privacy.replace('</head>', `  ${breadcrumb}\n</head>`);
fs.writeFileSync(path.join(OUT, 'privacy.html'), finish(privacy));

const iso = now.toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${iso}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE}/privacy.html</loc><lastmod>${iso}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${OUT}/ for ${SITE} (${upcoming.length} matches, ${moviesIn.length} movies, ${graph.length} JSON-LD nodes)`);
