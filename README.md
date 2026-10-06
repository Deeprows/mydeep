# Deeprowss Website

A plain, mobile-first promotional site for the Deeprowss Android app. No build step — it runs on GitHub Pages as-is.

## Structure
```
index.html        main page
privacy.html      privacy policy
404.html          not-found page
css/style.css     all styles
js/data.js        ← edit this: APK link, support email, screenshots, matches, movies
js/app.js         behaviour (menu, carousel, rendering from data.js)
assets/           favicon, screenshots, posters, APK
```

## Update content (js/data.js)
- **APK link:** set `apkUrl`. A GitHub Release asset URL is recommended over committing the APK.
- **Screenshots:** drop images into `assets/` and list them in `screenshots` (`{ src, alt }`). Empty list shows placeholders.
- **Matches:** use `date: "2026-10-10T20:00"` for real fixtures. Finished matches are hidden automatically and a match shows "LIVE NOW" after kickoff. The sample `inDays` entries are placeholders — replace them.
- **Movies:** add `poster: "assets/your-poster.webp"` for real artwork.
- **Support email:** `supportEmail` (also update it in `privacy.html`).

## Before publishing
1. Add your real APK (or set `apkUrl`) — `assets/deeprowss.apk` does not exist in this repo yet.
2. Replace the sample matches, movies and screenshots.

## Publish on GitHub Pages
Push to a repository, then Settings → Pages → deploy from the main branch (root).

## What changed in this upgrade
- Content moved to `js/data.js`; matches show relative day labels and expire on their own.
- One config value now drives every download button and the support link.
- Accessibility: skip link, visible focus, labelled carousel with keyboard/swipe support, Escape closes the menu, reduced-motion respected, semantic ordered list for install steps.
- Carousel: real images supported, auto-advance only while visible, pauses on hover/touch/interaction.
- SEO/sharing: meta description, Open Graph, theme colour, SVG favicon, 404 page.
- Performance: fonts load via `<link>` with preconnect instead of a blocking CSS `@import`.
- Removed the "replace the placeholders" note that was showing to visitors, and a no-op click handler.
- Privacy page now mentions the Google Fonts request.
