(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Catalog: search + group filter over the pre-rendered cards */
  const grid = $('#app-grid');
  if (grid) {
    const cards = $$('.app-card', grid);
    const input = $('#app-search');
    const chips = $$('.chip');
    const empty = $('#app-empty');
    let group = '';

    const apply = () => {
      const q = (input ? input.value : '').trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => {
        const ok = (!group || c.dataset.group === group) && (!q || c.dataset.name.includes(q));
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    };

    if (input) input.addEventListener('input', apply);
    chips.forEach(chip => chip.addEventListener('click', () => {
      group = chip.dataset.filter || '';
      chips.forEach(c => {
        const on = c === chip;
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      apply();
    }));
  }

  /* Detail page: native share sheet, falling back to copying the link */
  $$('[data-share]').forEach(btn => btn.addEventListener('click', async () => {
    const data = { title: btn.dataset.title, url: location.href };
    const label = $('span', btn);
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        if (label) { label.textContent = 'Link copied'; setTimeout(() => { label.textContent = 'Share'; }, 2000); }
      }
    } catch (_) { /* user cancelled */ }
  }));
})();
