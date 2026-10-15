// Builds the Decisio mark, Fork, as SVG: the mark, a horizontal and a stacked
// lockup, each in light, dark and single-colour versions. The word is
// converted to outlines from the font file, so no file depends on an
// installed font. Marks are drawn on a 32-unit grid with features of at least
// 3 units (1.5 px at 16 px).
//   node build.mjs   writes assets/*.svg
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import opentype from 'opentype.js';

// Colours from the site's tokens (src/styles/tokens.css): the accent's line
// colour (--d-accent-line) for the chosen element, the grey of other systems
// (--d-other) for the other option, ink for the word. The per-base
// colours are left to the bases.
export const palettes = {
	light: { accent: '#b86a00', muted: '#808898', ink: '#0e1a2b', bg: '#f3f5f9' },
	dark: { accent: '#fba41c', muted: '#7c8799', ink: '#e6e8ec', bg: '#03050a' },
	mono: { accent: 'currentColor', muted: 'currentColor', ink: 'currentColor', bg: 'transparent' },
};

const fontFile = (pkg, weight) => join('node_modules/@fontsource', pkg, 'files', `${pkg}-latin-${weight}-normal.woff`);
const loadFont = (pkg, weight) => {
	const buf = readFileSync(fontFile(pkg, weight));
	return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
export const typefaces = {
	geist: { name: 'Geist', weight: 600, licence: 'SIL Open Font License 1.1', font: loadFont('geist', 600), tracking: -0.02 },
};

// Each mark: its parts, each with a role (accent or muted). Strokes use round
// caps and joins; everything is a plain vector shape with no effects.
const S = (d, role, width) => ({ kind: 'stroke', d, role, width });
const F = (d, role) => ({ kind: 'fill', d, role });

export const candidates = [
	{
		id: 'fork',
		title: 'Fork',
		type: 'geist',
		idea: 'a path that meets a fork and takes one branch, the other stopping short',
		parts: [
			S('M16 18L8.5 10.5', 'muted', 3.5),
			S('M16 29V18L23 9.25', 'accent', 4),
			F('M28 3L26.51 12.06L19.49 6.44Z', 'accent'),
		],
	},
];

export function markBody(c, pal) {
	return c.parts
		.map((p) => {
			const colour = pal[p.role];
			return p.kind === 'fill'
				? `<path d="${p.d}" fill="${colour}"/>`
				: `<path d="${p.d}" fill="none" stroke="${colour}" stroke-width="${p.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
		})
		.join('');
}

/** The word as one outlined path, with its width and cap height at `size`. */
function word(typeKey, text, size) {
	const t = typefaces[typeKey];
	const { font } = t;
	const scale = size / font.unitsPerEm;
	let x = 0;
	const glyphs = font.stringToGlyphs(text);
	const paths = [];
	// The outline is built from each glyph's raw contours in font units:
	// opentype.js 2.0.0's getPath returns NaN coordinates for some glyphs of
	// some fonts and shares state between calls.
	const n = (v) => Math.round(v * 100) / 100;
	const outline = (g, dx) =>
		g.path.commands
			.map((c) => {
				const X = (v) => n(dx + v * scale);
				const Y = (v) => n(-v * scale);
				if (c.type === 'M' || c.type === 'L') return `${c.type}${X(c.x)} ${Y(c.y)}`;
				if (c.type === 'Q') return `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`;
				if (c.type === 'C') return `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`;
				return 'Z';
			})
			.join('');
	glyphs.forEach((g, i) => {
		const d = outline(g, x);
		if (d.includes('NaN')) throw new Error(`word: glyph ${g.name} has NaN coordinates`);
		paths.push(d);
		x += g.advanceWidth * scale + t.tracking * size;
		if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * scale;
	});
	const capHeight = (font.tables.os2.sCapHeight || font.unitsPerEm * 0.7) * scale;
	return { d: paths.join(''), width: x - t.tracking * size, capHeight };
}

const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(w)} ${round(h)}" width="${round(w)}" height="${round(h)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const round = (n) => Math.round(n * 100) / 100;

export function mark(c, theme) {
	return svg(32, 32, markBody(c, palettes[theme]), `${c.title} mark`);
}

/** Mark beside the word: the mark a third taller than the capitals, centred on them. */
export function horizontal(c, theme, text = 'Decisio') {
	const pal = palettes[theme];
	const size = 40;
	const w = word(c.type, text, size);
	const m = w.capHeight * 1.35;
	const gap = m * 0.36;
	const k = m / 32;
	const top = (m - w.capHeight) / 2;
	const body = `<g transform="scale(${round(k)})">${markBody(c, pal)}</g><path transform="translate(${round(m + gap)} ${round(top + w.capHeight)})" d="${w.d}" fill="${pal.ink}"/>`;
	return svg(m + gap + w.width, m, body, `${text}, ${c.title} mark`);
}

/** Mark above the word, both centred. */
export function stacked(c, theme, text = 'Decisio') {
	const pal = palettes[theme];
	const size = 36;
	const w = word(c.type, text, size);
	const m = 64;
	const gap = 14;
	const width = Math.max(m, w.width);
	const body = `<g transform="translate(${round((width - m) / 2)} 0) scale(2)">${markBody(c, pal)}</g><path transform="translate(${round((width - w.width) / 2)} ${round(m + gap + w.capHeight)})" d="${w.d}" fill="${pal.ink}"/>`;
	return svg(width, m + gap + w.capHeight + 2, body, `${text}, ${c.title} mark`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	for (const c of candidates) {
		const dir = 'assets';
		mkdirSync(dir, { recursive: true });
		for (const theme of ['light', 'dark', 'mono']) {
			writeFileSync(join(dir, `mark-${theme}.svg`), mark(c, theme));
			writeFileSync(join(dir, `horizontal-${theme}.svg`), horizontal(c, theme));
			writeFileSync(join(dir, `stacked-${theme}.svg`), stacked(c, theme));
		}
	}
	console.log('build: the Fork mark and its lockups in assets/');
}
