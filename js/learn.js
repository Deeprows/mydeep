(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let waNumber = '';
  let supportEmail = 'support@deeprowss.com';
  const waLink = text => {
    const q = text ? '?text=' + encodeURIComponent(text) : '';
    return waNumber ? `https://wa.me/${waNumber}${q}` : `mailto:${supportEmail}${text ? '?body=' + encodeURIComponent(text) : ''}`;
  };

  /* WhatsApp number comes from data/site.json ("whatsapp": digits only, with country code) */
  fetch('data/site.json').then(r => (r.ok ? r.json() : null)).catch(() => null).then(site => {
    if (site) {
      waNumber = String(site.whatsapp || '').replace(/\D/g, '');
      if (site.supportEmail) supportEmail = site.supportEmail;
    }
    const hello = 'Hi! I want to learn how to build an Android app with free AI tools.';
    $$('[data-wa]').forEach(a => {
      if (!a.getAttribute('href') || a.getAttribute('href') === '__WA__' || waNumber) a.setAttribute('href', waLink(hello));
    });
  });

  /* Request form -> opens WhatsApp with the message filled in */
  const form = $('#rform');
  const msg = $('#form-msg');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim();
      const idea = form.idea.value.trim();
      [form.name, form.idea].forEach(f => f.classList.toggle('invalid', !f.value.trim()));
      if (!name || !idea) {
        msg.textContent = 'Add your name and your app idea, then send again.';
        msg.hidden = false;
        (name ? form.idea : form.name).focus();
        return;
      }
      msg.hidden = true;
      const text = `Hi! My name is ${name}.\nI want to learn how to build an Android app with free AI tools.\n\nMy idea: ${idea}\nExperience: ${form.level.value}`;
      window.open(waLink(text), '_blank', 'noopener');
    });
  }

  /* Hero: the idea types out, then the app appears */
  const stage = $('.lh-stage');
  const textEl = $('#idea-text');
  if (!stage || !textEl) return;
  const full = textEl.dataset.full;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  stage.classList.add('wait');
  textEl.textContent = '';
  textEl.classList.add('typing');
  let i = 0;
  const tick = () => {
    i += 1;
    textEl.textContent = full.slice(0, i);
    if (i < full.length) setTimeout(tick, 32);
    else setTimeout(() => { textEl.classList.remove('typing'); stage.classList.remove('wait'); }, 350);
  };
  setTimeout(tick, 500);
})();
