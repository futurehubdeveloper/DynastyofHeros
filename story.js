(() => {
  'use strict';

  function initializeStory() {
    if (!document.body.classList.contains('story-page')) return;

    const backdrop = document.querySelector('.story-backdrop__art');
    const header = document.querySelector('.site-header');
    const progress = document.getElementById('progress');
    const menu = document.getElementById('story-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    const mapDialog = document.getElementById('story-map-dialog');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia('(max-width: 700px)');
    const desktopMenu = window.matchMedia('(min-width: 951px)');
    let frame = 0;

    function renderScroll() {
      frame = 0;
      const range = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const fraction = range > 0 ? Math.max(0, Math.min(1, window.scrollY / range)) : 0;

      if (backdrop) {
        const distance = smallScreen.matches ? 30 : 60;
        const offset = !reducedMotion.matches && range > 0
          ? (fraction * 2 - 1) * distance
          : 0;
        backdrop.style.setProperty('--story-map-y', offset.toFixed(2) + 'px');
      }
      if (progress) progress.style.width = (fraction * 100).toFixed(2) + '%';
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);
    }

    function queueScroll() {
      if (!frame) frame = window.requestAnimationFrame(renderScroll);
    }

    function setMenuOpen(open, restoreFocus = false) {
      if (!menu || !menuToggle) return;
      menu.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      if (restoreFocus) menuToggle.focus({ preventScroll: true });
    }

    if (menu && menuToggle) {
      menuToggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setMenuOpen(false));
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu.classList.contains('open') && !mapDialog?.open) {
          event.preventDefault();
          setMenuOpen(false, true);
        }
      });
      setMenuOpen(false);
    }

    window.addEventListener('scroll', queueScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (desktopMenu.matches) setMenuOpen(false);
      queueScroll();
    }, { passive: true });
    window.addEventListener('pageshow', queueScroll);
    window.addEventListener('load', queueScroll, { once: true });

    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', queueScroll);
    } else if (typeof reducedMotion.addListener === 'function') {
      reducedMotion.addListener(queueScroll);
    }
    if (document.fonts?.ready) document.fonts.ready.then(queueScroll);
    renderScroll();

    // Keep the full map optional; the world remains visible as the page backdrop.
    if (!mapDialog || typeof mapDialog.showModal !== 'function') return;
    const mapOpeners = document.querySelectorAll('[data-open-world-map]');
    const mapCloseButtons = mapDialog.querySelectorAll('[data-close-world-map]');
    let mapOpener = null;

    mapOpeners.forEach(button => {
      button.addEventListener('click', () => {
        if (mapDialog.open) return;
        mapOpener = button;
        mapDialog.showModal();
        document.body.classList.add('story-map-open');
        mapCloseButtons[0]?.focus({ preventScroll: true });
      });
      button.hidden = false;
    });

    mapCloseButtons.forEach(button => {
      button.addEventListener('click', () => mapDialog.close());
    });

    mapDialog.addEventListener('click', event => {
      if (event.target !== mapDialog) return;
      const bounds = mapDialog.getBoundingClientRect();
      const withinDialog = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (!withinDialog) mapDialog.close();
    });

    // Native Escape closes the dialog and reaches this same cleanup path.
    mapDialog.addEventListener('close', () => {
      document.body.classList.remove('story-map-open');
      if (mapOpener?.isConnected) mapOpener.focus({ preventScroll: true });
      mapOpener = null;
      queueScroll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStory, { once: true });
  } else {
    initializeStory();
  }
})();
