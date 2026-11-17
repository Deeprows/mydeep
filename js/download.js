(() => {
  'use strict';
  /* ---- ANALYTICS SETUP (optional) ----
     Create a free account at https://www.goatcounter.com, then put your site code between the quotes.
     Leave empty to turn counting off. */
  const GOATCOUNTER_CODE = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ua = navigator.userAgent || '';

  /* Year */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* Links from data/site.json (same source as the rest of the site) */
  fetch('data/site.json').then(r => (r.ok ? r.json() : null)).catch(() => null).then(site => {
    if (!site) return;
    if (site.apkUrl) $$('[data-apk]').forEach(a => a.setAttribute('href', site.apkUrl));
    if (site.apkUrlAlt) $$('[data-apk-alt]').forEach(a => a.setAttribute('href', site.apkUrlAlt));
    if (site.supportEmail) $$('[data-mail]').forEach(a => a.setAttribute('href', 'mailto:' + site.supportEmail));
  });

  /* Funnel counter (GoatCounter). Events are queued until its script loads. */
  const queue = [];
  const ev = name => {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: 'funnel/' + name, title: name, event: true });
    } else queue.push(name);
  };
  if (GOATCOUNTER_CODE) {
    const sc = document.createElement('script');
    sc.async = true;
    sc.src = 'https://gc.zgo.at/count.js';
    sc.dataset.goatcounter = 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count';
    sc.addEventListener('load', () => { while (queue.length) ev(queue.shift()); });
    document.head.append(sc);
  }

  const isAndroid = /Android/i.test(ua);

  /* In-app browsers (Facebook, Instagram, X/Twitter, TikTok, etc.) often swallow APK downloads.
     X/Twitter does not put its name in the user agent, so also detect Android WebView ("wv")
     and a referrer from X/Twitter. */
  const knownApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Twitter|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp|Pinterest|Line\/|MicroMessenger|GSA\//i.test(ua);
  const webview = /; wv\)|\bwv\b/.test(ua);
  const ref = document.referrer || '';
  const fromSocial = /(^|\/\/)(t\.co|twitter\.com|x\.com|l\.facebook\.com|lm\.facebook\.com|m\.facebook\.com|l\.instagram\.com)\b|android-app:\/\/com\.(twitter|facebook|instagram)/i.test(ref);
  const metaApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger/i.test(ua);   /* these allow the open-in-browser link */
  const isInApp = isAndroid && (knownApp || webview || fromSocial);
  const certainInApp = isAndroid && (knownApp || webview);   /* downloads almost surely blocked */

  const copy = async btn => {
    const old = btn.textContent;
    try { await navigator.clipboard.writeText(location.href); btn.textContent = 'Link copied'; }
    catch (e) { window.prompt('Copy this link:', location.href); }
    setTimeout(() => { btn.textContent = old; }, 2000);
  };

  /* Intent link that opens this page in the phone's default browser (no hard-coded Chrome package,
     which caused "no app can perform this action" when Chrome wasn't the default or was disabled) */
  const chromeUrl = () => {
    const u = new URL(location.href);
    return 'intent://' + u.host + u.pathname + u.search +
      '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;' +
      'S.browser_fallback_url=' + encodeURIComponent(u.href) + ';end';
  };

  ev(!isAndroid ? '1-view-not-android' : (isInApp ? '1-view-android-in-app-browser' : '1-view-android-normal-browser'));

  /* Non-Android visitors: tell them up front */
  if (!isAndroid) {
    const n = $('#not-android');
    if (n) n.hidden = false;
    const c = $('#copy-link');
    if (c) c.addEventListener('click', () => copy(c));
  }

  /* In-app browser: push people to Chrome */
  const box = $('#iab');
  const showBox = () => {
    if (!box) return;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  };
  const openBtn = $('#iab-open');
  const copyBtn = $('#iab-copy');
  const help = $('#iab-help');
  const status = $('#iab-status');
  const copySilently = async () => {
    try { await navigator.clipboard.writeText(location.href); return true; } catch (e) { return false; }
  };
  if (isInApp && box) {
    box.hidden = false;
    if (metaApp) {
      /* Facebook / Instagram: the browser-intent link works */
      if (openBtn) {
        openBtn.href = chromeUrl();
        openBtn.addEventListener('click', () => ev('2-tap-open-in-browser'));
      }
      if (copyBtn) copyBtn.addEventListener('click', () => copy(copyBtn));
    } else {
      /* X / Twitter and other apps block intent links ("no app can perform this action"),
         so copy the link and tell people how to open it in their browser */
      if (openBtn) {
        openBtn.textContent = 'Copy link to open in browser';
        openBtn.href = '#';
        openBtn.addEventListener('click', async e => {
          e.preventDefault();
          ev('2-tap-copy-link');
          const ok = await copySilently();
          if (status) { status.hidden = false; status.textContent = ok ? 'Link copied. Now open Chrome and paste it in the address bar.' : 'Could not copy automatically. Tap the \u22ee menu near the page address and choose Open in browser.'; }
        });
      }
      if (copyBtn) copyBtn.hidden = true;
      if (help) help.innerHTML = 'Or tap <b>&#8942;</b> next to the page address (or at the top right), then choose <b>Open in browser</b> or <b>Open in Chrome</b>.';
    }
  }

  /* Download tap: track, then show the "what next" sheet */
  const sheet = $('#sheet');
  const closeSheet = () => { if (sheet) sheet.hidden = true; };
  const track = where => {
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
        window.fbq('trackCustom', 'ApkDownloadClick', { placement: where });
      }
      if (typeof window.gtag === 'function') window.gtag('event', 'apk_download_click', { placement: where });
    } catch (e) { /* tracking must never block the download */ }
  };
  $$('[data-apk],[data-apk-alt]').forEach(a => {
    a.addEventListener('click', e => {
      const where = a.dataset.track || 'link';
      track(where);
      ev('3-tap-download-' + where);
      /* Inside an in-app browser the download would silently fail: show the open-in-browser help instead */
      if (certainInApp && !a.hasAttribute('data-force')) {
        e.preventDefault();
        showBox();
        ev('2-blocked-download-tap');
        if (!metaApp) copySilently().then(ok => { if (ok && status) { status.hidden = false; status.textContent = 'Link copied. Now open Chrome and paste it in the address bar.'; } });
        return;
      }
      if (isInApp && !a.hasAttribute('data-force')) showBox();   /* unsure case: let the download try, show help */
      if (isAndroid && sheet && !a.closest('#sheet')) setTimeout(() => { sheet.hidden = false; ev('4-install-sheet-shown'); }, 700);
    });
  });
  const x = $('#sheet-x');
  if (x) x.addEventListener('click', closeSheet);
  if (sheet) sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  /* Sticky bar appears once the hero button is out of view */
  const bar = $('#sticky');
  const cta = $('#cta');
  if (bar && cta && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      const show = !en.isIntersecting && en.boundingClientRect.top < 0;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', String(!show));
      const b = $('.sticky-btn', bar);
      if (b) b.tabIndex = show ? 0 : -1;
    }).observe(cta);
  }
})();
