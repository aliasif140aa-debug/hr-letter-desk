/* Amilla HR Letters · phone behaviour. Only adds things around the main page; it never changes your data. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const mq = matchMedia('(max-width:760px)');
  const hl = () => window.__hl || {};

  /* header height, so the sticky step bar sits right under it */
  const hdr = $('header.bar');
  const setH = () => document.documentElement.style.setProperty('--hdrh', hdr.offsetHeight + 'px');
  try { new ResizeObserver(setH).observe(hdr); } catch { addEventListener('resize', setH); }
  setH();

  /* icons for the bottom tab bar */
  const svg = p => `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICONS = {
    generate: svg('<path d="M6 2.5h7l4 4V18a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 18V4A1.5 1.5 0 015.5 2.5z"/><path d="M12.5 2.8V7H17M8 11h6M8 14.5h4"/>'),
    templates: svg('<rect x="3" y="3.5" width="16" height="15" rx="2.5"/><path d="M3 8.5h16M9 8.5v10"/>'),
    setup: svg('<path d="M4 6.5h8M16 6.5h2M4 15.5h2M10 15.5h8"/><circle cx="14" cy="6.5" r="2"/><circle cx="8" cy="15.5" r="2"/>'),
    upcoming: svg('<rect x="3.5" y="4.5" width="15" height="14" rx="2.5"/><path d="M3.5 9h15M7.5 2.8v3.4M14.5 2.8v3.4"/>'),
    log: svg('<path d="M4 6.5h14M4 11h14M4 15.5h8"/><path d="M15 15.5l1.6 1.6L19.5 14"/>')
  };
  $$('.tabs button[data-tab]').forEach(b => { if (!b.querySelector('.ti') && ICONS[b.dataset.tab]) b.insertAdjacentHTML('afterbegin', `<span class="ti">${ICONS[b.dataset.tab]}</span>`); });

  /* ---------- Generate: Staff → Letter → Preview ---------- */
  const sec = $('#tab-generate'), gen = $('.gen'), stage = $('.stage');
  sec.insertAdjacentHTML('afterbegin',
    '<div class="mstep" id="mstep" role="group" aria-label="Steps">' +
    '<button type="button" data-step="staff" aria-selected="true"><b>1</b>Staff</button>' +
    '<button type="button" data-step="letter" aria-selected="false"><b>2</b>Letter</button>' +
    '<button type="button" data-step="preview" aria-selected="false"><b>3</b>Preview</button></div>');
  gen.dataset.m = 'staff';

  $('.work-pane').insertAdjacentHTML('beforeend',
    '<div class="m-act m-act-letter"><button type="button" class="btn" data-step="preview">Preview</button>' +
    '<button type="button" class="btn primary mdl">Download PDF</button></div>');
  stage.insertAdjacentHTML('beforeend',
    '<div class="m-act"><button type="button" class="btn" data-step="letter">‹ Details</button>' +
    '<button type="button" class="btn" id="mZoom">Zoom in</button>' +
    '<button type="button" class="btn primary mdl">Download PDF</button></div>');

  function setStep(s) {
    if (gen.dataset.m === s) return;
    gen.dataset.m = s;
    $$('#mstep button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.step === s)));
    if (mq.matches) scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    dispatchEvent(new Event('resize'));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (b && mq.matches) setStep(b.dataset.step);
  });

  /* picking a person moves on to the letter */
  $('#staffList').addEventListener('click', e => {
    if (!mq.matches || !e.target.closest('.person')) return;
    if ($('#batchToggle').getAttribute('aria-pressed') === 'true') return;
    setStep('letter');
  });
  $('#staffList').addEventListener('click', e => { if (mq.matches && e.target.closest('#manualFromEmpty')) setTimeout(() => setStep('letter'), 0); });
  $('#q').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !mq.matches) return;
    const before = hl().st && hl().st.P && hl().st.P.key;
    setTimeout(() => { const P = hl().st && hl().st.P; if (P && P.key !== before && gen.dataset.m === 'staff') setStep('letter'); }, 0);
  });

  /* arriving at Generate from somewhere else with a person already chosen (Upcoming → Open, Templates → Use it) */
  let navTap = false;
  $('.tabs').addEventListener('pointerdown', () => { navTap = true; setTimeout(() => { navTap = false; }, 400); }, true);
  new MutationObserver(() => {
    if (sec.hidden) return;
    if (!navTap && mq.matches && hl().st && hl().st.P && gen.dataset.m === 'staff') setStep('letter');
  }).observe(sec, { attributes: true, attributeFilter: ['hidden'] });

  /* download from the sticky bars (the big button inside the form is hidden on phones) */
  const dl = $('#dlBtn'), mDls = $$('.mdl');
  const syncDl = () => { const t = ($('#dlLabel') || dl).textContent.trim() || 'Download PDF'; mDls.forEach(b => { b.disabled = dl.disabled; b.textContent = t; }); };
  try { new MutationObserver(syncDl).observe(dl, { attributes: true, childList: true, subtree: true, characterData: true }); } catch {}
  syncDl();
  const say = t => { const el = $('#toast'); if (!el || !t) return; el.textContent = t; el.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => el.classList.remove('show'), 4200); };
  mDls.forEach(b => b.addEventListener('click', () => { dl.click(); setTimeout(() => { const n = $('#dlNote'); if (n && /warn|err/.test(n.className)) say(n.textContent); }, 60); }));
  $('#mZoom').addEventListener('click', () => { const z = stage.dataset.zoom === '2' ? '1' : '2'; stage.dataset.zoom = z; $('#mZoom').textContent = z === '2' ? 'Fit page' : 'Zoom in'; if (typeof queueFit === 'function') queueFit(); });


  /* ---------- edit view: show the letter at true page proportions ---------- */
  const edit = $('#letterEditor'), editWrap = $('#editWrap'), editInner = $('.edit-inner', editWrap);
  const PAPER_W = 740; /* the editor is built for a 740px-wide page; scale it to fit the screen */
  function fitEditor() {
    if (!mq.matches) { edit.style.transform = ''; edit.style.removeProperty('--s'); edit.style.removeProperty('--sinv'); editInner.style.width = editInner.style.height = ''; return; }
    const avail = editWrap.clientWidth - 16; if (avail <= 0) return;
    let s = Math.min(1, avail / PAPER_W);
    if (stage.dataset.zoom === '2') s = Math.min(1, s * 2);
    edit.style.transform = `scale(${s})`; edit.style.setProperty('--s', s); edit.style.setProperty('--sinv', (1 / s).toFixed(3));
    editInner.style.width = Math.round(PAPER_W * s) + 'px'; editInner.style.height = Math.ceil(edit.offsetHeight * s) + 'px';
  }
  let fitQ = false; const queueFit = () => { if (fitQ) return; fitQ = true; requestAnimationFrame(() => { fitQ = false; fitEditor(); }); };
  try { new ResizeObserver(queueFit).observe(edit); new ResizeObserver(queueFit).observe(editWrap); } catch {}
  new MutationObserver(queueFit).observe(editWrap, { attributes: true, attributeFilter: ['hidden'] });
  mq.addEventListener ? mq.addEventListener('change', queueFit) : mq.addListener(queueFit);
  addEventListener('resize', queueFit); addEventListener('orientationchange', queueFit);
  $('#viewSeg').addEventListener('click', () => setTimeout(queueFit, 30));
  queueFit();

  /* ---------- tables → cards: give every cell its column name ---------- */
  let queued = false;
  const labelTables = () => {
    queued = false;
    $$('table.log').forEach(t => {
      const heads = $$('thead th', t).map(h => h.textContent.trim());
      $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => { if (heads[i] && td.dataset.l !== heads[i]) td.dataset.l = heads[i]; }));
    });
  };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(labelTables); } }).observe($('main'), { subtree: true, childList: true });
  labelTables();
})();
