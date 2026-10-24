# The Decisio mark: Fork

A path reaches a fork and takes one branch, which ends in an arrow, while the other stops short: a decision as a route taken.
Chosen on 2026-10-06 from five candidates (Peak, Fork, Bubbles, Dial, Tick); the four not chosen are in this folder's history.

- `assets/`: the mark, a horizontal lockup and a stacked lockup, each in `-light`, `-dark` and `-mono` (single colour, `currentColor`).
- `review/index.html` and `review/0*.png`: the mark in the site header at desktop and phone width, the favicon at 16 and 32 px, the GitHub avatar, the README header, the 1280x640 social preview and the Ollama avatar, in light and dark; `review/raster/` holds the PNGs.
- `assets/avatar-512.png`: the mark as a square avatar, 512 x 512 with no alpha channel, for the Tachara AI Lab profile on Hugging Face and the Decision Index board; `review/avatar-check.png` shows it at 24, 32, 40 and 64 px on a light and a dark page.
- `npm install && npm run build` regenerates all of it.

## How it is drawn

- Vector, on a 32-unit grid, with no gradient, shadow or effect: the taken path is a 4-unit stroke ending in a filled arrowhead, the other branch a 3.5-unit stroke that stops short.
- Colours from the site's tokens (the amber palette of 2026-10-14): the accent's line colour (`#b86a00` light, `#fba41c` dark) for the taken path, the grey of other systems (`#808898`, `#7c8799`) for the other branch, ink (`#0e1a2b`, `#e6e8ec`) for the word.
- In one colour the taken branch still reads, by its weight and its arrowhead.
- It uses no letter, so it does not depend on the name.
- The word in the lockups is Geist (Vercel) at 600, under the SIL Open Font License 1.1, converted to outlines.

## On the site

- The header draws the mark inline, coloured by the theme's tokens, beside the name as live text from `src/config/site.ts`, so a rename stays a one-line change.
- The docs header uses `src/assets/mark-light.svg` and `mark-dark.svg`, copies of `assets/mark-light.svg` and `mark-dark.svg`.
- `public/favicon.svg` is one file for every browser tab, light or dark, so it uses colours that hold 3:1 against both: the path `#bb6c00` (3.02 to 4.03 on Chrome's light and dark tabs, active or not; an amber has only a narrow band of lightness that does) and the other branch `#7b8797` (3.3 to 3.7 on active tabs).

## Against the other marks

Checked on 2026-10-06 against decisio.ai (a cyan letter D outline), trydecisio.com (a white D in a blue rounded square), getdecisio.com (a teal gradient rounded square), decisio.nl (spaced capitals in a navy box), Decisio Health (a heart drawn as a tick, green and yellow stripes), Alibaba and Qwen (a curved "a" with a smile; a hexagonal interlocking star), and Google and Gemma (the four-colour G; a four-point sparkle).
Fork uses no letter, box, gradient, curve or sparkle, and resembles none of them.

Its known weaknesses: it can read as Git branching or a road sign, and the arrowhead is the first detail to soften at 16 px.

## The avatar

- The tile is the site's dark background (`#03050a`) and the mark is drawn in the dark theme's colours (`#fba41c` path, `#7c8799` other branch), so it reads the same whether the page around it is light or dark: the path is 10.13:1 on the tile and the other branch 5.61:1, and `avatar.mjs` stops if either falls under 4.5 and 3.
- The mark fills 62% of the tile's height and sits inside the circle a platform may crop to.
- At 24 px the stem, the branch and the arrowhead are each still distinct (the sheet shows the 24 px version enlarged 8 times).
- The tile is plain: no gradient, no rounded corners, no alpha; `avatar.mjs` checks that its corners and edges are the tile's colour.
