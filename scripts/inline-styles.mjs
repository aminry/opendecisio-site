// Moves every style attribute in dist/ into a class, so the Content-Security-
// Policy can allow no inline style attributes at all (style-src-attr 'none').
// The attributes come from Starlight (icon sizes, sidebar depth, the theme
// select, the search dialog) and Expressive Code (each token's light and dark
// colour); the site's own markup has none. Each distinct style becomes one
// rule in /_astro/attrs.<hash>.css, linked from every page; the declarations
// carry !important, which is how an inline style outranks the stylesheets.
// Two cases are handled apart:
// - Expressive Code colours a token through the selector
//   span[style^='--']:not([class]); its tokens get the class ec-tok and its
//   stylesheet reads span.ec-tok instead;
// - Starlight hides the search shortcut hint (the kbd in the search button)
//   with display: none and an inline script right after it clears that at once
//   (shortcut.style.display = ''), which a class would defeat; the hint loses
//   the attribute and is shown from the start, the same as after the script.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
const unescape = (v) => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// A start tag, with attribute values quoted any way (they may contain '>').
const TAG = /<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;
const STYLE = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/;
const CLASS = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/;

const classes = new Map();
const classFor = (style) => {
	const css = unescape(style).trim().replace(/;\s*$/, '');
	if (!classes.has(css)) classes.set(css, `s-${createHash('sha256').update(css).digest('hex').slice(0, 8)}`);
	return classes.get(css);
};

const pages = walk(dist);
const edits = [];
for (const file of pages) {
	const html = readFileSync(file, 'utf8');
	let moved = 0;
	const out = html.replace(TAG, (tag, name, attrs, slash) => {
		const style = attrs.match(STYLE);
		if (!style) return tag;
		moved++;
		const value = unescape(style[1] ?? style[2]).trim();
		let rest = attrs.replace(STYLE, '');
		const existing = rest.match(CLASS);
		const had = existing ? (existing[1] ?? existing[2]).trim() : '';
		// The search shortcut hint: shown from the start (see above).
		if (name === 'kbd' && /^display:\s*none;?$/.test(value) && /\bsl-hidden\b/.test(had)) return `<${name}${rest}${slash ? ' /' : ''}>`;
		const add = [classFor(value)];
		if (name === 'span' && value.startsWith('--') && !existing) add.unshift('ec-tok');
		rest = existing ? rest.replace(CLASS, ` class="${had} ${add.join(' ')}"`) : `${rest} class="${add.join(' ')}"`;
		return `<${name}${rest}${slash ? ' /' : ''}>`;
	});
	edits.push({ file, out, moved });
}

// Expressive Code's token selector, pointed at the class that replaces the attribute.
for (const f of readdirSync(join(dist, '_astro')).filter((f) => /^ec\..*\.css$/.test(f))) {
	const path = join(dist, '_astro', f);
	const css = readFileSync(path, 'utf8');
	const next = css.replaceAll("span[style^='--']:not([class])", 'span.ec-tok');
	if (next === css) {
		console.error(`inline-styles: ${f} no longer has Expressive Code's token selector; revisit scripts/inline-styles.mjs`);
		process.exit(1);
	}
	writeFileSync(path, next);
}

const rules = [...classes].map(([css, cls]) => {
	const decls = css.split(';').map((d) => d.trim()).filter(Boolean).map((d) => `${d} !important`);
	return `.${cls}{${decls.join(';')}}`;
});
const sheet = rules.join('\n') + '\n';
const name = `attrs.${createHash('sha256').update(sheet).digest('hex').slice(0, 10)}.css`;
writeFileSync(join(dist, '_astro', name), sheet);
const link = `<link rel="stylesheet" href="/_astro/${name}">`;
let total = 0;
for (const { file, out, moved } of edits) {
	total += moved;
	writeFileSync(file, moved ? out.replace('</head>', `${link}</head>`) : out);
}
// Nothing may be left for the policy to allow.
const left = pages.filter((f) => /<[a-zA-Z][^>]*\sstyle\s*=/.test(readFileSync(f, 'utf8')));
if (left.length) {
	console.error(`inline-styles: style attributes remain in ${left.join(', ')}`);
	process.exit(1);
}
console.log(`inline-styles: ${total} style attributes on ${edits.filter((e) => e.moved).length} pages moved into ${classes.size} classes in /_astro/${name}`);
