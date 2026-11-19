/* AI readiness quiz: score + hours estimate free, email unlocks a personalised AI plan. */
(function () {
  const T = window.TDCTools;
  const box = document.getElementById('quiz');
  const out = document.getElementById('quiz-output');
  if (!box || !T) return;

  // [question, [[option, points or null], ...], area]
  const Q = [
    ['What kind of business do you run?', [['Trades or home services'], ['Retail or online shop'], ['Hospitality or food'], ['Health, beauty or wellness'], ['Professional services'], ['Creative or events'], ['Something else']]],
    ['How many people work in the business?', [['Just me'], ['2 to 5'], ['6 to 20'], ['More than 20']]],
    ['How do new enquiries reach you?', [['Mostly phone calls', 1], ['Email and website forms', 2], ['Social media messages', 2], ['All over the place', 3]], 'enquiries'],
    ['How fast do you usually reply to a new enquiry?', [['Within minutes', 0], ['Same day', 1], ['A day or two', 2], ['Some slip through the cracks', 3]], 'enquiries'],
    ['How many hours a week go on admin like quotes, invoices, bookings and emails?', [['Under 2 hours', 0], ['2 to 5 hours', 1], ['5 to 10 hours', 2], ['More than 10 hours', 3]], 'admin'],
    ['How often do you copy the same info between apps or spreadsheets?', [['Never', 0], ['Sometimes', 1], ['Every day', 2], ["Constantly, it's half my job", 3]], 'admin'],
    ['Who writes your posts, emails and marketing?', [['I already use AI for it', 0], ['Someone else does it', 1], ['I do it, slowly', 2], ['Honestly, I avoid it', 3]], 'marketing'],
    ['Where does your customer info live?', [['One system or CRM', 1], ['A few different apps', 2], ['Spreadsheets', 2], ['My head and a notebook', 3]], 'systems'],
    ['Have you used ChatGPT, Claude or similar?', [['Most days', 0], ['Tried it a few times', 1], ['Not really', 2], ['It makes me a bit nervous', 2]], 'confidence'],
    ['What matters most in the next 12 months?', [['More leads and sales'], ['Less admin, more free time'], ['Faster, better customer service'], ['Growing without hiring']]],
  ];
  const AREAS = {
    enquiries: ['Enquiries', 'Leads are slipping between channels and replies. A website chatbot and instant auto-replies are usually the fastest win.'],
    admin: ['Admin', 'Repetitive admin is eating your week. Connecting your apps so info moves itself is where the hours are.'],
    marketing: ['Marketing', "Content is a bottleneck. AI drafting in your own voice turns an hour's writing into ten minutes of editing."],
    systems: ['Systems', 'Your info is scattered. Getting it into one place first makes every other automation easier and safer.'],
    confidence: ['Getting started', "You're new to AI, which is fine. A couple of safe, guided first steps will show you what's worth it."],
  };

  const answers = new Array(Q.length).fill(null);
  let step = 0;

  function draw() {
    const [q, opts] = Q[step];
    box.innerHTML = `
      <div class="quiz-progress" aria-hidden="true"><i style="width:${(step / Q.length) * 100}%"></i></div>
      <h2 class="quiz-q" id="quiz-q" tabindex="-1">${T.esc(q)}</h2>
      <div class="quiz-options" role="group" aria-labelledby="quiz-q">
        ${opts.map((o, i) => `<button type="button" data-i="${i}" aria-pressed="${answers[step] === i}">${T.esc(o[0])}</button>`).join('')}
      </div>
      <div class="quiz-nav">${step ? '<button type="button" class="btn btn-ghost" data-back>← Back</button>' : '<span></span>'}<span class="quiz-count">${step + 1} of ${Q.length}</span></div>`;
    box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      answers[step] = +b.dataset.i;
      if (step < Q.length - 1) { step++; draw(); box.querySelector('#quiz-q').focus(); } else finish();
    }));
    const back = box.querySelector('[data-back]');
    if (back) back.addEventListener('click', () => { step--; draw(); });
  }

  function results() {
    let pts = 0, max = 0;
    const area = {};
    Q.forEach(([, opts, a], i) => {
      if (!a) return;
      const p = opts[answers[i]][1];
      pts += p; max += 3;
      area[a] = (area[a] || 0) + p / (a === 'enquiries' || a === 'admin' ? 2 : 1);
    });
    const score = Math.round((pts / max) * 100);
    const adminH = [1, 2.5, 5, 8][answers[4]], copyH = [0, 1, 2, 3][answers[5]], replyH = [0, 0.5, 1, 1.5][answers[3]], mktH = [0, 0.5, 1.5, 1][answers[6]];
    const raw = (adminH * 0.5) + copyH + replyH + mktH;
    const lo = Math.max(1, Math.round(raw * 0.6)), hi = Math.max(lo + 1, Math.round(raw));
    const top = Object.entries(area).sort((a, b) => b[1] - a[1])[0][0];
    const level = score >= 70 ? 'Big time savings waiting' : score >= 45 ? 'Solid quick wins available' : score >= 25 ? 'A few smart tweaks' : "You're already running lean";
    const named = {};
    Q.forEach(([q, opts], i) => { named[q] = opts[answers[i]][0]; });
    return { score, lo, hi, top, level, named };
  }

  function finish() {
    const r = results();
    box.innerHTML = `
      <div class="score-card">
        <div class="score-dial" style="--v:${r.score}; --c:var(--purple-deep);" role="img" aria-label="AI opportunity ${r.score} out of 100"><b>${r.score}<small>/100</small></b></div>
        <div>
          <h2 style="font-size:var(--step-2);">${T.esc(r.level)}</h2>
          <p>Your AI opportunity score is ${r.score} out of 100. Rough estimate: AI and automation could win you back <strong>${r.lo} to ${r.hi} hours a week</strong>.</p>
        </div>
      </div>
      <div class="card" style="margin-top:18px; background:var(--ai-bg); box-shadow:none;">
        <h3>Your biggest opportunity: ${T.esc(AREAS[r.top][0].toLowerCase())}</h3>
        <p style="margin-top:6px; color:var(--ink);">${T.esc(AREAS[r.top][1])}</p>
      </div>
      <div class="quiz-nav"><button type="button" class="btn btn-ghost" data-restart>↺ Retake the quiz</button></div>`;
    box.querySelector('[data-restart]').addEventListener('click', () => { answers.fill(null); step = 0; out.innerHTML = ''; draw(); });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (T.unlocked()) { report(r); return; }
    out.innerHTML = '<div id="quiz-gate"></div>';
    T.gate(document.getElementById('quiz-gate'), {
      tool: 'AI readiness quiz',
      title: 'Get your personalised AI plan',
      blurb: 'Your three best first wins, the tools that do them, and one free step to take this week, written for your answers.',
      button: 'Write my plan',
      context: () => ({ score: `${r.score}/100 (${r.level})`, hours: `${r.lo}-${r.hi} h/week`, top_area: AREAS[r.top][0], answers: Object.entries(r.named).map(([q, a]) => `${q} → ${a}`).join(' | ') }),
      onUnlock: () => report(r),
    });
  }

  async function report(r) {
    out.innerHTML = '<p class="tool-loading">Writing your plan… about 10 seconds.</p>';
    try {
      const { report: text } = await T.api({ tool: 'ai-report', score: r.score, answers: { ...r.named, 'Estimated hours saved': `${r.lo}-${r.hi} per week` } });
      out.innerHTML = `
        <div class="card report-card">${T.renderReport(text)}</div>
        <div class="card tool-cta">
          <h3>Want Tim to build your first win?</h3>
          <p>Chatbots, enquiry follow-ups and app-to-app automations are what Tim builds every week for small businesses. A free chat will tell you what's worth doing first.</p>
          <div class="btn-row"><a class="btn btn-ink btn-arrow" href="/contact">Book a free chat</a><a class="btn btn-ghost" href="/services#ai">AI services</a></div>
        </div>`;
    } catch (err) {
      out.innerHTML = `<p class="tool-error">${T.esc(err.message)}</p><button type="button" class="btn btn-outline btn-sm" data-retry>Try again</button>`;
      out.querySelector('[data-retry]').addEventListener('click', () => report(r));
    }
  }

  draw();
})();
