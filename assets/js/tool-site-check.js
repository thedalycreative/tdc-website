/* Website health check: score + top 3 fixes free, email unlocks the full report. */
(function () {
  const T = window.TDCTools;
  const form = document.getElementById('site-form');
  const out = document.getElementById('site-output');
  if (!form || !T) return;

  const colour = (s) => (s >= 85 ? 'var(--ai-green)' : s >= 65 ? 'var(--teal)' : s >= 45 ? 'var(--orange)' : '#B3261E');

  const item = (c) => `<li class="${c.status}"><strong>${T.esc(c.label)}</strong><span>${T.esc(c.detail)}</span>${c.status === 'pass' ? '' : `<em>${T.esc(c.fix)}</em>`}</li>`;

  function render(data, full) {
    const issues = data.checks.filter((c) => c.status !== 'pass');
    const passes = data.checks.filter((c) => c.status === 'pass');
    const top = issues.slice(0, 3);
    const rest = issues.slice(3);
    let host;
    try { host = new URL(data.url).hostname.replace(/^www\./, ''); } catch { host = data.url; }

    let html = `
      <div class="card score-card">
        <div class="score-dial" style="--v:${data.score}; --c:${colour(data.score)};" role="img" aria-label="Score ${data.score} out of 100"><b>${data.score}<small>/100</small></b></div>
        <div>
          <h2>${T.esc(data.grade)}</h2>
          <p><strong>${T.esc(host)}</strong>. ${issues.length ? `We found ${issues.length} thing${issues.length === 1 ? '' : 's'} to fix and ${passes.length} already done well.` : 'Every check passed. Nice work.'}</p>
        </div>
      </div>`;
    if (top.length) html += `<h3 style="margin-top:8px;">Your biggest fixes</h3><ul class="check-results">${top.map(item).join('')}</ul>`;

    const remaining = [...rest, ...passes];
    if (!remaining.length) { out.innerHTML = html + cta(); return; }

    if (full) {
      if (rest.length) html += `<h3 style="margin-top:8px;">Also worth fixing</h3><ul class="check-results">${rest.map(item).join('')}</ul>`;
      if (passes.length) html += `<h3 style="margin-top:8px;">Already done well</h3><ul class="check-results">${passes.map(item).join('')}</ul>`;
      out.innerHTML = html + cta();
      return;
    }

    html += `<div class="locked-wrap"><ul class="check-results" aria-hidden="true">${remaining.map(item).join('')}</ul><div id="site-gate"></div></div>`;
    out.innerHTML = html;
    T.gate(document.getElementById('site-gate'), {
      tool: 'Website health check',
      title: `See the other ${remaining.length} results`,
      blurb: 'Get the full report, with every check and how to fix it. It also unlocks the other free tools.',
      button: 'Show my full report',
      extra: `<label class="gate-check"><input type="checkbox" name="video_review" data-lead checked> <span>Yes, Tim can send me a free 2-minute video walkthrough of my site</span></label>`,
      context: () => ({
        website: data.url, score: `${data.score}/100 (${data.grade})`,
        issues: issues.map((c) => `${c.status.toUpperCase()}: ${c.label}`).join(' | '),
      }),
      onUnlock: (me, extra) => {
        render(data, true);
        if (extra.video_review === 'Yes') out.insertAdjacentHTML('afterbegin', `<p class="card" style="background:var(--tr-mist); box-shadow:none;">Thanks ${T.esc(me.name)}! Tim will send your video walkthrough of ${T.esc(host)} within a couple of business days.</p>`);
      },
    });
  }

  const cta = () => `
    <div class="card tool-cta">
      <h3>Want these fixed for you?</h3>
      <p>Most of these are quick jobs for a web designer. Tim can tell you what's worth doing first, and what it would cost, on a free 20-minute call.</p>
      <div class="btn-row"><a class="btn btn-ink btn-arrow" href="/contact">Book a free chat</a><a class="btn btn-ghost" href="/pricing">See pricing</a></div>
    </div>`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = form.elements.namedItem('url').value.trim();
    if (!url) { out.innerHTML = '<p class="tool-error">Enter your website address.</p>'; return; }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    out.innerHTML = '<p class="tool-loading">Checking your site… this takes about 15 seconds.</p>';
    try {
      const data = await T.api({ tool: 'site-check', url });
      render(data, T.unlocked());
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      out.innerHTML = `<p class="tool-error">${T.esc(err.message)}</p>`;
    } finally {
      btn.disabled = false;
    }
  });
})();
