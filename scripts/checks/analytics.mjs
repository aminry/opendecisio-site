// The analytics beacon and the privacy page, on the built site:
//  - with a token (src/config/site.ts) every page has exactly one deferred Cloudflare beacon carrying it, and the
//    Content-Security-Policy allows the beacon's script host in script-src and no other host anywhere (the beacon reports to
//    the site's own /cdn-cgi/rum, which connect-src 'self' covers); with no token there is no beacon and the policy names no host;
//  - every page links /privacy/, and the privacy page says who runs the site and what is counted.
//   node scripts/checks/analytics.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { analytics } from '../../src/config/site.ts';

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
const problems = [];
const pages = walk('dist');
const csp = /Content-Security-Policy: (.+)/.exec(readFileSync('dist/_headers', 'utf8'))?.[1] ?? '';
const directive = (name) => (csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '').split(' ').slice(1);
const hosts = (list) => list.filter((x) => /^https?:/.test(x));

for (const file of pages) {
	const route = `/${relative('dist', file).replace(/index\.html$/, '')}`;
	const doc = parse(readFileSync(file, 'utf8'));
	const beacons = doc.querySelectorAll('script[src*="cloudflareinsights"]');
	if (analytics.token) {
		if (beacons.length !== 1) problems.push(`${route}: ${beacons.length} analytics beacons, not one`);
		else {
			const b = beacons[0];
			if (b.getAttribute('src') !== `${analytics.script}/beacon.min.js`) problems.push(`${route}: the beacon's address is ${b.getAttribute('src')}`);
			if (!b.hasAttribute('defer')) problems.push(`${route}: the beacon is not deferred`);
			let token;
			try { token = JSON.parse(b.getAttribute('data-cf-beacon') ?? '{}').token; } catch { /* reported below */ }
			if (token !== analytics.token) problems.push(`${route}: the beacon carries another token`);
			let to;
			try { to = JSON.parse(b.getAttribute('data-cf-beacon') ?? '{}').send?.to; } catch { /* reported above */ }
			if (to !== analytics.send) problems.push(`${route}: the beacon reports to ${to ?? 'its default (cloudflareinsights.com)'}, not ${analytics.send}`);
		}
	} else if (beacons.length) problems.push(`${route}: an analytics beacon, with no token set`);
	if (!doc.querySelector('a[href="/privacy/"]')) problems.push(`${route}: no link to /privacy/`);
}

const scriptHosts = hosts(directive('script-src'));
const connectHosts = hosts(directive('connect-src'));
if (analytics.token) {
	if (scriptHosts.join() !== analytics.script) problems.push(`script-src names ${scriptHosts.join(', ') || 'no host'}, not only ${analytics.script}`);
	if (connectHosts.length) problems.push(`connect-src names ${connectHosts.join(', ')}; the beacon reports same-origin, so it names none`);
} else if (scriptHosts.length || connectHosts.length) problems.push(`the policy names ${[...scriptHosts, ...connectHosts].join(', ')} with no token set`);
const other = csp.split('; ').filter((d) => !/^(script-src|connect-src) /.test(d) && /https?:\/\//.test(d));
if (other.length) problems.push(`the policy names a host outside script-src and connect-src: ${other.join('; ')}`);

const privacy = parse(readFileSync('dist/privacy/index.html', 'utf8')).querySelector('main')?.text.replace(/\s+/g, ' ') ?? '';
for (const need of ['Tachara LLC operates opendecisio.com', 'Cloudflare Web Analytics', 'no cookies', 'sell or share no personal data']) {
	if (!privacy.includes(need)) problems.push(`/privacy/ does not say "${need}"`);
}
if (problems.length) { console.error(`analytics: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
console.log(`analytics: ${pages.length} pages; ${analytics.token ? 'one beacon on each, reporting to the site itself, and the policy allows its script host only' : 'no beacon (no token set), and the policy names no analytics host'}; /privacy/ linked from every page`);
