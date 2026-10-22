/* Amilla HR Letters · phone extras on top of the page's own layout: signature arrows, Send button, background PDF. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const hl = () => window.__hl || {};
  const touch = matchMedia('(pointer:coarse)');
  const mq = touch; /* the extras are for touch screens */
  const edit = $('#letterEditor'), editWrap = $('#editWrap'), sec = $('#tab-generate');
  const say = t => { const el = $('#toast'); if (!el || !t) return; el.textContent = t; el.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => el.classList.remove('show'), 4200); };

  /* ---------- edit view: nudge the signature / stamp with arrows ---------- */
  const NUDGE_STEPS = [0.2, 0.5, 1, 2];
  let nStep = 1, nKind = 'sig';
  const arrow = d => `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const nudgeRow = document.createElement('div');
  nudgeRow.className = 'cl-nudge'; nudgeRow.hidden = true;
  nudgeRow.innerHTML =
    '<div class="nseg" role="group" aria-label="Move which one"><button type="button" data-k="sig">Sign</button><button type="button" data-k="stamp">Stamp</button></div>' +
    '<div class="npad" role="group" aria-label="Move">' +
    `<button type="button" class="narr" data-dx="-1" data-dy="0" aria-label="Move left">${arrow('M11 3.5L5.5 9l5.5 5.5')}</button>` +
    `<button type="button" class="narr" data-dx="0" data-dy="-1" aria-label="Move up">${arrow('M3.5 11L9 5.5l5.5 5.5')}</button>` +
    `<button type="button" class="narr" data-dx="0" data-dy="1" aria-label="Move down">${arrow('M3.5 7L9 12.5 14.5 7')}</button>` +
    `<button type="button" class="narr" data-dx="1" data-dy="0" aria-label="Move right">${arrow('M7 3.5L12.5 9 7 14.5')}</button></div>` +
    '<button type="button" class="nstep" aria-label="Step size"></button>';
  document.body.appendChild(nudgeRow);
  const nStepBtn = $('.nstep', nudgeRow);
  const showStep = () => { nStepBtn.textContent = NUDGE_STEPS[nStep] + ' mm'; };
  showStep();
  const sigEls = kind => $$(`#letterEditor .sigbox img.sig-img[data-kind="${kind}"]`).filter(i => i.offsetParent !== null && i.getAttribute('src'));
  const markSel = () => { $$('#letterEditor img.sig-img.nsel').forEach(i => i.classList.remove('nsel')); if (!nudgeRow.hidden) sigEls(nKind).forEach(i => i.classList.add('nsel')); };
  function updateNudge() {
    const on = mq.matches && !sec.hidden && !editWrap.hidden && (sigEls('sig').length || sigEls('stamp').length);
    nudgeRow.hidden = !on; document.body.classList.toggle('has-nudge', !!on);
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
  /* the bar can change height while a finger is on an arrow; stop the lift from counting as a tap on whatever slid underneath */
  ['touchstart', 'touchend'].forEach(t => $('.npad', nudgeRow).addEventListener(t, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
  $('.npad', nudgeRow).addEventListener('keydown', e => { const b = e.target.closest('.narr'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nudge(+b.dataset.dx, +b.dataset.dy); } });


  /* keep the arrows just above the page's own sticky Download bar */
  const cta = $('.cta');
  const placeNudge = () => { if (nudgeRow.hidden || !cta) return; const r = cta.getBoundingClientRect(); const up = r.top < innerHeight && r.bottom > 0 ? innerHeight - r.top + 8 : 10; nudgeRow.style.bottom = `max(${Math.round(up)}px, calc(10px + env(safe-area-inset-bottom,0px)))`; };
  let pq = false; const queuePlace = () => { if (pq) return; pq = true; requestAnimationFrame(() => { pq = false; placeNudge(); }); };
  addEventListener('scroll', queuePlace, { passive: true }); addEventListener('resize', queuePlace);
  try { new MutationObserver(queuePlace).observe(nudgeRow, { attributes: true, attributeFilter: ['hidden'] }); if (cta) new ResizeObserver(queuePlace).observe(cta); } catch {}

  /* ---------- send the finished PDF to the person ---------- */
  const sendRows = [(() => {
    const r = document.createElement('div'); r.className = 'cl-send'; r.hidden = true;
    r.innerHTML = '<button type="button" class="btn sendgo"></button><button type="button" class="btn wa" hidden>WhatsApp chat</button>';
    ($('#dlNote') || $('#dlBtn')).insertAdjacentElement('afterend', r); return r;
  })()];
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
  ['input', 'change', 'sigmove'].forEach(t => document.addEventListener(t, e => { if (!sendStale && !e.target.closest?.('.cl-nudge,.cl-send')) { sendStale = true; updateSend(); } }, true));
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
  


  /* ---------- get the PDF ready in the background so Download opens the share sheet in one tap ---------- */
  setInterval(() => { if (mq.matches && !document.hidden && !sec.hidden && hl().prebuildPdf) hl().prebuildPdf(); }, 1300);
})();
