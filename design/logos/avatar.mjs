// The Decisio mark as a square avatar: 512 x 512 PNG on a solid background,
// for the Tachara AI Lab profile on Hugging Face and the Decision Index board.
// The tile is the site's dark background, so the mark is drawn in the dark
// theme's colours, and the tile reads the same whether the page around the
// avatar is light or dark; the mark fills 62% of the tile's height, inside the
// circle a platform may crop to. Also writes a check sheet of the avatar at the
// sizes it is shown at, on a light and a dark page.
//   node avatar.mjs   writes assets/avatar-512.png and review/avatar-check.png
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { candidates, markBody, palettes } from './build.mjs';

const SIZE = 512;
const pal = palettes.dark;
const tile = pal.bg;
// The mark's drawn extent on the 32-unit grid, strokes included (the arrow's tip, the stub's cap, the stem's cap).
const box = { x0: 8.5 - 1.75, x1: 28, y0: 3, y1: 29 + 2 };
const scale = (0.62 * SIZE) / (box.y1 - box.y0);
const tx = SIZE / 2 - ((box.x0 + box.x1) / 2) * scale;
const ty = SIZE / 2 - ((box.y0 + box.y1) / 2) * scale;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="${tile}"/><g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(4)})">${markBody(candidates[0], pal)}</g></svg>`;

const luminance = (hex) => {
	const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};
// The taken path must read at 4.5:1 on the tile, the other branch at 3:1 (WCAG's text and graphics floors).
const taken = contrast(pal.accent, tile);
const other = contrast(pal.muted, tile);
if (taken < 4.5 || other < 3) throw new Error(`avatar: contrast ${taken.toFixed(2)} (path) and ${other.toFixed(2)} (branch) are below 4.5 and 3`);

mkdirSync('assets', { recursive: true });
mkdirSync('review', { recursive: true });
const png = await sharp(Buffer.from(svg), { density: 144 }).resize(SIZE, SIZE).flatten({ background: tile }).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
writeFileSync('assets/avatar-512.png', png);
const meta = await sharp(png).metadata();
if (meta.width !== SIZE || meta.height !== SIZE || meta.channels !== 3) throw new Error(`avatar: ${meta.width}x${meta.height} with ${meta.channels} channels, not 512x512 without alpha`);

// The solid background: the four corners and the middle of each edge are the tile's colour.
const raw = await sharp(png).raw().toBuffer();
const px = (x, y) => [...raw.subarray((y * SIZE + x) * 3, (y * SIZE + x) * 3 + 3)];
const want = [1, 3, 5].map((i) => parseInt(tile.slice(i, i + 2), 16));
for (const [x, y] of [[0, 0], [SIZE - 1, 0], [0, SIZE - 1], [SIZE - 1, SIZE - 1], [SIZE / 2, 0], [0, SIZE / 2], [SIZE - 1, SIZE / 2], [SIZE / 2, SIZE - 1]]) {
	if (px(x, y).some((v, i) => v !== want[i])) throw new Error(`avatar: pixel ${x},${y} is not the tile's colour`);
}

// The check sheet: the avatar at 24, 32, 40 and 64 px on a light and a dark page, each with an 8x zoom of its 24 px version.
const pages = [['#ffffff', 'light page'], ['#f4f6f9', 'light page, site'], ['#0d1117', 'dark page'], ['#111a27', 'dark page, site']];
const sizes = [24, 32, 40, 64];
const small = {};
for (const s of sizes) small[s] = await sharp(png).resize(s, s, { kernel: 'lanczos3' }).png().toBuffer();
const zoom = await sharp(small[24]).resize(192, 192, { kernel: 'nearest' }).png().toBuffer();
const cell = 220, pad = 16;
const sheetW = pad + pages.length * (cell + pad), sheetH = pad + 2 * (cell + pad) + 40;
const composites = [];
let labels = '';
pages.forEach(([bg, name], i) => {
	const x = pad + i * (cell + pad);
	composites.push({ input: { create: { width: cell, height: cell * 2 + pad, channels: 3, background: bg } }, left: x, top: pad });
	let left = x + 12;
	for (const s of sizes) {
		composites.push({ input: small[s], left, top: pad + 12 });
		left += s + 10;
	}
	composites.push({ input: zoom, left: x + 14, top: pad + 12 + 64 + 14 });
	labels += `<text x="${x}" y="${sheetH - 14}" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#222">${name}</text>`;
});
const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}">${labels}</svg>`);
composites.push({ input: label, left: 0, top: 0 });
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#c9ced6' } }).composite(composites).png().toFile('review/avatar-check.png');
console.log(`avatar: assets/avatar-512.png (${png.length} bytes, 512x512, no alpha, tile ${tile}); contrast ${taken.toFixed(2)} (path), ${other.toFixed(2)} (branch); review/avatar-check.png`);
