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

Note: This repository is public. Do not publish unreleased plot secrets or confidential production files.
