/* Google review reply writer: 1 free reply, then email unlocks 3 options per review. */
(function () {
  const T = window.TDCTools;
  const form = document.getElementById('review-form');
  const out = document.getElementById('review-output');
  if (!form || !T) return;
  const FREE_KEY = 'tdc-review-free-used';
  let freeUsed = !!T.store.get(FREE_KEY);
  let pending = null;

  const values = () => {
    const f = new FormData(form);
    return {
      tool: 'review-reply',
      business: f.get('business'), reviewer: f.get('reviewer'),
      rating: f.get('rating'), tone: f.get('tone'), review: f.get('review'),
    };
  };

  function cards(replies) {
    return replies.map((r, i) => `
      <div class="card reply-card">
                <p>${T.esc(r)}</p>
        <div class="reply-actions"><button type="button" class="btn btn-ink btn-sm" data-copy="${i}">Copy reply</button></div>
      </div>`).join('');
  }

  function bindCopy(replies) {
    out.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => T.copy(replies[+b.dataset.copy], b)));
  }

  function showGate(afterHtml) {
    const slot = document.createElement('div');
    out.innerHTML = afterHtml || '';
    out.appendChild(slot);
    T.gate(slot, {
      tool: 'Review reply writer',
      title: afterHtml ? 'Want 3 options for every review?' : "That's your free reply used",
      blurb: 'Pop your email in once and get three different replies for every review, as often as you like. It also unlocks the other free tools.',
      button: 'Unlock unlimited replies',
      context: () => ({ business: form.elements.namedItem('business').value }),
      onUnlock: () => { slot.remove(); if (pending) run(pending); },
    });
  }

  async function run(payload) {
    pending = null;
    const count = T.unlocked() ? 3 : 1;
    out.innerHTML = '<p class="tool-loading">Writing your reply…</p>';
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const { replies } = await T.api({ ...payload, count });
      if (!T.unlocked()) {
        freeUsed = true; T.store.set(FREE_KEY, true);
        showGate(cards(replies));
      } else {
        out.innerHTML = cards(replies);
      }
      bindCopy(replies);
    } catch (err) {
      out.innerHTML = `<p class="tool-error">${T.esc(err.message)}</p>`;
    } finally {
      btn.disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = values();
    if (!String(v.review || '').trim()) { out.innerHTML = '<p class="tool-error">Paste the review you want to reply to.</p>'; form.elements.namedItem('review').focus(); return; }
    if (freeUsed && !T.unlocked()) { pending = v; showGate(''); return; }
    run(v);
  });
})();
