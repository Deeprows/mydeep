# Deeprowss Website

A fast, mobile-first promotional site for the Deeprowss Android app. Plain HTML/CSS/JS plus one small Node build step (no dependencies).

## Structure
```
index.html, privacy.html, 404.html   pages (templates)
css/style.css                        styles
js/app.js                            menu, carousel, renders data from data/*.json
data/site.json                       APK link, support email, screenshots
data/matches.json                    upcoming matches
data/movies.json                     latest movies
scripts/build.mjs                    build: pre-render + SEO + sitemap -> _site/
assets/                              icons, OG image, manifest, screenshots, posters, APK
.github/workflows/                   pages.yml (deploy), ci.yml (checks)
```

## Update content (edit the JSON, commit, push)

**data/matches.json**
```json
{ "matches": [
  { "home": "Arsenal", "away": "Chelsea", "date": "2026-10-10T17:30:00Z",
    "competition": "Premier League", "venue": "Emirates Stadium" }
]}
```
- `date` is an ISO timestamp with timezone (`Z` = UTC, or `+03:00`). Visitors see it in their local time.
- `venue` and `competition` are optional (improves search results).
- Finished matches are hidden automatically; a match shows "LIVE NOW" after kickoff.
- `"sample": true` marks placeholder rows (`inDays` + `time` also work for samples). Samples are shown but **never** sent to search engines as structured data. Remove the flag on real entries.

**data/movies.json**
- Use `image` for a remote poster URL or `poster` for a local asset path. Both fields are supported; `image` takes priority if both are present. If an image fails to load, the site shows a poster placeholder.
```json
{ "movies": [\n  { "title": "Primetime", "year": 2026, "image": "https://example.com/primetime-poster.jpg" },\n  { "title": "Another Movie", "year": 2026, "poster": "assets/posters/another-movie.webp" }\n] }
```

**data/site.json**: `apkUrl` (a GitHub Release asset URL is best), `supportEmail`, and `screenshots` (`[{ "src": "assets/shot-1.webp", "alt": "Home screen" }]`).

## SEO (what's included)
- Unique title and description, canonical URL, robots directives, Open Graph and Twitter cards with a 1200x630 image.
- JSON-LD structured data: Organization, WebSite, MobileApplication, FAQPage (from the Troubleshooting section), plus SportsEvent and Movie/ItemList for real (non-sample) entries.
- Matches and movies are **pre-rendered into the HTML** at build time, so crawlers see them without running JavaScript. The site rebuilds daily to keep upcoming matches fresh.
- `sitemap.xml`, `robots.txt`, favicon, touch icons, web manifest, `lang`, semantic headings, `noindex` on the 404 page.

### Custom domain: deeprowss.com
The site is built for `https://deeprowss.com` (canonical URLs, social tags, sitemap and structured data all use it). To use a different address, set a repository variable `SITE_URL` (Settings → Secrets and variables → Actions → Variables).

Set it up once:
1. Settings → Pages → **Custom domain**: enter `deeprowss.com` and save, then tick **Enforce HTTPS** once it's available.
2. At your domain registrar, add DNS records for the apex domain: four `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and optionally `AAAA` records, see GitHub's docs). Add a `CNAME` record for `www` pointing to `deeprows.github.io`.
3. Because the domain is at the root, `robots.txt` and `sitemap.xml` work normally. Add the site in Google Search Console and Bing Webmaster Tools and submit `https://deeprowss.com/sitemap.xml`.

## Run locally
```
SITE_URL=http://localhost:8080 node scripts/build.mjs
npx serve _site        # or: python3 -m http.server 8080 -d _site
```

## Publish
Settings → Pages → Source: **GitHub Actions** (one time). Pushing to `main` runs `pages.yml`; it also runs daily and from the Actions tab. `ci.yml` checks JS, JSON, required files and links on pull requests and other branches.

## Before going live
1. Add the real APK (or set `apkUrl`); `assets/deeprowss.apk` does not exist yet.
2. Replace the sample matches, movies and screenshots.
