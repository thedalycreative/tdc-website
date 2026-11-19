/* The Daly Creative · free tools (shared helpers)
   - api():      calls /api/tools
   - unlock gate: a visitor gets a free taste, then one email unlocks every tool on this browser
   - leads go to the same inbox as the contact form, via formsubmit.co */
(function () {
  const LEAD_ENDPOINT = 'https://formsubmit.co/ajax/thedalycreative@gmail.com';
  const KEY = 'tdc-tools-lead';

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: in-memory only */ } },
  };
  let memoryLead = null;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(payload) {
    let res, data;
    try {
      res = await fetch('/api/tools', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      data = await res.json();
    } catch {
      throw new Error('Could not reach the tool. Check your connection and try again.');
    }
    if (!res.ok || data.error) throw new Error(data.error || 'Something went wrong. Try again.');
    return data;
  }

  const lead = () => memoryLead || store.get(KEY);
  const unlocked = () => !!lead();

  async function sendLead(fields) {
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ _template: 'table', _captcha: 'false', ...fields }),
    });
    if (!res.ok) throw new Error('send failed');
  }

  /* Renders the unlock form into `el`.
     opts: { tool, title, blurb, button, context(): {extra lead fields}, extra: html for extra fields, onUnlock(lead) } */
  function gate(el, opts) {
    el.innerHTML = `
      <form class="tool-gate card" novalidate>
        <h3>${esc(opts.title)}</h3>
        <p>${esc(opts.blurb)}</p>
        <div class="tool-gate-fields">
          <div class="form-field"><label for="g-name-${opts.tool}">First name</label><input id="g-name-${opts.tool}" name="name" autocomplete="given-name" required></div>
          <div class="form-field"><label for="g-email-${opts.tool}">Email</label><input id="g-email-${opts.tool}" name="email" type="email" autocomplete="email" required></div>
        </div>
        ${opts.extra || ''}
        <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="btn btn-primary btn-block" type="submit">${esc(opts.button || 'Unlock it')}</button>
        <p class="form-note" role="status" aria-live="polite">One email from Tim at most. No newsletters, no spam.</p>
      </form>`;
    const form = el.querySelector('form');
    const note = form.querySelector('[role=status]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = form.elements;
      if (f.namedItem('_honey').value) return;
      const name = f.namedItem('name').value.trim(), email = f.namedItem('email').value.trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { note.textContent = 'Add your first name and a valid email.'; return; }
      const btn = form.querySelector('button');
      btn.disabled = true; note.textContent = 'Unlocking…';
      const extra = {};
      form.querySelectorAll('[data-lead]').forEach((f) => { extra[f.name] = f.type === 'checkbox' ? (f.checked ? 'Yes' : 'No') : f.value; });
      const me = { name, email };
      try {
        await sendLead({
          _subject: `New tool lead · ${opts.tool} · ${name}`,
          name, email, tool: opts.tool, page: location.pathname,
          ...(opts.context ? opts.context() : {}), ...extra,
        });
      } catch { /* still unlock: never punish the visitor for a mail hiccup */ }
      memoryLead = me; store.set(KEY, me);
      opts.onUnlock(me, extra);
    });
  }

  /* Minimal, safe renderer for "## heading" / "- bullet" text from the AI. */
  function renderReport(text) {
    let html = '', inList = false;
    for (const raw of String(text).split('\n')) {
      const line = raw.trim().replace(/\*\*/g, '');
      if (!line) continue;
      if (line.startsWith('## ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h3>${esc(line.slice(3))}</h3>`; }
      else if (/^[-•*]\s/.test(line)) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${esc(line.replace(/^[-•*]\s/, ''))}</li>`; }
      else { if (inList) { html += '</ul>'; inList = false; } html += `<p>${esc(line)}</p>`; }
    }
    return html + (inList ? '</ul>' : '');
  }

  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch { /* ignore */ } t.remove();
    }
    const was = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = was; }, 1600);
  }

  window.TDCTools = { api, gate, unlocked, lead, esc, renderReport, copy, store };
})();
