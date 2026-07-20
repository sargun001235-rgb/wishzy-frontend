/* ============================================================
   WISHZY — UI Engine
   Navigation, Animations, Toast, Scroll Effects
   ============================================================ */

const WishzyUI = (() => {

  /* ── TOAST ────────────────────────────────────────────────── */
  const toast = (message, type = 'info', duration = 3000) => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span class="toast__icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  };

  /* ── CART BADGE UPDATE ────────────────────────────────────── */
  const updateCartBadges = (count) => {
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  };

  const refreshCartBadge = () => {
    const { count } = WishzyStore.getCartTotals();
    updateCartBadges(count);
  };

  /* ── NAVIGATION ───────────────────────────────────────────── */
  const initNav = () => {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    // Scroll effect
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Hamburger
    const hamburger = document.querySelector('.nav__hamburger');
    const drawer = document.querySelector('.nav__drawer');
    if (hamburger && drawer) {
      hamburger.addEventListener('click', () => {
        const open = drawer.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });
      // Close on link click
      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          drawer.classList.remove('open');
          hamburger.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // Active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });

    refreshCartBadge();
  };

  /* ── SCROLL ANIMATIONS ────────────────────────────────────── */
  const initScrollAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));
  };

  /* ── ACCORDION ────────────────────────────────────────────── */
  const initAccordions = () => {
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const content = trigger.nextElementSibling;
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        // Close all
        document.querySelectorAll('.accordion-trigger').forEach(t => {
          t.setAttribute('aria-expanded', 'false');
          const c = t.nextElementSibling;
          if (c) c.classList.remove('open');
        });

        // Open clicked if was closed
        if (!isOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          if (content) content.classList.add('open');
        }
      });
    });
  };

  /* ── MARQUEE CLONE ────────────────────────────────────────── */
  const initMarquee = () => {
    const inner = document.querySelector('.marquee-inner');
    if (!inner) return;
    const clone = inner.cloneNode(true);
    inner.parentElement.appendChild(clone);
  };

  /* ── SMOOTH COUNTER ANIMATION ─────────────────────────────── */
  const animateCounters = () => {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        let current = 0;
        const step = target / 60;
        const update = () => {
          current = Math.min(current + step, target);
          el.textContent = prefix + Math.floor(current).toLocaleString('en-IN') + suffix;
          if (current < target) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  };

  /* ── HERO TYPEWRITER ──────────────────────────────────────── */
  const initTypewriter = () => {
    const el = document.querySelector('[data-typewriter]');
    if (!el) return;
    const words = el.getAttribute('data-typewriter').split('|');
    let wi = 0, ci = 0, deleting = false;
    const type = () => {
      const word = words[wi];
      el.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
      if (!deleting && ci === word.length + 1) { deleting = true; setTimeout(type, 1800); return; }
      if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      setTimeout(type, deleting ? 60 : 90);
    };
    type();
  };

  /* ── LAZY IMAGES ──────────────────────────────────────────── */
  const initLazyImages = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
          observer.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
  };

  /* ── ACTIVE NAV LINK FOR COLLECTIONS ─────────────────────── */
  const setActiveByParam = () => {
    const cat = new URLSearchParams(window.location.search).get('cat');
    if (!cat) return;
    document.querySelectorAll(`[data-cat="${cat}"]`).forEach(el => el.classList.add('active'));
  };

  /* ── INIT ─────────────────────────────────────────────────── */
  const init = () => {
    initNav();
    initScrollAnimations();
    initAccordions();
    initMarquee();
    animateCounters();
    initTypewriter();
    initLazyImages();
    setActiveByParam();

    // Listen for cart updates globally
    window.addEventListener('wishzy:cartUpdate', (e) => {
      updateCartBadges(e.detail.count);
    });
  };

  document.addEventListener('DOMContentLoaded', init);

  return { toast, refreshCartBadge, updateCartBadges, initScrollAnimations };
})();

window.WishzyUI = WishzyUI;
