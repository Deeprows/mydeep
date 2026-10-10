(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, props = {}, kids = []) => {
    const n = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    });
    kids.forEach(k => n.append(k));
    return n;
  };
  const load = u => fetch(u).then(r => (r.ok ? r.json() : Promise.reject())).catch(() => null);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Year */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* Content comes from data/*.json. If a fetch fails (e.g. opened from file://),
     the pre-rendered HTML stays in place. */
  Promise.all([load('data/site.json'), load('data/matches.json'), load('data/movies.json')]).then(([site, m, mv]) => {
  const D = { ...(site || {}), matches: m && m.matches, movies: mv && mv.movies };

  /* Config: download + support links */
  if (D.apkUrl) $$('[data-apk]').forEach(a => a.setAttribute('href', D.apkUrl));
  if (D.apkUrlAlt) $$('[data-apk-alt]').forEach(a => a.setAttribute('href', D.apkUrlAlt));
  if (D.supportEmail) $$('[data-mail]').forEach(a => a.setAttribute('href', 'mailto:' + D.supportEmail));

  /* Mobile menu */
  const toggle = $('.menu-toggle');
  const nav = $('.nav');
  if (toggle && nav) {
    const setOpen = open => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', e => {
      if (nav.classList.contains('open') && !e.target.closest('.site-header')) setOpen(false);
    });
  }

  /* Highlight current section in nav */
  const links = $$('.nav a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.remove('active'));
          const a = map.get(en.target.id);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* Matches */
  const list = $('#matches-list');
  if (list && Array.isArray(D.matches)) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const resolve = m => {
      if (m.date) return new Date(m.date);
      const [h, min] = (m.time || '00:00').split(':').map(Number);
      const d = new Date(startOfToday);
      d.setDate(d.getDate() + (m.inDays || 0));
      d.setHours(h, min, 0, 0);
      return d;
    };
    const dayLabel = d => {
      const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - startOfToday) / 864e5);
      if (diff === 0) return 'TODAY';
      if (diff === 1) return 'TOMORROW';
      if (diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
    };
    const upcoming = D.matches
      .map(m => ({ ...m, when: resolve(m) }))
      .filter(m => m.when.getTime() > now.getTime() - 2 * 3600e3) // keep matches for ~2h after kickoff
      .sort((a, b) => a.when - b.when);

    list.replaceChildren();
    if (!upcoming.length) {
      list.append(el('p', { class: 'empty', text: 'No upcoming matches listed right now. Open the app for the latest schedule.' }));
    }
    upcoming.forEach(m => {
      const kicked = m.when <= now;
      const time = m.when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const date = el('span', { class: 'match-date' + (kicked ? ' live' : ''), text: kicked ? 'LIVE NOW' : `${dayLabel(m.when)} • ${time}` });
      const title = el('h3', {}, [`${m.home} `, el('b', { text: 'vs' }), ` ${m.away}`]);
      const link = el('a', { href: 'download.html', 'aria-label': `Watch ${m.home} vs ${m.away} in the app` , text: 'Watch in App →' });
      list.append(el('article', { class: 'match-card' + (kicked ? ' live' : '') }, [el('div', {}, [date, title]), link]));
    });
  }

  /* Movies */
  const grid = $('#movie-grid');
  if (grid && Array.isArray(D.movies)) {
    grid.replaceChildren();
    D.movies.forEach((m, i) => {
      const poster = el('div', { class: `poster poster-${(i % 4) + 1}` });
      const posterUrl = typeof m.image === 'string' && m.image.trim()
        ? m.image.trim()
        : (typeof m.poster === 'string' ? m.poster.trim() : '');
      if (posterUrl) {
        const img = el('img', { src: posterUrl, alt: `${m.title} poster`, loading: 'lazy', width: 300, height: 450 });
        img.addEventListener('error', () => {
          poster.replaceChildren(el('span', { 'aria-hidden': 'true', text: `POSTER ${String(i + 1).padStart(2, '0')}` }));
        }, { once: true });
        poster.append(img);
      } else {
        poster.append(el('span', { 'aria-hidden': 'true', text: `POSTER ${String(i + 1).padStart(2, '0')}` }));
      }
      grid.append(el('article', { class: 'movie-card' }, [poster, el('h3', { text: m.title }), el('p', { text: String(m.year || '') })]));
    });
  }

  /* Screenshot carousel */
  const carousel = $('[data-carousel="screenshots"]');
  if (carousel) {
    const track = $('.carousel-track', carousel);
    const dotsWrap = $('.dots');
    const shots = (D.screenshots && D.screenshots.length)
      ? D.screenshots
      : [1, 2, 3, 4].map(n => ({ placeholder: `App Screenshot ${n}` }));

    shots.forEach((s, i) => {
      const inner = s.src
        ? el('img', { src: s.src, alt: s.alt || `Deeprowss screenshot ${i + 1}`, loading: i ? 'lazy' : 'eager' })
        : el('div', { class: 'placeholder-screen', text: s.placeholder });
      track.append(el('div', { class: 'slide', role: 'group', 'aria-roledescription': 'slide', 'aria-label': `${i + 1} of ${shots.length}` }, [inner]));
      const dot = el('button', { class: 'dot', type: 'button', 'aria-label': `Show screenshot ${i + 1}` });
      dot.addEventListener('click', () => { go(i); stop(); });
      dotsWrap.append(dot);
    });

    const slides = $$('.slide', carousel);
    const dots = $$('.dot', dotsWrap);
    let index = 0, timer = null;

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, n) => s.toggleAttribute('inert', n !== index));
      dots.forEach((d, n) => {
        d.classList.toggle('active', n === index);
        if (n === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => { if (!reduceMotion && !timer && slides.length > 1) timer = setInterval(() => go(index + 1), 5000); };

    $('.prev', carousel).addEventListener('click', () => { go(index - 1); stop(); });
    $('.next', carousel).addEventListener('click', () => { go(index + 1); stop(); });
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { go(index - 1); stop(); }
      if (e.key === 'ArrowRight') { go(index + 1); stop(); }
    });

    let startX = 0;
    carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1));
    }, { passive: true });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : null);

    go(0);
    // Only auto-advance while the carousel is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => en.isIntersecting ? start() : stop(), { threshold: 0.4 }).observe(carousel);
    }
  }
  });
})();
