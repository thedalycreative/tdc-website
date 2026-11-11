/* The Daly Creative — site behaviour. No dependencies. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- mobile nav ----- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      setOpen(open);
      if (open) nav.querySelector('a')?.focus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    // a resize past the breakpoint should never leave the body scroll-locked
    window.matchMedia('(min-width: 821px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* ----- scroll reveals (motion-safe only; content visible without JS) ----- */
  const revealed = document.querySelectorAll('.reveal');
  if (revealed.length && !reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-armed');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealed.forEach((el) => io.observe(el));
  }

  /* ----- in-page subnav scroll-spy (services + work category nav) ----- */
  const subnavLinks = document.querySelectorAll('.subnav a[href^="#"], .cat-nav a[href^="#"]');
  if (subnavLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    subnavLinks.forEach((link) => {
      const section = document.getElementById(link.getAttribute('href').slice(1));
      if (section) map.set(section, link);
    });
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          subnavLinks.forEach((l) => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
          const link = map.get(entry.target);
          if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    map.forEach((_link, section) => spy.observe(section));
  }

  /* ----- vertical carousel (admin panel tabs) -----
     Scroll-snap does the moving; JS only drives the controls, the live status
     and auto-advance. Auto-advance stays off under reduced-motion and pauses
     on hover/focus or any manual interaction. */
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const viewport = root.querySelector('.carousel-viewport');
    const slides = [...root.querySelectorAll('.carousel-slide')];
    const status = root.querySelector('[data-carousel-status]');
    const dotsBox = root.querySelector('[data-carousel-dots]');
    if (!viewport || !slides.length) return;

    const labelFor = (i) => slides[i].querySelector('.slide-tag')?.textContent.trim() || `Slide ${i + 1}`;
    let index = 0;
    let paused = false;

    const dots = slides.map((_, i) => {
      const d = document.createElement('i');
      if (dotsBox) dotsBox.appendChild(d);
      return d;
    });

    const render = () => {
      if (status) status.textContent = `${labelFor(index)} · ${index + 1} of ${slides.length}`;
      dots.forEach((d, i) => d.classList.toggle('on', i === index));
    };

    // goTo only moves the viewport. The IntersectionObserver below owns the
    // displayed state — otherwise both write `index` and the label can read a
    // slide ahead of the one actually on screen mid-scroll.
    const hasIO = 'IntersectionObserver' in window;
    const goTo = (i, smooth = true) => {
      const target = (i + slides.length) % slides.length;
      viewport.scrollTo({ top: slides[target].offsetTop, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
      if (!hasIO) { index = target; render(); }
    };

    root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => { paused = true; goTo(index - 1); });
    root.querySelector('[data-carousel-next]')?.addEventListener('click', () => { paused = true; goTo(index + 1); });

    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); paused = true; goTo(index + 1); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); paused = true; goTo(index - 1); }
    });

    // sole owner of the displayed state — also keeps the label honest when the
    // user swipes or scrolls the viewport directly
    if (hasIO) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = slides.indexOf(entry.target);
            if (i > -1 && i !== index) { index = i; render(); }
          }
        });
      }, { root: viewport, threshold: 0.6 });
      slides.forEach((s) => io.observe(s));
    }

    ['pointerenter', 'focusin', 'pointerdown'].forEach((ev) => root.addEventListener(ev, () => { paused = true; }));
    root.addEventListener('pointerleave', () => { paused = false; });

    render();

    if (!reduceMotion) {
      setInterval(() => {
        if (paused || document.hidden) return;
        if (!viewport.getBoundingClientRect().height) return;
        goTo(index + 1);
      }, 3800);
    }
  });

  /* ----- contact form submit state ----- */
  const form = document.querySelector('form[data-enhance]');
  if (form) {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = '';
      const spinner = document.createElement('span');
      spinner.className = 'loader';
      spinner.setAttribute('aria-hidden', 'true');
      btn.append(spinner, 'Sending…');
      const status = form.querySelector('[role="status"]');
      if (status) status.textContent = 'Sending your message…';
    });
  }

  /* ----- chat assistant: loaded after the page settles, so it never slows first paint ----- */
  const loadChat = () => {
    if (document.querySelector('script[data-tdc-chat]')) return;
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = '/assets/css/chat.css';
    const js = document.createElement('script');
    js.src = '/assets/js/chat.js'; js.defer = true; js.dataset.tdcChat = '';
    css.onload = () => document.body.append(js); // widget appears already styled
    document.head.append(css);
  };
  if ('requestIdleCallback' in window) requestIdleCallback(loadChat, { timeout: 2500 });
  else setTimeout(loadChat, 1200);

  /* ----- footer year ----- */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
