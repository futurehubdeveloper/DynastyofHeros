# Dynasty of Heroes — Official Website

A cinematic two-page website featuring the Pagan-era-inspired *Dynasty of Heroes* universe.

## ✅ OPEN THE WEBSITE ON WINDOWS — IMPORTANT

**You must extract the complete GitHub ZIP before opening the HTML.**

1. On GitHub, select **Code → Download ZIP**.
2. In **Downloads**, right-click `DynastyofHeros-main.zip` and select **Extract All...**.
3. Choose a **permanent folder**, e.g. `Documents\DynastyofHeros`, then select **Extract**.
4. Open the **extracted** `DynastyofHeros-main` folder.
5. Verify these files are together (same folder): `index.html`, `characters.html`, `style.css`, `main.js`, `characters.js`, plus the `assets` folder.
6. Double-click **`index.html`** for Home, or **`characters.html`** for Characters.

**Do NOT double-click HTML files while browsing inside a ZIP in Windows Explorer.** Windows opens those files from a temporary `AppData\Local\Temp` path without unpacking their stylesheet or artwork. The result is a plain **white page with unstyled black text**, not our real site.

You can check the browser URL: it should start with your **Documents** folder or another extracted location, **not** `AppData/Local/Temp`.

If you see an unstyled page, close it, extract the full archive, and open the extracted `index.html`. Don't move `index.html` out of its original folder by itself.

### Technical alternative: local development server

If you already have Python installed, open Command Prompt inside the extracted website directory:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`. This is optional; extracting and double-clicking normally works for the static pages.

## Pages

- **`index.html`** — cinematic home page: video hero, goals & objectives, story, comics, animation and tactics.
- **`characters.html`** — new cinematic full-screen character showcase. Select all 22 cast members from the bottom navigation and switch between groups; biographies are editable text, not part of images.
- **`characters-classic.html`** — the previous approved card-based gallery, kept intact and accessible.
- **`characters-showcase.html`** — independent preview copy of the cinematic showcase.

## Asset organization

- `style.css` — shared dark gold cinematic design.
- `main.js` — navigation, video and parallax scrolling.
- `characters-data.js` — editable profile names, titles, roles, descriptions and traits for the new cinematic showcase.
- `characters-cinematic.css` / `characters-cinematic.js` — full-screen storytelling design and keyboard-accessible character selector.
- `characters.js` — data and interactions for the backed-up classic gallery.
- `assets/portraits/*.webp` — all **22 separate character images**, shown in 3:4 cards. No names burned into the images.
- `assets/characters-top-cinematic.webp` — title banner backdrop.
- `assets/characters-world-cinematic.webp` — parallax forest backdrop.
- `assets/mg-kan-cutout-art.webp` — independent Mg Kan artwork.
- `assets/GoldenWarrior_FutureWind_Banner_CalmDark.mp4` and `assets/HeroesBeneaththeGoldenPagoda_banner_4K.mp4` — Home page videos.

Keep these assets together with the HTML files. Names, subtitles, and buttons are editable HTML, not part of the artwork.

**Public repository:** Do not upload confidential production material or unpublished story secrets.

## Safe backup before the cinematic redesign

The entire website as it existed before the redesign is preserved on the GitHub branch:

- `backup/characters-gallery-2026-11-25`

The old Characters page is also available at `characters-classic.html` on the main branch, so there is no need to roll back the entire website to access the old view.

**Design direction:** Dark Pagan-era landscapes, large character artwork, descriptive text, thumbnail selector, no gold frames around portrait cards. The new design takes inspiration from cinematic game character pages but is original to Dynasty of Heroes. Existing portrait WebP files are reused; only Mg Kan currently has a separate cutout asset.
