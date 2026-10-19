// The site documents the pinned decisio release only (Amin, 2026-10-19): no page's prose names another decisio release.
// A version may appear in a source note (the "measured on" or "recorded on" line of a number, a figure's source, a
// checked block's line), in code (install commands, requests, files), and on Release notes, where the history lives.
// A version is a decisio release when the pinned CHANGELOG has it; one written after another product's name (vLLM 0.31.0,
// Ollama 0.35.1, typesafe-sdk==0.7.2) is that product's.
//   node scripts/checks/versions.mjs [built-site folder, default dist]
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { pin, readUpstream } from '../../src/lib/upstream.mjs';

const root = process.argv[2] ?? 'dist';
// The elements a version may sit in: source notes (by class), and code.
export const SOURCE_NOTES = ['src-note', 'fig__source', 'recorded', 'checked', 'demo__meta', 'hero__cond'];
const CODE = ['pre', 'code', 'script', 'style', 'svg'];
// Pages whose subject is the history, or that are not docs: Release notes, the posts (published as they were), the 404.
const SKIP = /^\/(docs\/releases\/|articles\/|news\/|404\/)/;

const releases = new Set([...readUpstream('CHANGELOG.md').matchAll(/^## \[?(\d+\.\d+\.\d+)\]?/gm)].map((m) => m[1]));
const pinned = pin.tag.replace(/^v/, '');
// Another product's version: its name (or a pin operator) just before the number.
const OTHER = /(vllm|ollama|sdk|python|node|n8n|typesafe|langchain|pipecat|tanstack|ai-sdk|\bai\b|transformers|torch|mlx|cuda|driver|jevbench|decision index|harness|board|v1\.\d|==|@|\bpip\b)[\w\s\-\[\]/.:'"]{0,24}$/i;

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name === 'index.html' ? [join(d, e.name)] : []));
const problems = [];
let pages = 0;
for (const file of walk(root)) {
	const route = `/${relative(root, file).replace(/index\.html$/, '')}`;
	if (SKIP.test(route)) continue;
	pages += 1;
	const doc = parse(readFileSync(file, 'utf8'), { blockTextElements: { script: false, style: false, pre: true } });
	const main = doc.querySelector('main') ?? doc;
	for (const el of main.querySelectorAll(CODE.join(','))) el.remove();
	for (const el of main.querySelectorAll(SOURCE_NOTES.map((c) => `.${c}`).join(','))) el.remove();
	const text = main.textContent.replace(/\s+/g, ' ');
	for (const m of text.matchAll(/(?<![\w.])v?(\d+\.\d+\.\d+)(?![\w.]*\d)/g)) {
		const v = m[1];
		if (v === pinned || !releases.has(v)) continue;
		const before = text.slice(Math.max(0, m.index - 40), m.index);
		if (OTHER.test(before) && !/decisio\s*$/i.test(before)) continue;
		problems.push(`${route}: names decisio ${v} in its prose: "...${text.slice(Math.max(0, m.index - 70), m.index + 40).trim()}..."`);
	}
}
if (problems.length) {
	console.error(`versions: ${problems.length} mentions of other decisio releases than ${pin.tag}, outside source notes, code and Release notes\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log(`versions: ${pages} pages name no decisio release but ${pin.tag} outside source notes, code and Release notes`);
