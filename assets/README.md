# Dynasty of Heroes — Website assets

All **22 character portraits are now uploaded** as independent, text-free WebP images in `assets/portraits/`. Each is 768 × 1024 pixels (3:4). The current Characters page uses **individual images**, not a sprite sheet; the old sprite files are legacy and should not be used.

## Character portraits

The identifiers in `characters.js` correspond exactly to these files:

- **Main hero:** `portraits/mg-kan.webp`
- **Royal Family:** `portraits/mg-kyan.webp`, `portraits/pyin-sa.webp`, `portraits/anawrahta.webp`, `portraits/min-sithu.webp`, `portraits/a-may-mya.webp`, `portraits/nga-tint.webp`, `portraits/nga-pyae-wa.webp`
- **Allies and mentors:** `portraits/nga-htoo.webp`, `portraits/nga-than.webp`, `portraits/nga-nyo.webp`, `portraits/mae-pan.webp`, `portraits/old-sayadaw.webp`, `portraits/head-sayadaw.webp`
- **Three Paladins:** `portraits/nga-lone.webp`, `portraits/nyaung-u-hpi.webp`, `portraits/nga-htwe-yu.webp`
- **Military:** `portraits/army-general.webp`, `portraits/army-soldiers.webp`, `portraits/palace-guards.webp`, `portraits/royal-commander.webp`, `portraits/royal-soldiers.webp`

The character order is defined in `characters.js`. Cards use 3:4 portrait containers in `style.css` and display the entire 3:4 image; the lightbox uses `object-fit:contain`. To edit labels or biographies, change the text in `characters.js`, never the image. `characters.html` holds the editable Mg Kan feature heading/description/button.

## Design continuity

- Nga Tint: Mg Kan’s father, older than his brother Nga Pyae Wa, with a modest moustache
- Nga Pyae Wa: younger uncle, orange headwrap; **not** Nga Htwe Yu
- Nga Than: broad, cheerful build; Nga Nyo: darker complexion, curly hair, quiver of arrows
- Nga Lone La Phae: young, sun-exposed strength hero; Nyaung Oo Phee: athletic swimmer
- Nga Htwe Yu: darkened skin, **slate-blue/charcoal headwrap**, separate from Nga Pyae Wa
- Royal Guard Commander: **gold helmet** and purple face covering; royal search soldiers: purple headwrap and face covering without helmets

## Independent cinematic background layers

1. **Characters top title banner:** `characters-top-cinematic.webp` — Bagan sunset landscape
2. **Full-screen parallax background:** `characters-world-cinematic.webp` — forest ruins and warm mist; CSS variable `--characters-world-image`
3. **Featured Mg Kan foreground:** `mg-kan-cutout-art.webp` — separate from the scenery
4. **Website typography and buttons:** editable HTML; none is baked into the background assets

The parallax uses `main.js` and respects the visitor’s reduced-motion setting. To replace the background, update only the CSS variable or referenced image; the character cutout and HTML stay intact.

## Home video files

- `GoldenWarrior_FutureWind_Banner_CalmDark.mp4`
- `HeroesBeneaththeGoldenPagoda_banner_4K.mp4`

The website references the actual uploaded filenames, without requiring renaming.

## Story artwork and studio branding

- `story-banner-brothers.webp` — the user-supplied image of Mg Kan and King Kyan at sunset, converted to WebP. Its darkening is a reversible CSS overlay in `story.css`; no faces or poses were redrawn.
- `story-banner-motion.mp4` — the latest user-supplied 6-second, 1024 × 592 sunset animation (`pixverse_mp4_media_web_ori_ec3e0664-4517-4f08-9a03-2267f0cf3bf6_seed0.mp4`), used in the taller Story banner. The original video bytes are preserved. Playback is muted and loops, with a pause control and a still fallback for reduced motion or loading problems.
- `story-banner-video-poster.webp` — first-frame poster extracted from that animation; used while the video loads and when motion is disabled.
- `story-world-map.webp` — the illustrated Pagan-inspired game world. A single dim, fixed layer spans the Story page; scroll moves it slightly. Reduced-motion preference disables the movement. The full artwork is available in the optional map dialog.
- `factory-of-future-mark.png` — transparent, icon-only extraction from the supplied navy/cyan studio logo. Created with the built-in image editing tool. Edit prompt: remove the white background and all wording below the bulb; preserve the bulb outline, monogram, navy/cyan colors, and negative spaces; output true transparency with no added text or effects.
- `fonts/RockSalt-Regular.ttf` — locally hosted Rock Salt Regular from the official Google Fonts repository, used for the separate HTML text “Factory of Future.” This is lettering inspired by the user’s reference, not the reference’s exact font. The Apache 2.0 license is included as `fonts/RockSalt-LICENSE.txt`.

The studio symbol and wordmark are independent. Change the name in `index.html` and its styling in `home-brand.css`; do not add wording to the logo image.

Note: This repository is public. Do not publish unreleased plot secrets or confidential production files.
