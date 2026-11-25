(() => {
  'use strict';

  function initializeHeroVideo(reducedMotion) {
    const hero = document.querySelector('.story-hero');
    const video = document.getElementById('story-banner-video');
    const toggle = document.querySelector('[data-story-video-toggle]');
    if (!hero || !video || !toggle || typeof video.play !== 'function') return () => {};

    let heroVisible = false;
    let manuallyPaused = false;
    let explicitMotion = false;
    let autoplayBlocked = false;
    let mediaFailed = Boolean(video.error);
    let playPending = false;
    let playRequest = 0;

    function updateToggle() {
      toggle.hidden = mediaFailed;
      toggle.textContent = !video.paused || playPending ? 'Pause motion' : 'Play motion';
    }

    function shouldPlay() {
      return heroVisible && document.visibilityState !== 'hidden' &&
        !manuallyPaused && !mediaFailed && !autoplayBlocked &&
        (!reducedMotion.matches || explicitMotion);
    }

    function pauseVideo() {
      if (playPending) {
        playRequest += 1;
        playPending = false;
      }
      video.pause();
      updateToggle();
    }

    function showPoster() {
      hero.classList.remove('is-video-ready');
    }

    function handleMediaFailure() {
      mediaFailed = true;
      showPoster();
      pauseVideo();
    }

    function reconcilePlayback() {
      if (reducedMotion.matches && !explicitMotion) showPoster();
      if (!shouldPlay()) {
        pauseVideo();
        return;
      }
      if (playPending || !video.paused) return;

      const request = ++playRequest;
      playPending = true;
      updateToggle();

      function handlePlayFailure(error) {
        if (request !== playRequest) return;
        playPending = false;
        if (error?.name === 'NotSupportedError') {
          handleMediaFailure();
          return;
        }
        if (error?.name !== 'AbortError') {
          autoplayBlocked = true;
          showPoster();
          video.pause();
        }
        updateToggle();
      }

      try {
        const playback = video.play();
        if (playback && typeof playback.then === 'function') {
          playback.then(() => {
            if (request !== playRequest) return;
            playPending = false;
            if (!shouldPlay()) pauseVideo();
            updateToggle();
          }).catch(handlePlayFailure);
        } else {
          playPending = false;
          updateToggle();
        }
      } catch (error) {
        handlePlayFailure(error);
      }
    }

    function refreshVisibility() {
      const bounds = hero.getBoundingClientRect();
      heroVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      reconcilePlayback();
    }

    // JavaScript controls autoplay so reduced motion is honored before reveal.
    video.autoplay = false;
    video.muted = true;
    video.playsInline = true;
    showPoster();
    pauseVideo();

    video.addEventListener('playing', () => {
      if (!shouldPlay()) {
        pauseVideo();
        return;
      }
      playPending = false;
      hero.classList.add('is-video-ready');
      updateToggle();
    });
    video.addEventListener('pause', updateToggle);
    video.addEventListener('error', handleMediaFailure);
    video.querySelectorAll('source').forEach(source => {
      source.addEventListener('error', handleMediaFailure);
    });

    toggle.addEventListener('click', () => {
      if (!video.paused || playPending) {
        manuallyPaused = true;
        pauseVideo();
        return;
      }
      manuallyPaused = false;
      explicitMotion = true;
      autoplayBlocked = false;
      refreshVisibility();
    });

    if (typeof window.IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(entries => {
        const entry = entries[entries.length - 1];
        heroVisible = entry.isIntersecting && entry.intersectionRatio >= 0.01;
        reconcilePlayback();
      }, { threshold: 0.01 });
      observer.observe(hero);
    } else {
      let visibilityFrame = 0;
      const queueVisibility = () => {
        if (visibilityFrame) return;
        visibilityFrame = window.requestAnimationFrame(() => {
          visibilityFrame = 0;
          refreshVisibility();
        });
      };
      window.addEventListener('scroll', queueVisibility, { passive: true });
      window.addEventListener('resize', queueVisibility, { passive: true });
    }
    document.addEventListener('visibilitychange', refreshVisibility);
    window.addEventListener('pagehide', pauseVideo);
    window.addEventListener('pageshow', refreshVisibility);
    refreshVisibility();

    return () => {
      explicitMotion = false;
      reconcilePlayback();
    };
  }

  function initializeStory() {
    if (!document.body.classList.contains('story-page')) return;

    const backdrop = document.querySelector('.story-backdrop__art');
    const header = document.querySelector('.site-header');
    const progress = document.getElementById('progress');
    const menu = document.getElementById('story-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    const mapDialog = document.getElementById('story-map-dialog');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVideoMotionPreference = initializeHeroVideo(reducedMotion);
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

    const updateMotionPreference = () => {
      queueScroll();
      updateVideoMotionPreference();
    };
    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', updateMotionPreference);
    } else if (typeof reducedMotion.addListener === 'function') {
      reducedMotion.addListener(updateMotionPreference);
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
