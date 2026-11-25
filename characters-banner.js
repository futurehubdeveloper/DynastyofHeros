const bannerVideo = document.querySelector('.cs-title-banner__video');
const bannerToggle = document.querySelector('.cs-title-banner__toggle');
const bannerMotion = matchMedia('(prefers-reduced-motion: reduce)');

function syncBannerControl() {
  bannerToggle.textContent = bannerVideo.paused ? 'Play background' : 'Pause background';
}
bannerVideo.addEventListener('play', syncBannerControl);
bannerVideo.addEventListener('pause', syncBannerControl);
bannerToggle.addEventListener('click', () => {
  if (bannerVideo.paused) bannerVideo.play().catch(syncBannerControl);
  else bannerVideo.pause();
});
function applyBannerMotion() {
  bannerToggle.hidden = bannerMotion.matches;
  if (bannerMotion.matches) bannerVideo.pause();
  else bannerVideo.play().catch(syncBannerControl);
}
bannerMotion.addEventListener('change', applyBannerMotion);
applyBannerMotion();
