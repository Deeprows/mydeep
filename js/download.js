(() => {
  'use strict';
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

  const isAndroid = /Android/i.test(ua);
  const isInApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger/i.test(ua);

  const copy = async btn => {
    const old = btn.textContent;
    try { await navigator.clipboard.writeText(location.href); btn.textContent = 'Link copied'; }
    catch (e) { window.prompt('Copy this link:', location.href); }
    setTimeout(() => { btn.textContent = old; }, 2000);
  };

  /* Non-Android visitors: tell them up front */
  if (!isAndroid) {
    const n = $('#not-android');
    if (n) n.hidden = false;
    const c = $('#copy-link');
    if (c) c.addEventListener('click', () => copy(c));
  }

  /* Facebook / Instagram in-app browser: push people to Chrome */
  if (isInApp && isAndroid) {
    const box = $('#iab');
    const open = $('#iab-open');
    if (box && open) {
      box.hidden = false;
      const u = new URL(location.href);
      open.href = 'intent://' + u.host + u.pathname + u.search +
        '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
        encodeURIComponent(u.href) + ';end';
    }
    const c = $('#iab-copy');
    if (c) c.addEventListener('click', () => copy(c));
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
    a.addEventListener('click', () => {
      track(a.dataset.track || 'link');
      if (isAndroid && sheet && !a.closest('#sheet')) setTimeout(() => { sheet.hidden = false; }, 700);
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
