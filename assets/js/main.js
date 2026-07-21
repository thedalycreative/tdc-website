/* The Daly Creative — site behaviour. No dependencies. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- mobile nav ----- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    const close = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
      if (open) nav.querySelector('a')?.focus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { close(); toggle.focus(); }
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
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

  /* ----- services subnav scroll-spy ----- */
  const subnavLinks = document.querySelectorAll('.subnav a[href^="#"]');
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

  /* ----- footer year ----- */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
