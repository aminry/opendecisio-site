// Writes dist/_headers after a build: a Content-Security-Policy that allows
// only this site's own resources, the inline scripts and style blocks the
// build actually emitted (by hash), and the security headers. Cloudflare's
// static assets serve the file as is; scripts/serve.mjs applies it locally.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { analytics } from '../src/config/site.ts';

const dist = 'dist';
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
const hash = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

const scripts = new Set();
const styles = new Set();
let styleAttrs = 0;
for (const file of walk(dist)) {
	const html = readFileSync(file, 'utf8');
	for (const s of parse(html).querySelectorAll('script')) {
		if (s.getAttribute('src') || /json/.test(s.getAttribute('type') ?? '')) continue;
		scripts.add(hash(s.rawText));
	}
	for (const s of parse(html).querySelectorAll('style')) styles.add(hash(s.rawText));
	// scripts/inline-styles.mjs has moved every style attribute into a class.
	styleAttrs += [...html.matchAll(/<[a-zA-Z][^>]*\sstyle\s*=/g)].length;
}

const csp = [
	"default-src 'none'",
	// Pagefind's search index runs as WebAssembly.
	// The analytics beacon's script host is allowed only when a token is set (src/config/site.ts); its reports go to the site's own
	// /cdn-cgi/rum, which connect-src 'self' already covers, so nothing else is allowed.
	`script-src 'self' 'wasm-unsafe-eval' ${analytics.token ? `${analytics.script} ` : ''}${[...scripts].sort().join(' ')}`,
	`style-src 'self' ${[...styles].sort().join(' ')}`,
	"style-src-attr 'none'",
	"img-src 'self' data:",
	"font-src 'self'",
	"media-src 'self'",
	"connect-src 'self'",
	"manifest-src 'self'",
	"worker-src 'self'",
	"base-uri 'none'",
	"form-action 'self'",
	"frame-ancestors 'none'",
	'upgrade-insecure-requests',
].join('; ');

const headers = `/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/media/*
  Cache-Control: public, max-age=86400

/posters/*
  Cache-Control: public, max-age=86400
`;
if (styleAttrs) {
	console.error(`headers: ${styleAttrs} style attributes left in dist/; run scripts/inline-styles.mjs first`);
	process.exit(1);
}
// Cloudflare rejects a _headers line over 2,000 characters; fail well before it.
const LIMIT = 1800;
const long = headers.split('\n').map((l, i) => ({ n: i + 1, length: l.length })).filter((l) => l.length > LIMIT);
if (long.length) {
	console.error(long.map((l) => `headers: line ${l.n} of dist/_headers is ${l.length} characters, over ${LIMIT} (Cloudflare's limit is 2,000)`).join('\n'));
	process.exit(1);
}
writeFileSync(join(dist, '_headers'), headers);
const longest = Math.max(...headers.split('\n').map((l) => l.length));
console.log(`headers: ${scripts.size} inline scripts and ${styles.size} style blocks allowed by hash, no style attributes; longest line ${longest} characters (limit ${LIMIT})`);
