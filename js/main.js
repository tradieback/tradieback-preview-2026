// =====================================================================
// TradieBack — v6 page interactions
// Nav scroll · Mobile menu · FAQ · Sticky CTA · Reveal · Smooth scroll
// Keyboard nav · Carousel · Accessibility
// =====================================================================

(function () {
  'use strict';

  // ── Nav scrolled state ───────────────────────────────────────
  const nav = document.getElementById('nav');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile menu toggle ───────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    // Close on link click
    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── FAQ accordion (one open at a time) ───────────────────────
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;

    // Set up ARIA attributes
    q.setAttribute('role', 'button');
    q.setAttribute('tabindex', '0');
    q.setAttribute('aria-expanded', 'false');

    function toggleFaq() {
      const wasOpen = item.classList.contains('open');
      // Close all open items and update their aria-expanded
      document.querySelectorAll('.faq-item.open').forEach((o) => {
        o.classList.remove('open');
        const oq = o.querySelector('.faq-q');
        if (oq) oq.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    }

    q.addEventListener('click', toggleFaq);
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFaq();
      }
    });
  });

  // ── Dropdown keyboard navigation ─────────────────────────────
  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    const trigger = dropdown.querySelector('.nav-link');
    const menu = dropdown.querySelector('.nav-dropdown-menu');
    if (!trigger || !menu) return;

    const items = menu.querySelectorAll('.dd-item');
    if (!items.length) return;

    // ARIA setup
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    function openMenu() {
      dropdown.classList.add('kb-open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      dropdown.classList.remove('kb-open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        openMenu();
        items[0].focus();
      }
      if (e.key === 'Escape') {
        closeMenu();
      }
    });

    items.forEach((item, i) => {
      item.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (i < items.length - 1) items[i + 1].focus();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (i > 0) items[i - 1].focus();
          else trigger.focus();
        }
        if (e.key === 'Escape') {
          closeMenu();
          trigger.focus();
        }
      });
    });

    // Close on blur out of entire dropdown
    dropdown.addEventListener('focusout', (e) => {
      if (!dropdown.contains(e.relatedTarget)) {
        closeMenu();
      }
    });
  });

  // ── Sticky mobile CTA show/hide ──────────────────────────────
  const mobileCta = document.getElementById('mobileCta');
  if (mobileCta) {
    function toggleMobileCta() {
      const heroBottom = (document.querySelector('.hero')?.offsetHeight || 600) - 100;
      const ctaSection = document.getElementById('cta');
      const ctaTop = ctaSection ? ctaSection.getBoundingClientRect().top : Infinity;
      const past = window.scrollY > heroBottom;
      const ctaVisible = ctaTop < window.innerHeight && ctaTop > -200;
      mobileCta.classList.toggle('show', past && !ctaVisible);
    }
    window.addEventListener('scroll', toggleMobileCta, { passive: true });
    toggleMobileCta();
  }

  // ── Reveal on scroll ─────────────────────────────────────────
  const revealSelectors = [
    '.mono-label', '.eyebrow', '.section-heading', '.section-sub',
    '.problem-card', '.service-tile', '.trade-chip',
    '.ba-col', '.stat-card', '.tl-item',
    '.comparison-table', '.roast-card', '.roast-punchline',
    '.guarantee-inner', '.founder-card', '.about-right',
    '.faq-item', '.hero-mono', '.hero-h1', '.hero-sub',
    '.hero-actions', '.hero-qualifier', '.hero-photo', '.hero-proof',
    '.ai-chat', '.ai-explainer', '.ai-point'
  ];
  const targets = document.querySelectorAll(revealSelectors.join(','));
  targets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((el) => io.observe(el));
  } else {
    targets.forEach((el) => el.classList.add('in'));
  }

  // ── Smooth-scroll for in-page anchors ────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Trades carousel (replaces inline onclick) ────────────────
  const track = document.getElementById('tcTrack');
  if (track) {
    var pos = 0;
    var slideW = 338;
    var slides = track.querySelectorAll('.tc-slide');
    var maxPos = -(slides.length * slideW - track.parentElement.offsetWidth);

    function slideCarousel(dir) {
      pos += dir * slideW * -2;
      if (pos > 0) pos = 0;
      if (pos < maxPos) pos = 0;
      track.style.transform = 'translateX(' + pos + 'px)';
    }

    // Bind to arrow buttons
    var prevBtn = track.parentElement.querySelector('.tc-arrow.prev');
    var nextBtn = track.parentElement.querySelector('.tc-arrow.next');
    if (prevBtn) prevBtn.addEventListener('click', function() { slideCarousel(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { slideCarousel(1); });
  }
})();
