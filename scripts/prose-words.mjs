// Prose words per docs page, as docs/WRITING_STYLE.md counts them: paragraphs, list items and headings.
// Code blocks, tables, comments, directive lines (::) and front matter are not counted.
//   node scripts/prose-words.mjs [--over]     (--over lists only pages above their ceiling)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = 'src/content/docs/docs';
const ceilings = [[/^tasks\/fast-table|^api|^bases|^glossary|^releases|^flags|^troubleshooting|^measured|^limits$/, Infinity], [/^layout$|^how-it-works$|^think$/, 1000], [/^use-cases\//, 900], [/^concepts\//, 600], [/.*/, 1200]];

function files(dir) {
	return readdirSync(dir).flatMap((n) => {
		const p = join(dir, n);
		return statSync(p).isDirectory() ? files(p) : p.endsWith('.md') ? [p] : [];
	});
}

export function proseWords(text) {
	const body = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, ' ');
	return body
		.split('\n')
		.filter((l) => l.trim() && !l.startsWith('::') && !l.startsWith('|') && !l.startsWith(':::'))
		.join(' ')
		.replace(/[#*`>\[\]()-]/g, ' ')
		.split(/\s+/)
		.filter(Boolean).length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const rows = files(root).map((f) => {
		const page = relative(root, f).replace(/\.md$/, '');
		const ceiling = ceilings.find(([re]) => re.test(page))[1];
		return { page, words: proseWords(readFileSync(f, 'utf8')), ceiling };
	}).sort((a, b) => b.words - a.words);
	const over = process.argv.includes('--over');
	for (const r of rows) if (!over || r.words > r.ceiling) console.log(`${String(r.words).padStart(5)}  ${r.ceiling === Infinity ? '  n/a' : String(r.ceiling).padStart(5)}  ${r.page}${r.words > r.ceiling ? '  OVER' : ''}`);
}
