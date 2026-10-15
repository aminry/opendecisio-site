// Checks every link in dist/: internal links and their #anchors must resolve
// inside the build, with no retries; with --external, every external link must
// answer. External links are retried on a 5xx, a timeout or a dropped connection
// (scripts/checks/external.mjs) and any link that needed a retry is logged; a
// 4xx fails at once, and so does a link still failing after the retries (a 429
// that persists is a warning, not a failure).
//   node scripts/checks/links.mjs [--external]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { checkExternal } from './external.mjs';

const dist = 'dist';
const external = process.argv.includes('--external');
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));

const pages = new Map();
for (const file of walk(dist)) {
	const route = '/' + relative(dist, file).replace(/index\.html$/, '');
	const doc = parse(readFileSync(file, 'utf8'));
	pages.set(route, { doc, ids: new Set(doc.querySelectorAll('[id]').map((e) => e.getAttribute('id'))) });
}

const problems = [];
const outside = new Map();
for (const [route, { doc }] of pages) {
	for (const a of doc.querySelectorAll('a[href]')) {
		const href = a.getAttribute('href');
		if (/^(mailto|tel):/.test(href)) continue;
		const url = new URL(href, `https://site.invalid${route}`);
		if (url.host !== 'site.invalid') {
			if (!outside.has(url.href.split('#')[0])) outside.set(url.href.split('#')[0], route);
			continue;
		}
		const path = decodeURIComponent(url.pathname);
		const target = join(dist, path);
		const isPage = pages.has(path) || pages.has(path.endsWith('/') ? path : `${path}/`);
		if (!isPage && !(existsSync(target) && statSync(target).isFile())) {
			problems.push(`${route}: broken link ${href}`);
			continue;
		}
		const anchor = decodeURIComponent(url.hash.slice(1));
		if (anchor && anchor !== '_top' && isPage) {
			const page = pages.get(path) ?? pages.get(`${path}/`);
			if (!page.ids.has(anchor)) problems.push(`${route}: link ${href} points at no #${anchor} on ${path}`);
		}
	}
}

const warnings = [];
if (external) {
	const urls = [...outside.keys()];
	const retried = [];
	const check = async (u) => {
		const r = await checkExternal(u);
		if (r.tries.length > 1) retried.push(`${u} (${r.tries.join(', then ')})`);
		if (r.warning) warnings.push(`${outside.get(u)}: ${r.warning}`);
		// Medium answers 403 to any automated request, so a link to it can only be checked by a person (docs/POSTS.md).
		if (!r.ok && /^403$/.test(r.tries.at(-1) ?? '') && /^https:\/\/([a-z0-9-]+\.)?medium\.com(\/|$)/.test(u)) return warnings.push(`${outside.get(u)}: ${u} refuses automated requests (403), not checked`);
		if (!r.ok) problems.push(`${outside.get(u)}: ${r.message}`);
	};
	// A pool of workers; github.com, which holds most of the links and answers 503 under load, is asked by two at a time.
	const perHost = { 'github.com': 2 };
	const busy = new Map();
	const hostOf = (u) => new URL(u).host;
	const queue = [...urls];
	const worker = async () => {
		while (queue.length) {
			const u = queue.shift();
			const host = hostOf(u);
			while ((busy.get(host) ?? 0) >= (perHost[host] ?? 8)) await new Promise((r) => setTimeout(r, 50));
			busy.set(host, (busy.get(host) ?? 0) + 1);
			try { await check(u); } finally { busy.set(host, busy.get(host) - 1); }
			if (perHost[host]) await new Promise((r) => setTimeout(r, 150));
		}
	};
	await Promise.all(Array.from({ length: 12 }, worker));
	for (const r of retried) console.log(`links: retried: ${r}`);
	console.log(`links: ${urls.length} external links checked`);
}

for (const w of warnings) console.warn(`links: warning: ${w}`);
if (problems.length) {
	console.error(problems.map((p) => `links: ${p}`).join('\n'));
	process.exit(1);
}
console.log(`links: every internal link and anchor on ${pages.size} pages resolves`);
