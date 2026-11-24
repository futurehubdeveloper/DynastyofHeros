# Portrait artwork — one-file upload

The 22-portrait cinematic artwork sheet is prepared as **DOH_22_Character_Portraits_Sprite.jpg**. The website already supports this exact filename and automatically replaces the silhouette placeholders in all 22 cards and detail views when the file is uploaded to this `assets/` folder.

From the GitHub `assets` directory, choose **Add file → Upload files**, select the single JPG image, and **Commit changes**. No individual cropping or renaming is needed.

The character order and original references remain documented in `characters.js`. Keep the approved age and costume continuity, including stout Nga Than and the masked royal commander with a golden helmet.

# Dynasty of Heroes media assets

This repository intentionally keeps visual assets separate from HTML so headings, buttons, and descriptions remain editable.

## Replace temporary artwork

The included `.svg` images are lightweight temporary art to ensure the website works from GitHub Pages. Replace them with your approved DOH visuals when ready; update paths in `index.html` and `style.css` accordingly.

## Add the two videos

Upload the originals into this folder with these exact names:

- **warrior.mp4** — original file: `GoldenWarrior_FutureWind_Banner_CalmDark.mp4`
- **companions-4k.mp4** — original file: `HeroesBeneaththeGoldenPagoda_banner_4K.mp4`

On GitHub open the repository → `assets` folder → **Add file → Upload files** and choose each MP4. GitHub's web uploader accepts files up to 25 MB each; for larger files, use Git from VS Code instead.

For local Git, clone the repository, put the files into `assets/`, then `git add . && git commit -m "Add approved cinematic videos" && git push`.

## Character portraits

The 22 profiles are in `characters.js`. Place approved character portrait images in `assets/portraits/` using these filenames, each as WebP:

mg-kan.webp, mg-kyan.webp, min-sithu.webp, nga-tint.webp, nga-pyae-wa.webp, a-may-mya.webp, pyin-sa.webp, anawrahta.webp, nga-htoo.webp, nga-than.webp, nga-nyo.webp, mae-pan.webp, old-sayadaw.webp, head-sayadaw.webp, nga-lone.webp, nyaung-u-hpi.webp, nga-htwe-yu.webp, army-general.webp, army-soldiers.webp, royal-commander.webp, royal-soldiers.webp, palace-guards.webp.

Until these are uploaded, the site automatically shows neutral silhouette placeholders. Do not substitute another character's face.

**Continuity reminders:** Nga Than is stout, A May Mya is the mature caretaker, the Royal Guard Commander has the golden helmet, royal search soldiers wear purple cloth headwraps and no helmet. Do not disclose unpublished Shadow Unit or post-game secrets on public character pages.
