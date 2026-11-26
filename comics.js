const $ = id => document.getElementById(id);
const reader = $('reader');
const readerPage = $('readerPage');
const entrance = $('comicEntrance');
const menuToggle = document.querySelector('.menu-toggle');
menuToggle.addEventListener('click', () => {
  const menu = document.querySelector('.site-menu');
  menuToggle.setAttribute('aria-expanded', String(menu.classList.toggle('open')));
});

const chapters = [
  { name: 'Prologue', start: 1, end: 1 },
  { name: 'Episode 1 · The Prophecy', start: 2, end: 10 },
  { name: 'Episode 2 · The First Escape', start: 11, end: 18 },
  { name: 'Episode 3 · Shadows Over the Village', start: 19, end: 24 },
  { name: 'Episode 4 · The Price of Escape', start: 25, end: 34 },
  { name: 'Episode 5 · The Mountain Monastery', start: 35, end: 45 }
];
let episode = 0, page = 1, lang = 'en', readerMode = 'single', readerZoom = 1;
let scrollFrame = 0, modalSession = null, activeModal = null, closingReader = false;
let finishEntrance = null;

try {
  const saved = JSON.parse(localStorage.getItem('doh_reader_v12') || '{}');
  if (Number.isInteger(saved.episode) && saved.episode >= 0 && saved.episode < chapters.length) episode = saved.episode;
  if (saved.lang === 'mm') lang = 'mm';
  if (['single', 'double', 'scroll'].includes(saved.mode)) readerMode = saved.mode;
  const savedPage = Number.isInteger(saved.page) ? saved.page : chapters[episode].start;
  page = Math.min(chapters[episode].end, Math.max(chapters[episode].start, savedPage));
} catch (error) {}

function persistReader() {
  try { localStorage.setItem('doh_reader_v12', JSON.stringify({ episode, page, lang, mode: readerMode })); } catch (error) {}
}
function comicSrc(n) { return 'assets/comic/' + lang + '/' + String(n).padStart(2, '0') + '.webp'; }

// Both languages have these same measured page dimensions.
function pageDimensions(n) {
  if (n <= 10) return [692, 1037];
  if (n <= 18) return [768, 1152];
  if (n <= 24) return [768, [1087, 1087, 914, 815, 742, 863][n - 19]];
  return [713, 1008];
}
function pageImage(n, thumbnail = false) {
  const imageChapter = chapters.find(chapter => n >= chapter.start && n <= chapter.end);
  const image = document.createElement('img');
  [image.width, image.height] = pageDimensions(n);
  image.src = comicSrc(n);
  image.loading = !thumbnail && n === page ? 'eager' : 'lazy';
  image.alt = thumbnail ? '' : imageChapter.name + ' — page ' + (n - imageChapter.start + 1) + ' of ' + (imageChapter.end - imageChapter.start + 1);
  if (!thumbnail) image.dataset.comicPage = String(n);
  return image;
}
function refreshComicLanding() {
  for (const [id, locale] of [['comicEN', 'en'], ['comicMM', 'mm']]) {
    $(id).classList.toggle('active', lang === locale);
    $(id).setAttribute('aria-pressed', String(lang === locale));
  }
  document.querySelectorAll('[data-comic-preview]').forEach(image => {
    const src = comicSrc(Number(image.dataset.comicPreview));
    if (image.getAttribute('src') !== src) image.src = src;
  });
  document.querySelector('.comic-resume').hidden = page === 1;
}
function updateReaderStatus() {
  const chapter = chapters[episode];
  $('readerCounter').textContent = (page - chapter.start + 1) + ' / ' + (chapter.end - chapter.start + 1) + ' · ' + lang.toUpperCase();
  $('readerBottomCounter').textContent = 'Episode page ' + (page - chapter.start + 1) + ' · Volume page ' + page + ' / 45';
  $('readerLang').textContent = (lang === 'en' ? 'EN' : 'MM') + ' ⇄ ' + (lang === 'en' ? 'MM' : 'EN');
  $('readerEpisode').value = String(episode);
  $('readerChapterTitle').textContent = chapter.name;
  $('prevPage').disabled = page === 1;
  $('nextPage').disabled = page === 45;
  document.querySelectorAll('[data-reading-mode]').forEach(button => {
    button.classList.toggle('selected', button.dataset.readingMode === readerMode);
  });
  $('readerThumbs').querySelectorAll('[data-page]').forEach(button => {
    const n = Number(button.dataset.page);
    button.classList.toggle('selected', n === page);
  });
  refreshComicLanding();
  persistReader();
}
function renderThumbs() {
  const chapter = chapters[episode], container = $('readerThumbs');
  const left = container.dataset.episode === String(episode) ? container.scrollLeft : 0;
  container.replaceChildren();
  container.dataset.episode = String(episode);
  for (let n = chapter.start; n <= chapter.end; n++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.page = String(n);
    button.title = chapter.name + ' page ' + (n - chapter.start + 1);
    button.setAttribute('aria-label', button.title);
    const label = document.createElement('b');
    label.textContent = String(n - chapter.start + 1);
    button.append(pageImage(n, true), label);
    button.onclick = () => {
      page = n;
      renderReader();
      animateFromPile();
      container.querySelector('[data-page="' + n + '"]').focus({ preventScroll: true });
    };
    container.append(button);
  }
  container.scrollLeft = left;
}

function animateFromPile() {
  if (readerMode === 'scroll' || comicMotion.matches) return;
  const sheet = readerPage.querySelector('.sheet-active');
  const pile = readerPage.querySelector('.reader-side-bundle');
  if (!sheet || !pile || !sheet.animate) return;
  const sheetBox = sheet.getBoundingClientRect();
  const pileBox = pile.getBoundingClientRect();
  if (!sheetBox.width || !pileBox.width) return;
  const dx = pileBox.left + pileBox.width / 2 - (sheetBox.left + sheetBox.width / 2);
  const dy = pileBox.top + pileBox.height * .18 - (sheetBox.top + sheetBox.height / 2);
  const size = Math.max(.2, Math.min(.55, pileBox.width * .55 / sheetBox.width));
  sheet.animate([
    { transform: `translate(${dx}px, ${dy}px) rotate(7deg) scale(${size})`, opacity: 0 },
    { opacity: 1, offset: .35 },
    { transform: 'translate(0, 0) rotate(var(--sheet-tilt, 0deg)) scale(1)', opacity: 1 }
  ], { duration: 560, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function scrollPosition() {
  if (readerMode !== 'scroll' || !reader.classList.contains('open')) return null;
  const images = Array.from(readerPage.querySelectorAll('[data-comic-page]'));
  const top = readerPage.getBoundingClientRect().top + readerPage.clientTop;
  const atBottom = readerPage.scrollHeight - readerPage.clientHeight - readerPage.scrollTop <= 2;
  const image = atBottom ? images[images.length - 1] : images.find(item => item.getBoundingClientRect().bottom > top + 1) || images[images.length - 1];
  if (!image) return null;
  const bounds = image.getBoundingClientRect();
  return { page: Number(image.dataset.comicPage), fraction: (top - bounds.top) / Math.max(1, bounds.height) };
}
function alignScroll(position = null) {
  const image = readerPage.querySelector('[data-comic-page="' + (position ? position.page : page) + '"]');
  if (!image) return;
  const bounds = image.getBoundingClientRect();
  const top = readerPage.getBoundingClientRect().top + readerPage.clientTop;
  readerPage.scrollTop += bounds.top - top + (position ? position.fraction * bounds.height : 0);
}
function trackScrollPage() {
  scrollFrame = 0;
  const position = scrollPosition();
  if (position && position.page !== page) {
    page = position.page;
    updateReaderStatus();
  }
}
readerPage.addEventListener('scroll', () => {
  if (readerMode === 'scroll' && !scrollFrame) scrollFrame = requestAnimationFrame(trackScrollPage);
}, { passive: true });

function renderReader(position = null) {
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  const chapter = chapters[episode];
  if (position) page = position.page;
  page = Math.min(chapter.end, Math.max(chapter.start, page));
  readerPage.replaceChildren();
  readerPage.className = 'reader-page mode-' + readerMode;
  readerPage.style.setProperty('--reader-zoom', String(readerZoom));

  if (readerMode === 'scroll') {
    for (let n = chapter.start; n <= chapter.end; n++) {
      readerPage.append(pageImage(n));
    }
  } else {
    // Single page on parchment manuscript stack (စာရွက်အပုံလိုက်)
    const image = pageImage(page);
    const stack = document.createElement('div');
    stack.className = 'reader-sheet-stack';
    const ratio = (image.width / image.height).toFixed(3);
    stack.style.setProperty('--sheet-ratio', ratio);
    stack.style.setProperty('--sheet-tilt', [-0.6, 0.4, -0.2, 0.7, -0.4][(page - 1) % 5] + 'deg');

    const layer3 = document.createElement('div');
    layer3.className = 'sheet-layer sheet-layer-3';
    layer3.setAttribute('aria-hidden', 'true');

    const layer2 = document.createElement('div');
    layer2.className = 'sheet-layer sheet-layer-2';
    layer2.setAttribute('aria-hidden', 'true');

    const layer1 = document.createElement('div');
    layer1.className = 'sheet-layer sheet-layer-1';
    layer1.setAttribute('aria-hidden', 'true');

    const currentSheet = document.createElement('div');
    currentSheet.className = 'sheet-active';
    currentSheet.title = chapter.name + ' — page ' + (page - chapter.start + 1) + ' (click right side for next, left side for previous)';

    currentSheet.addEventListener('click', (e) => {
      const rect = currentSheet.getBoundingClientRect();
      if (e.clientX - rect.left > rect.width * 0.5) {
        movePage(1);
      } else {
        movePage(-1);
      }
    });

    const bundle = document.createElement('div');
    bundle.className = 'reader-side-bundle';
    bundle.setAttribute('aria-hidden', 'true');
    currentSheet.append(image);
    stack.append(bundle, layer3, layer2, layer1, currentSheet);
    readerPage.append(stack);
  }

  renderThumbs();
  updateReaderStatus();
  if (readerMode === 'scroll') alignScroll(position);
  else readerPage.scrollTop = readerPage.scrollLeft = 0;
}
function movePage(direction) {
  const oldPage = page;
  const currentPosition = scrollPosition();
  if (currentPosition) page = currentPosition.page;
  const chapter = chapters[episode];
  if (direction > 0 && page === chapter.end && episode < chapters.length - 1) {
    episode += 1;
    page = chapters[episode].start;
  } else if (direction < 0 && page === chapter.start && episode > 0) {
    episode -= 1;
    page = chapters[episode].end;
  } else page = Math.min(chapter.end, Math.max(chapter.start, page + direction));

  const oldActive = readerPage.querySelector('.sheet-active');
  const oldImgSrc = oldActive?.querySelector('img')?.src;

  renderReader();

  if (oldPage !== page && readerMode !== 'scroll' && !comicMotion.matches && oldImgSrc) {
    const newStack = readerPage.querySelector('.reader-sheet-stack');
    const newSheet = readerPage.querySelector('.sheet-active');

    if (newStack && newSheet) {
      if (direction > 0) {
        // Next: draw top sheet off the stack to the left/up (အပုံထဲကဆွဲယူပီး ဖတ်သလိုမျိုး)
        const drawn = document.createElement('div');
        drawn.className = 'sheet-drawn';
        const img = document.createElement('img');
        img.src = oldImgSrc;
        drawn.append(img);
        newStack.append(drawn);

        drawn.animate([
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: 'translate(-28%, -20px) rotate(-5deg) scale(0.96)', opacity: 0 }
        ], { duration: 340, easing: 'cubic-bezier(.25, .1, .25, 1)' }).onfinish = () => drawn.remove();

      }
      animateFromPile();
    }
  }
}

function beginModal(opener) {
  if (modalSession) return;
  const background = Array.from(document.body.children).filter(element => element !== reader && element !== entrance && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName));
  modalSession = {
    opener, x: window.scrollX, y: window.scrollY, overflow: document.body.style.overflow,
    background: background.map(element => ({ element, inert: element.hasAttribute('inert'), hidden: element.getAttribute('aria-hidden') }))
  };
  for (const { element } of modalSession.background) {
    element.setAttribute('inert', '');
    element.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = 'hidden';
}
function activateModal(modal, opener = document.activeElement) {
  beginModal(opener);
  activeModal = modal;
  for (const element of [reader, entrance]) {
    element.inert = element !== modal;
    element.setAttribute('aria-hidden', String(element !== modal));
  }
}
function openReader(selectedEpisode = null, opener = document.activeElement) {
  if (closingReader) return;
  if (selectedEpisode !== null) {
    episode = Number(selectedEpisode);
    page = chapters[episode].start;
  }
  reader.classList.add('open');
  activateModal(reader, opener);
  renderReader();
  $('closeReader').focus({ preventScroll: true });
}
async function closeReader() {
  if (closingReader || !reader.classList.contains('open')) return;
  closingReader = true;
  if (document.fullscreenElement && reader.contains(document.fullscreenElement)) {
    try { await document.exitFullscreen?.(); } catch (error) {}
  }
  reader.classList.remove('open');
  reader.inert = true;
  reader.setAttribute('aria-hidden', 'true');
  activeModal = null;
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  const session = modalSession;
  modalSession = null;
  if (session) {
    for (const { element, inert, hidden } of session.background) {
      if (!inert) element.removeAttribute('inert');
      if (hidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', hidden);
    }
    document.body.style.overflow = session.overflow;
    const opener = session.opener?.isConnected ? session.opener : $('comicOpen');
    opener.focus({ preventScroll: true });
    const originalBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(session.x, session.y);
    document.documentElement.style.scrollBehavior = originalBehavior;
  }
  closingReader = false;
}

const comicMotion = matchMedia('(prefers-reduced-motion: reduce)');
const sample = document.querySelector('.comic-sample');
sample.addEventListener('pointermove', event => {
  if (comicMotion.matches || event.pointerType !== 'mouse') return;
  const bounds = sample.getBoundingClientRect();
  sample.style.setProperty('--comic-tilt-x', (3 - 6 * (event.clientY - bounds.top) / bounds.height) + 'deg');
  sample.style.setProperty('--comic-tilt-y', (6 * (event.clientX - bounds.left) / bounds.width - 3) + 'deg');
});
sample.addEventListener('pointerleave', () => {
  sample.style.removeProperty('--comic-tilt-x');
  sample.style.removeProperty('--comic-tilt-y');
});

function enterChronicle(event) {
  const skip = $('comicSkip');
  if (!entrance.hidden || reader.classList.contains('open')) return;
  const opener = event.currentTarget;
  const origin = sample.getBoundingClientRect();
  if (comicMotion.matches || typeof entrance.animate !== 'function') {
    openReader(0, opener);
    return;
  }

  $('comicEntrancePage').src = comicSrc(1);
  entrance.hidden = false;
  activateModal(entrance, opener);
  skip.focus({ preventScroll: true });
  const duration = 3400;
  const options = { duration, fill: 'both', easing: 'cubic-bezier(.35,0,.27,1)' };
  const room = entrance.querySelector('.comic-entrance-room').animate([
    { transform: 'scale(1)', offset: 0 },
    { transform: 'scale(1)', offset: .14 },
    { transform: 'scale(1.38)', offset: .58 },
    { transform: 'scale(2.1)', opacity: 0, offset: 1 }
  ], options);
  const bookElement = entrance.querySelector('.comic-entrance-book');
  const bounds = bookElement.getBoundingClientRect();
  const start = `translate(${origin.left + origin.width/2 - bounds.left - bounds.width/2}px,
    ${origin.top + origin.height/2 - bounds.top - bounds.height/2}px)
    scale(${origin.width/bounds.width}, ${origin.height/bounds.height})`;
  const book = bookElement.animate([
    { transform: start, offset: 0 },
    { transform: 'translateY(12vh) scale(1) rotateX(45deg)', offset: .48 },
    { transform: 'translateY(2vh) scale(1.16) rotateX(13deg)', offset: .76 },
    { opacity: 1, offset: .94 },
    { transform: 'scale(5.5) rotateX(0deg)', opacity: 0, offset: 1 }
  ], options);
  const cover = entrance.querySelector('.comic-entrance-cover').animate([
    { transform: 'rotateY(0deg)', offset: 0 },
    { transform: 'rotateY(0deg)', offset: .48 },
    { transform: 'rotateY(-165deg)', offset: .76 },
    { transform: 'rotateY(-165deg)', offset: 1 }
  ], options);
  const pageReveal = $('comicEntrancePage').animate([
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: .49 },
    { opacity: 1, offset: .65 },
    { opacity: 1, offset: 1 }
  ], options);
  const fallback = setTimeout(finish, duration + 250);

  function finish() {
    if (entrance.hidden) return;
    clearTimeout(fallback);
    entrance.hidden = true;
    for (const animation of [room, book, cover, pageReveal]) animation.cancel();
    skip.onclick = null;
    finishEntrance = null;
    openReader(0, opener);
  }
  finishEntrance = finish;
  book.onfinish = finish;
  skip.onclick = finish;
}
sample.onclick = enterChronicle;
$('comicOpen').onclick = enterChronicle;
document.querySelectorAll('[data-reader]').forEach(button => { button.onclick = () => openReader(null, button); });
document.querySelectorAll('[data-episode]').forEach(button => { button.onclick = () => openReader(button.dataset.episode, button); });
$('closeReader').onclick = closeReader;
$('readerEpisode').onchange = event => {
  episode = Number(event.target.value);
  page = chapters[episode].start;
  renderReader();
};
$('prevPage').onclick = () => movePage(-1);
$('nextPage').onclick = () => movePage(1);
function setLang(locale) {
  const position = scrollPosition();
  lang = locale;
  if (reader.classList.contains('open')) renderReader(position);
  else { refreshComicLanding(); persistReader(); }
}
$('comicEN').onclick = () => setLang('en');
$('comicMM').onclick = () => setLang('mm');
$('readerLang').onclick = () => setLang(lang === 'en' ? 'mm' : 'en');
document.querySelectorAll('[data-reading-mode]').forEach(button => {
  button.onclick = () => {
    const position = scrollPosition();
    if (position) page = position.page;
    readerMode = button.dataset.readingMode;
    readerZoom = 1;
    renderReader();
  };
});
function zoomReader(change) {
  const position = scrollPosition();
  readerZoom = Math.max(.7, Math.min(2, Math.round((readerZoom + change) * 100) / 100));
  renderReader(position);
}
$('readerZoomIn').onclick = () => zoomReader(.15);
$('readerZoomOut').onclick = () => zoomReader(-.15);
$('readerFullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else await reader.requestFullscreen?.();
  } catch (error) {}
};

function trapModalTab(event) {
  const controls = Array.from(activeModal.querySelectorAll('a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
    .filter(element => !element.closest('[hidden],[inert]') && element.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (!first) return;
  const outside = !activeModal.contains(document.activeElement);
  if ((event.shiftKey && (document.activeElement === first || outside)) || (!event.shiftKey && (document.activeElement === last || outside))) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus({ preventScroll: true });
  }
}
document.addEventListener('keydown', event => {
  if (!activeModal) return;
  if (event.key === 'Tab') { trapModalTab(event); return; }
  if (event.key === 'Escape') {
    event.preventDefault();
    if (activeModal === entrance) finishEntrance?.();
    else closeReader();
    return;
  }
  if (activeModal !== reader || event.target.matches('select,input,textarea')) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    $(event.key === 'ArrowRight' ? 'nextPage' : 'prevPage').click();
  }
});
document.addEventListener('focusin', event => {
  if (activeModal && !activeModal.contains(event.target)) {
    $(activeModal === reader ? 'closeReader' : 'comicSkip').focus({ preventScroll: true });
  }
});
refreshComicLanding();
