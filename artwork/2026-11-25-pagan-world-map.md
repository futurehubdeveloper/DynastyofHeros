# Pagan world map — 25 November 2026

The homepage now includes an illustrated world explorer immediately after the existing cinematic hero. The hero's secondary action links to this section.

## Geography and artwork

The creator clarified that the village and retired monks' monastery sit deep in forest and mountains. They should be meaningfully separated from the palace, while remaining within reach of the kingdom. The map expresses this through open country, a river crossing, and a winding journey into wooded hills. No fixed travel time, distance, or historically exact placement is implied.

`assets/pagan-forest-map.webp` is a new generated illustration based on the previously approved parchment campaign-map style. It is a sibling composition with revised geography, not a replacement for the earlier Library artwork. The generated source is 1448 × 1086 pixels; the web asset preserves those dimensions and is encoded as WebP at quality 93. It is not described as native 4K.

All interactive pins and place names are HTML. Their percentage positions align with the route nodes in the uncropped illustration. The locations are Royal City, Temple Plains, River Crossing, Forest Village, Forest Monastery, and Mountain Path. Forest Monastery is selected initially.

## Behavior and scope

- Select a map pin or a location button to update the destination description, associated cast reference, and navigation action.
- The Royal City links to the existing palace-escape demo. Other destinations link to existing story or character content; they do not claim to be playable game levels.
- Expand map opens a keyboard-accessible overlay, isolates the page behind it, and supports Escape and focus restoration.
- Without JavaScript, the illustration, default monastery description, and its links remain available.
- Homepage-specific files are `home-map.css` and `home-map.js`; existing Characters pages, their styling, and character artwork are untouched.

The cast reference label does not assert that a character lives at the selected location. The geography is a creative interpretation for the DOH game world.
