/* The Daly Creative — chat assistant widget. No dependencies.
   Talks to /api/chat (Claude via Vercel AI Gateway). Captured leads are
   emailed through formsubmit.co, the same inbox the contact form uses. */
(() => {
  'use strict';
  if (window.__tdcChat) return;
  window.__tdcChat = true;

  const API = '/api/chat';
  const LEAD_ENDPOINT = 'https://formsubmit.co/ajax/thedalycreative@gmail.com';
  const STORE = 'tdc-chat-v1';
  const GREETING = "G'day! I'm Tim's assistant at The Daly Creative. Ask me anything about websites, branding, AI or cyber security, or tell me about your project and I'll get Tim to follow up.";
  const STARTERS = ['What does a website cost?', 'Can you build me a chatbot?', 'I need help with my business'];

  /* ----- state (sessionStorage is a convenience only — it can fail) ----- */
  let state = { messages: [], leadSent: false, nudged: false };
  try { state = { ...state, ...JSON.parse(sessionStorage.getItem(STORE) || '{}') }; } catch { /* private mode etc. */ }
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch { /* ignore */ } };

  /* ----- tiny, safe formatter: escape first, then allow **bold**, links, lists ----- */
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((\/[a-z0-9\-/#]*|https?:\/\/[^\s)]+)\)/gi, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(\/(?:services|pricing|work|about|blog|contact)(?:#[a-z-]+)?)(?=[\s.,!?)]|$)/g, '$1<a href="$2">$2</a>')
    .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>')
    .replace(/(0414 265 050)/g, '<a href="tel:+61414265050">$1</a>');
  const format = (text) => {
    const blocks = text.trim().split(/\n{2,}/);
    return blocks.map((b) => {
      const lines = b.split('\n');
      if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
        return '<ul>' + lines.map((l) => `<li>${inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>`).join('') + '</ul>';
      }
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    }).join('');
  };

  /* ----- DOM ----- */
  const el = (tag, attrs = {}, html = '') => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (html) n.innerHTML = html;
    return n;
  };

  const launcher = el('button', { type: 'button', class: 'tdc-chat-launcher', 'aria-expanded': 'false', 'aria-controls': 'tdc-chat-panel' },
    '<span class="tdc-chat-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.1A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="3"/></svg><i></i></span><span class="tdc-chat-launch-label">Chat with us</span><span class="tdc-sr-only">, open chat assistant</span>');

  const panel = el('section', { id: 'tdc-chat-panel', class: 'tdc-chat-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'tdc-chat-title', hidden: '' });
  panel.innerHTML = `
    <header class="tdc-chat-head">
      <span class="tdc-chat-mark" aria-hidden="true"><span>t</span></span>
      <div>
        <h2 class="tdc-chat-title" id="tdc-chat-title">Chat with TDC</h2>
        <p class="tdc-chat-sub">AI assistant · Tim replies within 24h</p>
      </div>
      <button type="button" class="tdc-chat-close" aria-label="Close chat">×</button>
    </header>
    <div class="tdc-chat-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Conversation"></div>
    <div class="tdc-chat-chips" role="group" aria-label="Suggested questions"></div>
    <form class="tdc-chat-form">
      <label for="tdc-chat-input" class="tdc-sr-only">Type your message</label>
      <textarea id="tdc-chat-input" rows="1" maxlength="1500" placeholder="Type your message…" autocomplete="off"></textarea>
      <button type="submit" class="tdc-chat-send" aria-label="Send message">→</button>
    </form>
    <p class="tdc-chat-foot">AI can make mistakes — Tim confirms every quote. <a href="/privacy">Privacy</a></p>`;

  document.body.append(panel, launcher);

  const log = panel.querySelector('.tdc-chat-log');
  const chips = panel.querySelector('.tdc-chat-chips');
  const form = panel.querySelector('form');
  const input = panel.querySelector('textarea');
  const sendBtn = panel.querySelector('.tdc-chat-send');
  const closeBtn = panel.querySelector('.tdc-chat-close');
  let busy = false;

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const bubble = (role, text) => {
    const cls = role === 'user' ? 'tdc-msg-user' : role === 'note' ? 'tdc-msg-note' : 'tdc-msg-bot';
    const b = el('div', { class: `tdc-msg ${cls}` }, role === 'note' ? esc(text) : format(text));
    if (role !== 'note') b.prepend(el('span', { class: 'tdc-sr-only' }, role === 'user' ? 'You said: ' : 'Assistant: '));
    log.append(b); scroll();
    return b;
  };

  const renderChips = () => {
    chips.innerHTML = '';
    if (state.messages.length) return;
    STARTERS.forEach((q) => {
      const c = el('button', { type: 'button' }); c.textContent = q;
      c.addEventListener('click', () => send(q));
      chips.append(c);
    });
  };

  const renderAll = () => {
    log.innerHTML = '';
    bubble('assistant', GREETING);
    state.messages.forEach((m) => bubble(m.role, m.content));
    if (state.leadSent) bubble('note', '✓ Your details were sent to Tim');
    renderChips();
  };

  /* ----- open / close ----- */
  const isOpen = () => !panel.hidden;
  const open = () => {
    nudge?.remove();
    if (!log.childElementCount) renderAll();
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    document.body.classList.add('tdc-chat-open');
    scroll();
    input.focus();
  };
  const close = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('tdc-chat-open');
    launcher.focus();
  };
  launcher.addEventListener('click', () => (isOpen() ? close() : open()));
  closeBtn.addEventListener('click', close);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });

  /* ----- mobile keyboard handling -----
     On iOS/Android the soft keyboard doesn't resize the layout viewport, so
     100dvh keeps the panel full-screen and the input hides behind the keyboard.
     We track the visualViewport and expose its height as --tdc-vh for CSS.    */
  const syncViewport = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    document.documentElement.style.setProperty('--tdc-vh', vv.height + 'px');
    if (isOpen()) scroll();
  };
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncViewport);
    window.visualViewport.addEventListener('scroll', syncViewport);
    syncViewport();
  }

  /* ----- input ----- */
  const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });

  /* ----- lead delivery ----- */
  const sendLead = async (lead) => {
    const transcript = state.messages.map((m) => `${m.role === 'user' ? 'Visitor' : 'Bot'}: ${m.content}`).join('\n\n');
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        _subject: `New chat lead — ${lead.name}`,
        _template: 'table',
        _replyto: lead.email,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '—',
        service: lead.service || 'Not specified',
        message: lead.summary,
        source: `Website chat (${location.pathname})`,
        transcript,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || String(data.success) === 'false') throw new Error(data.message || 'send failed');
  };

  /* ----- talk to the bot ----- */
  async function send(raw) {
    const text = String(raw || '').trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    input.value = ''; grow();
    chips.innerHTML = '';

    state.messages.push({ role: 'user', content: text.slice(0, 1500) });
    save();
    bubble('user', text);

    const typing = el('div', { class: 'tdc-msg tdc-msg-bot', 'aria-label': 'Assistant is typing' }, '<span class="tdc-typing" aria-hidden="true"><i></i><i></i><i></i></span>');
    log.append(typing); scroll();

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: state.messages, leadSent: state.leadSent, page: location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (!res.ok || !data.reply) throw new Error(data.error || 'error');

      state.messages.push({ role: 'assistant', content: data.reply });
      save();
      bubble('assistant', data.reply);

      if (data.lead && !state.leadSent) {
        try {
          await sendLead(data.lead);
          state.leadSent = true; save();
          bubble('note', '✓ Your details were sent to Tim');
        } catch {
          bubble('note', "Hmm, your details didn't send. Please email thedalycreative@gmail.com or use the contact form.");
        }
      }
    } catch (err) {
      typing.remove();
      state.messages.pop(); save(); // let them retry the same message
      bubble('note', err.message && err.message !== 'error' ? err.message : "Sorry, I couldn't connect. Try again, or email thedalycreative@gmail.com.");
    } finally {
      busy = false; sendBtn.disabled = false;
      if (isOpen()) input.focus();
    }
  }

  /* ----- gentle one-time nudge (not on contact page, not if they've chatted) ----- */
  let nudge = null;
  if (!state.nudged && !state.messages.length && !/^\/contact/.test(location.pathname)) {
    setTimeout(() => {
      if (isOpen() || state.nudged) return;
      state.nudged = true; save();
      nudge = el('div', { class: 'tdc-chat-nudge', role: 'status' }, 'Got a project in mind? Ask me anything 👋');
      const x = el('button', { type: 'button', 'aria-label': 'Dismiss' }, '×');
      x.addEventListener('click', () => nudge.remove());
      nudge.append(x);
      nudge.addEventListener('click', (e) => { if (e.target !== x) open(); });
      document.body.append(nudge);
      setTimeout(() => nudge?.remove(), 12000);
    }, 9000);
  }
})();
