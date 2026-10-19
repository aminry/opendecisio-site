// Writes dist/_redirects from src/config/redirects.mjs (Cloudflare static assets: one rule per line, a 301 each). Run by
// scripts/build.mjs after the pages are built.
import { writeFileSync } from 'node:fs';
import { redirects } from '../src/config/redirects.mjs';

const lines = redirects.flatMap((r) => {
	const from = r.from.replace(/\/$/, '');
	// The address with and without its trailing slash, so both forms of an old link land.
	return [`${from} ${r.to} 301`, `${from}/ ${r.to} 301`];
});
writeFileSync('dist/_redirects', lines.length ? `${lines.join('\n')}\n` : '');
console.log(`redirects: ${redirects.length} moved pages written to dist/_redirects`);
