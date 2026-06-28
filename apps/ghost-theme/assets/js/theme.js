(function () {
  'use strict';

  // ── Dark / light mode ────────────────────────────────────────────────────────

  const root = document.documentElement;
  const STORAGE_KEY = 'rpc-color-scheme';

  function getPreferred() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyScheme(scheme) {
    root.classList.remove('dark-mode', 'light-mode');
    root.classList.add(scheme + '-mode');
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-label', scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('data-current', scheme);
    });
  }

  function toggleScheme() {
    const current = root.classList.contains('dark-mode') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyScheme(next);
  }

  applyScheme(getPreferred());

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', toggleScheme);
    });

    // ── Mobile nav ──────────────────────────────────────────────────────────────

    const burger = document.querySelector('[data-nav-toggle]');
    const mobileNav = document.querySelector('[data-mobile-nav]');
    const mobileClose = document.querySelector('[data-nav-close]');

    function openNav() {
      mobileNav.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      burger.setAttribute('aria-expanded', 'true');
    }

    function closeNav() {
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false');
    }

    if (burger) burger.addEventListener('click', openNav);
    if (mobileClose) mobileClose.addEventListener('click', closeNav);
    if (mobileNav) {
      mobileNav.addEventListener('click', function (e) {
        if (e.target === mobileNav) closeNav();
      });
    }

    // ── Scroll-based nav shadow ─────────────────────────────────────────────────

    const header = document.querySelector('.site-header');
    if (header) {
      window.addEventListener('scroll', function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
      }, { passive: true });
    }

    // ── Portfolio filter ────────────────────────────────────────────────────────

    const filterBtns = document.querySelectorAll('[data-filter]');
    const portfolioCards = document.querySelectorAll('[data-category]');

    if (filterBtns.length) {
      filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
          const filter = this.dataset.filter;
          filterBtns.forEach(b => b.classList.remove('is-active'));
          this.classList.add('is-active');
          portfolioCards.forEach(card => {
            const show = filter === 'all' || card.dataset.category === filter;
            card.style.display = show ? '' : 'none';
          });
        });
      });
    }

    // ── Table of contents (auto-generated from post headings) ──────────────────

    const tocList = document.getElementById('toc-list');
    const postBody = document.querySelector('.post-body');

    if (tocList && postBody) {
      const headings = postBody.querySelectorAll('h2, h3');
      if (headings.length >= 3) {
        headings.forEach(function (heading, i) {
          if (!heading.id) heading.id = 'heading-' + i;
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#' + heading.id;
          a.textContent = heading.textContent;
          a.className = 'post-toc__link' + (heading.tagName === 'H3' ? ' post-toc__link--sub' : '');
          if (heading.tagName === 'H3') a.style.paddingLeft = '12px';
          li.appendChild(a);
          tocList.appendChild(li);
        });
      } else {
        document.getElementById('post-toc').style.display = 'none';
      }
    }

    // ── Contact form subject pre-fill ───────────────────────────────────────────

    const params = new URLSearchParams(window.location.search);
    const subject = params.get('subject');
    if (subject) {
      const subjectSelect = document.querySelector('#contact-subject');
      if (subjectSelect) {
        subjectSelect.value = subject;
      }
    }
  });
})();
