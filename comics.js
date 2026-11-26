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
let episode = 0, page = 1, lang = 'en', readerZoom = 1;
let readerMode = matchMedia('(min-width: 820px)').matches ? 'double' : 'single';
let scrollFrame = 0, modalSession = null, activeModal = null, closingReader = false;
let finishEntrance = null;
let cancelTurn = null;
const lastPage = chapters[chapters.length - 1].end;

// Page 1 faces the inside cover. Even-numbered pages are on the left.
function firstInSpread(n) { return n - n % 2; }
function stepTarget(direction) {
  if (readerMode !== 'double') return page + direction;
  const left = firstInSpread(page);
  return direction > 0 ? left + 2 : (left === 2 ? 1 : left - 2);
}

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
  const left = firstInSpread(page);
  $('readerBottomCounter').textContent = readerMode === 'double' && left > 0
    ? 'Volume pages ' + left + '–' + Math.min(left + 1, lastPage) + ' / ' + lastPage
    : 'Episode page ' + (page - chapter.start + 1) + ' · Volume page ' + page + ' / ' + lastPage;
  $('readerLang').textContent = (lang === 'en' ? 'EN' : 'MM') + ' ⇄ ' + (lang === 'en' ? 'MM' : 'EN');
  $('readerEpisode').value = String(episode);
  $('readerChapterTitle').textContent = chapter.name;
  $('prevPage').disabled = stepTarget(-1) < 1;
  $('nextPage').disabled = stepTarget(1) > lastPage;
  document.querySelectorAll('[data-reading-mode]').forEach(button => {
    button.classList.toggle('selected', button.dataset.readingMode === readerMode);
    button.setAttribute('aria-pressed', String(button.dataset.readingMode === readerMode));
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
  const sameChapter = container.dataset.episode === String(episode);
  if (sameChapter && container.dataset.lang === lang) return;
  const left = sameChapter ? container.scrollLeft : 0;
  container.dataset.lang = lang;
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
      goToPage(n);
      container.querySelector('[data-page="' + n + '"]').focus({ preventScroll: true });
    };
    container.append(button);
  }
  container.scrollLeft = left;
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

function bookPage(n) {
  const slot = document.createElement('div');
  slot.className = 'book-page';
  if (n >= 1 && n <= lastPage) {
    const image = pageImage(n);
    image.loading = 'eager';
    image.draggable = false;
    slot.append(image);
  } else {
    slot.classList.add('book-endpaper');
    if (n === 0) {
      slot.classList.add('book-frontispiece');
      slot.setAttribute('role', 'img');
      slot.setAttribute('aria-label', 'Dynasty of Heroes illustrated title page');
    } else slot.setAttribute('aria-hidden', 'true');
  }
  return slot;
}

function renderBook() {
  const book = document.createElement('div');
  book.className = 'reader-book';
  book.classList.toggle('zoomed', readerZoom > 1);
  if (readerMode === 'double') {
    const left = firstInSpread(page);
    book.append(bookPage(left), bookPage(left + 1));
  } else {
    book.append(bookPage(page));
  }
  // Leave vertical scrolling and pinch zoom to the browser.
  let start = null, swiped = false;
  book.addEventListener('pointerdown', event => {
    swiped = false;
    start = event.isPrimary && event.pointerType === 'touch' && readerZoom <= 1
      ? { x: event.clientX, y: event.clientY } : null;
  });
  book.addEventListener('pointercancel', () => { start = null; });
  book.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped = true;
      movePage(dx < 0 ? 1 : -1);
    }
  });
  book.addEventListener('click', event => {
    if (swiped) return;
    const bounds = book.getBoundingClientRect();
    movePage(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
  });
  readerPage.append(book);
}

function renderReader(position = null) {
  cancelTurn?.();
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  const chapter = chapters[episode];
  if (position) page = position.page;
  page = Math.min(chapter.end, Math.max(chapter.start, page));
  readerPage.replaceChildren();
  readerPage.className = 'reader-page mode-' + readerMode;
  readerPage.style.setProperty('--reader-zoom', String(readerZoom));

  if (readerMode === 'scroll') {
    for (let n = chapter.start; n <= chapter.end; n++) readerPage.append(pageImage(n));
  } else {
    renderBook();
  }

  renderThumbs();
  updateReaderStatus();
  if (readerMode === 'scroll') alignScroll(position);
  else readerPage.scrollTop = readerPage.scrollLeft = 0;
}

// The stationary page and both faces use the actual leaves of the two spreads.
function animateTurn(oldPages, forward) {
  const book = readerPage.querySelector('.reader-book');
  const newPages = Array.from(book.children);
  const spread = newPages.length === 2;
  const overlay = document.createElement('div');
  overlay.className = 'book-transition';
  overlay.setAttribute('aria-hidden', 'true');
  const leaf = document.createElement('div');
  leaf.className = 'book-leaf';
  function face(slot, side) {
    const element = slot.cloneNode(true);
    element.classList.add(side);
    return element;
  }
  const front = face(forward ? oldPages.at(-1) : newPages.at(-1), 'leaf-front');
  const back = spread
    ? face(forward ? newPages[0] : oldPages[0], 'leaf-back')
    : bookPage(-1);
  back.classList.add('leaf-back');
  if (spread) {
    const stationary = face(forward ? oldPages[0] : oldPages[1], 'book-stationary');
    stationary.classList.add(forward ? 'on-left' : 'on-right');
    overlay.append(stationary);
  } else if (!forward) {
    overlay.append(face(oldPages[0], 'book-stationary'));
  }
  const startAngle = forward ? 0 : (spread ? -180 : -94);
  const endAngle = forward ? (spread ? -180 : -94) : 0;
  leaf.style.transform = 'rotateY(' + startAngle + 'deg)';
  leaf.append(front, back);
  overlay.append(leaf);
  book.append(overlay);

  const animations = [];
  function cleanup() {
    for (const animation of animations) animation.cancel();
    overlay.remove();
    if (cancelTurn === cleanup) cancelTurn = null;
  }
  cancelTurn = cleanup;
  function play() {
    if (!overlay.isConnected) return;
    if (comicMotion.matches) { cleanup(); return; }
    const timing = { duration: 590, easing: 'cubic-bezier(.42,.02,.21,1)', fill: 'both' };
    const turn = leaf.animate([
      { transform: 'rotateY(' + startAngle + 'deg)' },
      { transform: 'rotateY(' + endAngle + 'deg)' }
    ], timing);
    animations.push(turn);
    for (const side of [front, back]) {
      const shade = document.createElement('div');
      shade.className = 'leaf-shade';
      side.append(shade);
      animations.push(shade.animate([{ opacity: 0 }, { opacity: .6, offset: .52 }, { opacity: 0 }], timing));
    }
    turn.onfinish = cleanup;
  }
  // Keep the old spread readable while a destination image is still downloading.
  const pending = newPages.flatMap(slot => Array.from(slot.querySelectorAll('img')))
    .filter(image => !image.complete && typeof image.decode === 'function');
  if (pending.length) Promise.allSettled(pending.map(image => image.decode())).then(play);
  else play();
}

function goToPage(n) {
  if (n < 1 || n > lastPage) return;
  if (n === page) {
    if (readerMode === 'scroll') alignScroll();
    return;
  }
  const previous = page;
  const oldBook = readerPage.querySelector('.reader-book');
  const oldPages = oldBook ? Array.from(oldBook.children).filter(node => node.classList.contains('book-page')) : [];
  episode = chapters.findIndex(chapter => n >= chapter.start && n <= chapter.end);
  page = n;
  renderReader();
  const sameSpread = readerMode === 'double' && firstInSpread(previous) === firstInSpread(n);
  if (oldPages.length && !sameSpread && !comicMotion.matches && typeof readerPage.animate === 'function') {
    animateTurn(oldPages, n > previous);
  }
}
function movePage(direction) {
  const position = scrollPosition();
  if (position) page = position.page;
  goToPage(stepTarget(direction));
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
  syncReadingFilm();
  renderReader();
  $('closeReader').focus({ preventScroll: true });
}
async function closeReader() {
  if (closingReader || !reader.classList.contains('open')) return;
  closingReader = true;
  cancelTurn?.();
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
  syncReadingFilm();
}

const comicMotion = matchMedia('(prefers-reduced-motion: reduce)');
const readingFilm = $('readingFilm');
const filmToggle = $('readingFilmToggle');
let wantsFilm = !comicMotion.matches;
let filmVisible = true;

function syncReadingFilm() {
  if (!wantsFilm || !filmVisible || document.hidden || activeModal) {
    readingFilm.pause();
    return;
  }
  if (!readingFilm.hasAttribute('src')) readingFilm.src = readingFilm.dataset.src;
  readingFilm.play().catch(error => {
    if (error.name !== 'AbortError') wantsFilm = false;
  });
}
function labelFilmControl() {
  filmToggle.textContent = readingFilm.paused ? 'Play scene' : 'Pause scene';
}
filmToggle.hidden = false;
filmToggle.onclick = () => { wantsFilm = readingFilm.paused; syncReadingFilm(); };
readingFilm.addEventListener('play', labelFilmControl);
readingFilm.addEventListener('pause', labelFilmControl);
readingFilm.addEventListener('error', () => {
  readingFilm.hidden = true;
  filmToggle.hidden = true;
  wantsFilm = false;
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    filmVisible = entry.isIntersecting;
    syncReadingFilm();
  }).observe(readingFilm);
} else syncReadingFilm();
document.addEventListener('visibilitychange', syncReadingFilm);
comicMotion.addEventListener('change', () => {
  wantsFilm = !comicMotion.matches;
  syncReadingFilm();
});

function enterChronicle(event, selectedEpisode = 0) {
  if (!entrance.hidden || reader.classList.contains('open')) return;
  const opener = event.currentTarget;
  const origin = document.querySelector('#comicOpen img').getBoundingClientRect();
  openReader(selectedEpisode, opener);
  if (comicMotion.matches || typeof entrance.animate !== 'function') return;

  // Land the cover on the right-hand leaf of the actual reader underneath.
  const target = readerPage.querySelector('.book-page:last-child') ||
    readerPage.querySelector('[data-comic-page="' + page + '"]');
  if (!target) return;
  const bounds = target.getBoundingClientRect();
  const viewport = readerPage.getBoundingClientRect();
  const height = Math.min(bounds.height, viewport.height - 8);
  const width = Math.min(bounds.width, height * bounds.width / bounds.height);
  if (!(width > 0 && height > 0)) return;
  const book = entrance.querySelector('.comic-entrance-book');
  Object.assign(book.style, {
    left: (bounds.left + (bounds.width - width) / 2) + 'px',
    top: Math.max(viewport.top, bounds.top) + 'px',
    width: width + 'px', height: height + 'px'
  });
  const inside = book.querySelector('.cover-inside');
  const leftPage = readerPage.querySelector('.mode-double .reader-book > .book-page:first-child');
  inside.classList.toggle('book-frontispiece', Boolean(leftPage?.classList.contains('book-frontispiece')));
  const left = leftPage?.querySelector('img');
  inside.replaceChildren(...(left ? [left.cloneNode(true)] : []));
  entrance.hidden = false;
  const skip = $('comicSkip');
  activateModal(entrance, opener);
  skip.focus({ preventScroll: true });

  const box = book.getBoundingClientRect();
  const sampleVisible = origin.top >= 0 && origin.bottom <= innerHeight && origin.width > 0;
  const from = sampleVisible
    ? `translate(${origin.left + origin.width / 2 - box.left - width / 2}px,
        ${origin.top + origin.height / 2 - box.top - height / 2}px) scale(${origin.width / width}, ${origin.height / height})`
    : 'translateY(5vh) scale(.78) rotateX(14deg)';
  const timing = { duration: 1450, fill: 'both', easing: 'ease-in-out' };
  const travel = book.animate([
    { transform: from }, { transform: 'none', offset: .52 }, { transform: 'none' }
  ], timing);
  const room = entrance.querySelector('.comic-entrance-room').animate([
    { opacity: 1, transform: 'scale(1)' }, { opacity: 1, offset: .25 },
    { opacity: 0, transform: 'scale(1.15)', offset: .62 }, { opacity: 0 }
  ], timing);
  const cover = book.querySelector('.comic-entrance-cover').animate([
    { transform: 'rotateY(0deg)' }, { transform: 'rotateY(0deg)', offset: .34 },
    { transform: 'rotateY(-180deg)' }
  ], timing);
  const dissolve = book.animate([
    { opacity: 1 }, { opacity: 1, offset: .88 }, { opacity: 0 }
  ], timing);
  function finish() {
    if (finishEntrance !== finish) return;
    finishEntrance = null;
    clearTimeout(fallback);
    for (const animation of [travel, room, cover, dissolve]) animation.cancel();
    entrance.hidden = true;
    skip.onclick = null;
    inside.replaceChildren();
    activateModal(reader, opener);
    $('closeReader').focus({ preventScroll: true });
  }
  const fallback = setTimeout(finish, timing.duration + 200);
  finishEntrance = finish;
  cover.onfinish = finish;
  skip.onclick = finish;
}
$('comicOpen').onclick = enterChronicle;
document.querySelectorAll('[data-reader]').forEach(button => { button.onclick = event => enterChronicle(event, null); });
document.querySelectorAll('[data-episode]').forEach(button => { button.onclick = event => enterChronicle(event, Number(button.dataset.episode)); });
comicMotion.addEventListener('change', () => {
  if (comicMotion.matches) { finishEntrance?.(); cancelTurn?.(); }
});
$('closeReader').onclick = closeReader;
$('readerEpisode').onchange = event => {
  goToPage(chapters[Number(event.target.value)].start);
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
