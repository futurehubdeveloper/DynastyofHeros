# Character artwork corrections — 25 November 2026

## Approved changes

- **Nga Nyo:** Hold the bow upright in his anatomical right hand (viewer’s left), beside his body. Keep the existing face, curly hair, clothing and quiver. The revised full-body asset is 1024 × 1536 with transparency. His existing portrait remains unchanged.
- **King Kyan:** Use an independently generated head-and-shoulders portrait, matching his approved white-and-gold full-body design. The separate portrait asset is 1254 × 1254 with transparency. His full-body file remains unchanged.
- **Nga Pyae Wa:** Restore both original artwork files exactly from commit `78c94959a7a06a9c1718dc3ae6f757007131635e`. Do not regenerate or recompress them. The user preferred this original character design.

The new image assets are lossless WebP exports. The native artwork was not enlarged. Existing CSS and page layout are unchanged. Character display names remain King Kyan and King Saw.

## Exact restored source objects

| Path | Original Git blob |
| --- | --- |
| `assets/fullbody/nga-pyae-wa.webp` | `107acc1718ba53407abbb14cb61a2c9358fd5b14` |
| `assets/portraits/nga-pyae-wa.webp` | `e961c21ff1a5861704237c03ee615673c041916a` |

## Generation prompts

### Nga Nyo: right-hand pose correction

Reference: the approved green-and-gold full-body image in the preceding correction commit, `c4a13b2b4eaccbc637b72d0b229c0c91f2e9a0d9`.

```text
Edit this peaceful standing full-body fantasy character portrait. Make one clear pose correction while preserving the exact person and costume.

Move the ONE existing bow to his anatomical RIGHT HAND, which is the hand on the VIEWER'S LEFT. He now casually holds it UPRIGHT beside his right side, on the LEFT side of the picture, away from his torso. The wooden bow curves outward toward the LEFT edge of the picture. Its taut string connects both tips on the INNER side, nearer the character. The bow must not run diagonally across his body.

His right elbow has a slight natural bend and his right forearm reaches a little outward to the left. His right palm grasps the central leather handle; all four fingers curl naturally around it and the thumb opposes them. Show an anatomically correct right hand, neutral comfortable wrist and clear physical contact with the grip, so the hand supports the upright bow's weight. His other arm, on the viewer's RIGHT, relaxes naturally down with an empty hand.

Preserve his exact curly black hair, youthful face, upward gaze to viewer's right, olive-green and gold cloth outfit, brown trousers, quiver on his back, diagonal straps, belt, bracers, sandals and standing body orientation. Do NOT mirror the person. Maintain the original illustration style and precise details. One bow only, no extra limbs or hands, no newly held arrow, no action pose.

Show the complete character, full head and hair, both complete feet and BOTH bow tips comfortably inside the canvas with transparent margins. Real transparent RGBA alpha background, no glow, scenery, floor, shadow, text, frames or line. Sharp native portrait 1024x1536 or higher, not enlarged blur.
```

### King Kyan: independent portrait

Reference: the approved white-and-gold full-body image in commit `c4a13b2b4eaccbc637b72d0b229c0c91f2e9a0d9`.

```text
Use case: identity-preserve portrait derivation.
Create ONE separate high-resolution HEAD-AND-SHOULDERS / UPPER-CHEST PORTRAIT of King Kyan, based on the reference image's exact identity. This is a new dedicated portrait asset, NOT a full-body image and NOT a crop of his torso.
Preserve the same young Southeast Asian/Burmese face, clean-shaven features, thick eyebrows, tied long black hair and ponytail, loose front locks, proud confident gaze angled slightly upward and to viewer's right. Preserve ivory-white cloak and tunic with gold embroidered borders, gold round cloak clasp, brown diagonal sword-carrying strap, and a little of the same sword hilt behind the shoulder. No headband, crown, helmet, mask, beard, new accessories, black tunic or red cape.
COMPOSITION IS CRITICAL: SQUARE 1024x1024 canvas, chest-up bust. Place the COMPLETE HEAD INCLUDING ALL PONYTAIL/FLYAWAY HAIR in the CENTER OF THE CANVAS within the safe vertical band from roughly y=160 to y=680. Leave generous empty transparent headroom of about15-18percent above the highest hair. Keep the entire face and all hair well inside the central65percent of the square vertically, so a wide landscape thumbnail crop will retain all of his head. Head should be comfortably sized rather than huge. Shoulders and upper chest visible below, with clean shoulder silhouette inside horizontal margins; bust can end near bottom. Do not put hair against the top or sides. Do not crop the forehead, chin, ponytail or ears.
Style: match the input's sharply detailed realistic illustration, crisp individual hair strands, skin detail, woven ivory fabric and gold embroidery. Elegant controlled studio light on the person only.
REAL ALPHA TRANSPARENCY outside the bust and between hair strands. No background, scene, gradient, glow, halo, floor, shadow, frame, yellow line, checkerboard pixels, text, labels or watermark. One character, one dedicated portrait.
```

## Verification

- Nga Nyo has one bow, a visible right-hand grip, and complete head, feet and bow tips inside the canvas.
- The King Kyan portrait preserves his complete head and tied hair in simulated versions of the existing desktop and mobile selector crops.
- The two restored Nga Pyae Wa files match their original Git blob hashes exactly.
- Cache URLs for these three character IDs and their consuming scripts were refreshed. Other asset versions are preserved.
