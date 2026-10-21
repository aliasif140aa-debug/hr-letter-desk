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


  /* ---------- edit view: nudge the signature / stamp with arrows ---------- */
  const NUDGE_STEPS = [0.2, 0.5, 1, 2];
  let nStep = 1, nKind = 'sig';
  const arrow = d => `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const nudgeRow = document.createElement('div');
  nudgeRow.className = 'm-row m-nudge'; nudgeRow.hidden = true;
  nudgeRow.innerHTML =
    '<div class="nseg" role="group" aria-label="Move which one"><button type="button" data-k="sig">Sign</button><button type="button" data-k="stamp">Stamp</button></div>' +
    '<div class="npad" role="group" aria-label="Move">' +
    `<button type="button" class="narr" data-dx="-1" data-dy="0" aria-label="Move left">${arrow('M11 3.5L5.5 9l5.5 5.5')}</button>` +
    `<button type="button" class="narr" data-dx="0" data-dy="-1" aria-label="Move up">${arrow('M3.5 11L9 5.5l5.5 5.5')}</button>` +
    `<button type="button" class="narr" data-dx="0" data-dy="1" aria-label="Move down">${arrow('M3.5 7L9 12.5 14.5 7')}</button>` +
    `<button type="button" class="narr" data-dx="1" data-dy="0" aria-label="Move right">${arrow('M7 3.5L12.5 9 7 14.5')}</button></div>` +
    '<button type="button" class="nstep" aria-label="Step size"></button>';
  const stageBar = $('.m-act', stage);
  stageBar.insertAdjacentElement('afterbegin', nudgeRow);
  const nStepBtn = $('.nstep', nudgeRow);
  const showStep = () => { nStepBtn.textContent = NUDGE_STEPS[nStep] + ' mm'; };
  showStep();
  const sigEls = kind => $$(`#letterEditor .sigbox img.sig-img[data-kind="${kind}"]`).filter(i => i.offsetParent !== null && i.getAttribute('src'));
  const markSel = () => { $$('#letterEditor img.sig-img.nsel').forEach(i => i.classList.remove('nsel')); if (!nudgeRow.hidden) sigEls(nKind).forEach(i => i.classList.add('nsel')); };
  function updateNudge() {
    const on = mq.matches && !editWrap.hidden && (sigEls('sig').length || sigEls('stamp').length);
    nudgeRow.hidden = !on;
    if (on) {
      if (!sigEls(nKind).length) nKind = sigEls('sig').length ? 'sig' : 'stamp';
      $$('.nseg button', nudgeRow).forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.k === nKind)); b.disabled = !sigEls(b.dataset.k).length; });
    }
    markSel();
  }
  let nq = false; const queueNudge = () => { if (nq) return; nq = true; requestAnimationFrame(() => { nq = false; updateNudge(); }); };
  try { new MutationObserver(queueNudge).observe(edit, { childList: true, subtree: true }); } catch {}
  new MutationObserver(queueNudge).observe(editWrap, { attributes: true, attributeFilter: ['hidden'] });
  addEventListener('resize', queueNudge);
  $('.nseg', nudgeRow).addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b || b.disabled) return; nKind = b.dataset.k; updateNudge(); });
  nStepBtn.addEventListener('click', () => { nStep = (nStep + 1) % NUDGE_STEPS.length; showStep(); });
  /* tapping the signature or stamp picks it, so the arrows move the one you touched */
  document.addEventListener('pointerdown', e => { const i = e.target.closest && e.target.closest('#letterEditor img.sig-img'); if (i && i.dataset.kind) { nKind = i.dataset.kind; if (!nudgeRow.hidden) updateNudge(); } }, true);

  function nudge(dx, dy) {
    const img = sigEls(nKind)[0]; if (!img) return;
    const box = img.closest('.sigbox'), k = +box.dataset.k || 3;
    if (nKind === 'stamp' && box.dataset.tdx === '') { box.dataset.tdx = (parseFloat(img.style.left) / k).toFixed(1); box.dataset.tdy = (parseFloat(img.style.top) / k).toFixed(1); }
    const px = nKind === 'sig' ? 'sdx' : 'tdx', py = nKind === 'sig' ? 'sdy' : 'tdy', st = NUDGE_STEPS[nStep];
    box.dataset[px] = ((+box.dataset[px] || 0) + dx * st).toFixed(1);
    box.dataset[py] = ((+box.dataset[py] || 0) + dy * st).toFixed(1);
    hl().layoutSigboxes(box.closest('.paper-edit').parentElement);
    box.dispatchEvent(new CustomEvent('sigmove', { bubbles: true, detail: hl().sigPosOf(box) }));
  }
  let nHold = null;
  const nStop = () => { clearTimeout(nHold); clearInterval(nHold); nHold = null; };
  $('.npad', nudgeRow).addEventListener('pointerdown', e => {
    const b = e.target.closest('.narr'); if (!b) return; e.preventDefault();
    const dx = +b.dataset.dx, dy = +b.dataset.dy; nStop(); nudge(dx, dy);
    nHold = setTimeout(() => { nHold = setInterval(() => nudge(dx, dy), 80); }, 380);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => $('.npad', nudgeRow).addEventListener(t, nStop));
  $('.npad', nudgeRow).addEventListener('contextmenu', e => e.preventDefault());
  $('.npad', nudgeRow).addEventListener('keydown', e => { const b = e.target.closest('.narr'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nudge(+b.dataset.dx, +b.dataset.dy); } });

  /* ---------- send the finished PDF to the person ---------- */
  const sendRows = $$('.m-act').map(bar => {
    const r = document.createElement('div'); r.className = 'm-row m-send'; r.hidden = true;
    r.innerHTML = '<button type="button" class="btn sendgo"></button><button type="button" class="btn wa" hidden>WhatsApp chat</button>';
    bar.insertAdjacentElement('afterbegin', r); return r;
  });
  let sendStale = true;
  const waNumber = c => { let d = String(c || '').replace(/[^\d+]/g, ''); if (!d) return ''; const plus = d[0] === '+'; d = d.replace(/\D/g, ''); if (!plus && d.length === 7) d = '960' + d; return d.length >= 8 ? d : ''; };
  const firstName = n => { const f = String(n || '').trim().split(/\s+/)[0] || ''; return f ? f[0].toUpperCase() + f.slice(1).toLowerCase() : ''; };
  function updateSend() {
    const L = window.__lastPdf, P = hl().st && hl().st.P;
    const ok = mq.matches && L && P && !sendStale && L.key === P.key && (!hl().curTpl || hl().curTpl().id === L.tplId);
    sendRows.forEach(r => {
      r.hidden = !ok; if (!ok) return;
      $('.sendgo', r).textContent = 'Send PDF to ' + (firstName(L.entry && L.entry.name) || 'staff');
      $('.wa', r).hidden = !waNumber(P.cell);
    });
  }
  addEventListener('pdfready', () => { sendStale = false; updateSend(); });
  /* anything that changes the letter after saving makes the saved PDF out of date */
  ['input', 'change', 'sigmove'].forEach(t => document.addEventListener(t, e => { if (!sendStale && !e.target.closest?.('.m-act')) { sendStale = true; updateSend(); } }, true));
  document.addEventListener('click', e => { if (!sendStale && e.target.closest('#staffList,#tplGrid,.tpl-chip,[data-sigact]')) setTimeout(() => { if (!sendStale) updateSend(); }, 0); }, true);
  const msgText = () => { const L = window.__lastPdf; try { return hl().emailText(L.entry).replace(/^Subject:[^\n]*\n\n/, ''); } catch { return ''; } };
  async function sendPdf() {
    const L = window.__lastPdf; if (!L) return;
    const file = new File([L.blob], L.name, { type: 'application/pdf' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: L.name, text: msgText() }); return; }
    } catch (err) { if (err && err.name === 'AbortError') return; }
    say('Sharing is not available here. Use Download PDF and send the file from Files.');
  }
  function openWa() {
    const P = hl().st && hl().st.P, n = waNumber(P && P.cell); if (!n) return;
    window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(msgText()), '_blank', 'noopener');
  }
  sendRows.forEach(r => { $('.sendgo', r).addEventListener('click', sendPdf); $('.wa', r).addEventListener('click', openWa); });
  mq.addEventListener ? mq.addEventListener('change', updateSend) : mq.addListener(updateSend);

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
