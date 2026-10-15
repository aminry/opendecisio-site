// Checks the colour tokens in src/styles/tokens.css against WCAG 2.2 AA:
// text pairs at 4.5:1, interface and large-text pairs at 3:1, in both themes.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/tokens.css', 'utf8');
function block(selector) {
	const start = css.indexOf(`${selector} {`);
	const body = css.slice(start, css.indexOf('\n}', start));
	return Object.fromEntries([...body.matchAll(/--(d-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}
const dark = block(':root');
const light = { ...dark, ...block(":root[data-theme='light']") };

function lum(hex) {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
	const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
	return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum]
const pairs = [
	['d-ink', 'd-bg', 4.5], ['d-ink', 'd-surface', 4.5], ['d-muted', 'd-bg', 4.5], ['d-muted', 'd-surface', 4.5],
	['d-muted', 'd-surface-2', 4.5], ['d-link', 'd-bg', 4.5], ['d-link', 'd-surface', 4.5],
	// The accent's three jobs: text, lines and marks, and fills behind dark text.
	['d-accent', 'd-bg', 4.5], ['d-accent', 'd-surface', 4.5], ['d-accent', 'd-surface-2', 4.5], ['d-accent-hover', 'd-bg', 4.5],
	['d-accent-line', 'd-bg', 3], ['d-accent-line', 'd-surface', 3], ['d-accent-line', 'd-surface-2', 3],
	['d-on-accent', 'd-accent-fill', 4.5], ['d-on-accent', 'd-accent-fill-hover', 4.5],
	// Chart series: Jev's violet is also a label's colour; the grey only marks bars.
	['d-jev', 'd-bg', 4.5], ['d-jev', 'd-surface', 4.5], ['d-jev', 'd-surface-2', 4.5],
	['d-other', 'd-bg', 3], ['d-other', 'd-surface', 3], ['d-other', 'd-surface-2', 3], ['d-bar-dim', 'd-panel', 3],
	['d-code-ink', 'd-code-bg', 4.5], ['d-code-accent', 'd-code-bg', 4.5], ['d-focus', 'd-bg', 3], ['d-bar', 'd-panel', 3], ['d-line-strong', 'd-bg', 1.5],
	['d-base-qwen', 'd-bg', 4.5], ['d-base-g12', 'd-bg', 4.5], ['d-base-g31', 'd-bg', 4.5],
	['d-base-qwen', 'd-surface', 4.5], ['d-base-g12', 'd-surface', 4.5], ['d-base-g31', 'd-surface', 4.5],
	['d-base-qwen', 'd-surface-2', 4.5], ['d-base-g12', 'd-surface-2', 4.5], ['d-base-g31', 'd-surface-2', 4.5],
];
let failed = 0;
for (const [theme, t] of [['dark', dark], ['light', light]]) {
	for (const [fg, bg, min] of pairs) {
		const r = ratio(t[fg], t[bg]);
		if (r < min) {
			failed++;
			console.error(`contrast: ${theme} --${fg} on --${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
		}
	}
}
if (failed) process.exit(1);
console.log(`contrast: ${pairs.length * 2} pairs pass`);
