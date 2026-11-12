/* The Daly Creative — Google reviews widget. No dependencies.
   Mount: <div id="tdc-reviews"></div>. Silent-fails if the API is unreachable. */
(() => {
  'use strict';

  const mount = document.getElementById('tdc-reviews');
  if (!mount) return;

  const ENDPOINT = '/api/reviews';
  const REVIEW_URL = 'https://g.page/r/CbXKZ6fcMfuYEBI/review';

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  const initials = (name) =>
    String(name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const star = (filled) =>
    `<svg viewBox="0 0 20 20" class="rv-star${filled ? ' rv-star-full' : ''}" aria-hidden="true"><path d="M10 1.5l2.76 5.59 6.17.9-4.47 4.35 1.06 6.14L10 15.6l-5.52 2.88 1.06-6.14L1.07 7.99l6.17-.9z"/></svg>`;

  const stars = (n) => {
    const rounded = Math.round(n || 0);
    return Array.from({ length: 5 }, (_, i) => star(i < rounded)).join('');
  };

  const renderCard = (r) => {
    const avatarHtml = r.avatar
      ? `<img src="${esc(r.avatar)}" alt="" class="rv-avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=\\'rv-avatar rv-avatar-fallback\\'>${esc(initials(r.author))}</div>'">`
      : `<div class="rv-avatar rv-avatar-fallback">${esc(initials(r.author))}</div>`;
    return `
      <figure class="card rv-card reveal">
        <div class="rv-stars" aria-label="${r.rating} out of 5 stars">${stars(r.rating)}</div>
        <blockquote class="rv-text"><p>${esc(r.text)}</p></blockquote>
        <figcaption class="rv-meta">
          ${avatarHtml}
          <div class="rv-author-block">
            <span class="rv-author">${esc(r.author)}</span>
            <span class="rv-time">${esc(r.relativeTime)}</span>
          </div>
        </figcaption>
      </figure>
    `;
  };

  const renderEmpty = () => {
    mount.innerHTML = `
      <p class="rv-empty">
        Reviews are rolling in.
        <a href="${REVIEW_URL}" target="_blank" rel="noopener">Be the first to leave one.</a>
      </p>
    `;
  };

  const render = (data) => {
    const list = Array.isArray(data.reviews) ? data.reviews : [];
    if (!list.length) return renderEmpty();

    const summary = `
      <div class="rv-summary">
        <span class="rv-summary-score">${(data.rating || 0).toFixed(1)}</span>
        <span class="rv-summary-stars">${stars(data.rating || 0)}</span>
        <span class="rv-summary-count">${data.total || list.length} Google review${(data.total || list.length) === 1 ? '' : 's'}</span>
        <a class="rv-summary-cta" href="${REVIEW_URL}" target="_blank" rel="noopener">Leave a review</a>
      </div>
    `;

    const gridCls = list.length === 1 ? 'rv-grid rv-grid-1' : list.length === 2 ? 'rv-grid rv-grid-2' : 'rv-grid';

    mount.innerHTML = `${summary}<div class="${gridCls}">${list.map(renderCard).join('')}</div>`;

    // Re-arm reveal animations if the site's observer has already passed
    if (document.documentElement.classList.contains('reveal-armed')) {
      mount.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    }
  };

  // Silent-fail: if the widget can't load, hide the whole block rather than show broken UI.
  const fail = () => { mount.closest('.section')?.setAttribute('hidden', ''); };

  fetch(ENDPOINT, { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('non-ok'))))
    .then(render)
    .catch(fail);
})();
