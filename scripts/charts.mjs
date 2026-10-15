// the board charts in public/launch/ are pinned by sha256 to the records in launch_facts.public.json, so they stay exactly as
// they were drawn. This step writes the site's copy of each into dist/launch/ in the site's colours (round 6): Decisio
// in the accent, Jev in violet, every other system in grey, and the page's own surfaces, lines and inks. Only colour
// values change. The step fails if anything else in a chart would differ, and scripts/checks/launch.mjs checks the
// copies in dist/ against the pinned files the same way.
//   node scripts/charts.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The site's colours, from src/styles/tokens.css (the values are repeated here because an SVG served as an image
// cannot read the page's custom properties).
const site = {
	light: { surface: '#ffffff', accent: '#b86a00', jev: '#6d28d9', other: '#808898', other2: '#4b5870' },
	dark: { surface: '#0b1221', accent: '#fba41c', jev: '#c084fc', other: '#7c8799', other2: '#b4bdca' },
};

// the charts' original colours with one meaning in every chart.
const fixed = {
	light: { '#fcfcfb': 'surface', '#2a78d6': 'accent' },
	dark: { '#1a1a19': 'surface', '#3987e5': 'accent' },
};
// the charts' orange is Jev on the board chart, and the systems that read the document again on the speed charts; its
// green is the systems that keep the document in a prefix cache, a second grey here.
const byChart = {
	'jevbench-top12': { '#eb6834': 'jev', '#d95926': 'jev' },
	'many-questions-linear': { '#eb6834': 'other', '#d95926': 'other', '#1baf7a': 'other2', '#199e70': 'other2' },
	'many-questions-log': { '#eb6834': 'other', '#d95926': 'other', '#1baf7a': 'other2', '#199e70': 'other2' },
};

// OKLab and OKLCH (Björn Ottosson), for the colours not named above: a grey keeps its lightness and takes the site's
// cool hue; a blue (the heat map's shades of the accent) keeps its lightness and chroma and takes the accent's hue,
// so every text on it keeps its contrast.
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const rgbHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
function oklch(hex) {
	const [r, g, b] = hexRgb(hex).map(toLin);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	return [L, Math.hypot(A, B), (((Math.atan2(B, A) * 180) / Math.PI) + 360) % 360];
}
function fromOklch(L, C, H) {
	const inGamut = (c) => {
		const A = c * Math.cos((H * Math.PI) / 180);
		const B = c * Math.sin((H * Math.PI) / 180);
		const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
		const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
		const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
		const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
		return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4) ? rgb : null;
	};
	// Lower the chroma until the colour is inside sRGB; lightness and hue stay.
	for (let c = C; c >= 0; c -= 0.002) {
		const rgb = inGamut(c);
		if (rgb) return rgbHex(rgb.map(toSrgb));
	}
	return rgbHex(inGamut(0).map(toSrgb));
}
const ACCENT_HUE = oklch('#fba41c')[2];
const COOL_HUE = oklch('#808898')[2];

export function recolour(svg, chart, theme) {
	const named = { ...fixed[theme], ...(byChart[chart] ?? {}) };
	const map = (hex) => {
		const h = hex.toLowerCase();
		if (named[h]) return site[theme][named[h]];
		const [L, C, H] = oklch(h);
		if (C < 0.03) return fromOklch(L, Math.min(C, 0.02), COOL_HUE);
		if (H > 220 && H < 290) return fromOklch(L, C, ACCENT_HUE);
		throw new Error(`charts: ${chart} (${theme}) has a colour ${hex} with no meaning given here`);
	};
	return svg.replace(/#[0-9a-fA-F]{6}\b/g, map);
}

// The two files differ only in colour values: with every #rrggbb taken out they are the same text.
export const sameButColour = (a, b) => a.replace(/#[0-9a-fA-F]{6}\b/g, '#') === b.replace(/#[0-9a-fA-F]{6}\b/g, '#');

if (import.meta.url === `file://${process.argv[1]}`) {
	const files = readdirSync('public/launch').filter((f) => f.endsWith('.svg'));
	for (const f of files) {
		const theme = f.endsWith('-dark.svg') ? 'dark' : 'light';
		const chart = f.replace(/(-dark)?\.svg$/, '');
		const src = readFileSync(join('public/launch', f), 'utf8');
		const out = recolour(src, chart, theme);
		if (!sameButColour(src, out)) throw new Error(`charts: ${f} would change in more than its colours`);
		writeFileSync(join('dist/launch', f), out);
	}
	console.log(`charts: ${files.length} of the board charts in the site's colours in dist/launch/, nothing but colours changed`);
}
