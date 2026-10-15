// Loads every page of dist/ over HTTPS, served with the headers of
// dist/_headers, in Chromium, WebKit (Safari's engine) and Firefox, at phone,
// tablet and desktop widths in light and dark, and checks:
// - WCAG 2.2 AA (axe);
// - no Content-Security-Policy violation, no failed request, no console error,
//   and the page in the site's own font (its styles and fonts loaded);
// - no layout shift while the page loads and is scrolled through (Chromium's
//   layout-shift measure; in WebKit and Firefox, which lack it, the positions
//   of what is on screen at first paint against the same after load);
// - every focusable element reachable with the keyboard (desktop, light);
// - every image loaded, every clip a sized video with a lazily loaded, sized poster;
// - every line in a figure painted (no gradient stroke on a line with an empty bounding box);
// - the page no wider than the screen; and, once per engine, that search works.
// It saves a full-page screenshot of every page and variant to .browser/<engine>/.
//   ENGINES=chromium,webkit,firefox node scripts/checks/browser.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium, firefox, webkit } from 'playwright';

const engines = { chromium, webkit, firefox };
const chosen = (process.env.ENGINES ?? 'chromium,webkit,firefox').split(',');
const port = 4390;
const base = `https://127.0.0.1:${port}`;
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name === 'index.html' ? [join(dir, e.name)] : []));
// Every page, and the 404 (dist/404.html, which the server answers for any unknown path, as /404/).
const routes = [...walk('dist').map((f) => '/' + relative('dist', f).replace(/index\.html$/, '')), ...(existsSync('dist/404.html') ? ['/404/'] : [])].sort().filter((r) => !process.env.ROUTES || process.env.ROUTES.split(',').includes(r))
	// SHARD="2/3": the second of three equal parts of the pages (every third page from the second), so a job stays short as the docs grow.
	.filter((_, i) => { const [k, n] = (process.env.SHARD ?? '1/1').split('/').map(Number); return i % n === k - 1; });
// 1024 and 1280 are the narrowest widths at which tables are not stacked.
const widths = { phone: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, laptop: { width: 1024, height: 768 }, wide: { width: 1280, height: 800 }, desktop: { width: 1440, height: 900 } };
const variants = Object.entries(widths).flatMap(([w, viewport]) => ['light', 'dark'].map((theme) => ({ name: `${w}-${theme}`, viewport, theme, keyboard: w === 'desktop' && theme === 'light' })));
const SHIFT_LIMIT = 0.01;

const server = spawn('node', ['scripts/serve.mjs', String(port)], { stdio: 'ignore' });
const problems = [];
const report = (engine, route, variant, message) => problems.push(`${engine} ${route} (${variant}): ${message}`);

// Runs in the page before anything else: records CSP violations, Chromium's
// layout shifts, and what is on screen at first paint.
function observe(theme) {
	localStorage.setItem('starlight-theme', theme);
	window.__csp = [];
	document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI || 'inline'} ${e.sample || ''}`));
	window.__cls = null;
	window.__shifts = [];
	try {
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.hadRecentInput) continue;
				window.__cls = (window.__cls ?? 0) + entry.value;
				const r = (x) => `${Math.round(x.x)},${Math.round(x.y)} ${Math.round(x.width)}x${Math.round(x.height)}`;
				window.__shifts.push(`${entry.value.toFixed(4)} at ${Math.round(entry.startTime)} ms: ${(entry.sources || []).slice(0, 3).map((s) => `${s.node?.nodeName ?? '?'}${typeof s.node?.className === 'string' && s.node.className ? '.' + s.node.className.split(' ')[0] : ''} ${r(s.previousRect)} -> ${r(s.currentRect)}`).join(', ')}`);
			}
		}).observe({ type: 'layout-shift', buffered: true });
		window.__cls = 0;
	} catch {
		// Not Chromium: positions at first paint stand in for it.
	}
	window.__snapshot = () =>
		// The docs sidebar is left out: Starlight restores its scroll position, which moves its items without a shift.
		[...document.querySelectorAll('h1, h2, h3, p, li, table, pre, figure, img, video, .flag, .panel, nav, header')]
			.filter((el) => !el.closest('.sidebar-pane, #starlight__sidebar'))
			.map((el, i) => {
				const r = el.getBoundingClientRect();
				return { i, tag: el.tagName.toLowerCase(), x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
			})
			.filter((r) => r.y < window.innerHeight && r.w > 0 && r.h > 0);
	document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(() => (window.__first = window.__snapshot()))));
	// The window's width at the first frame: a shift that comes from the browser
	// settling on the viewport late is not the page's.
	requestAnimationFrame(() => (window.__w0 = window.innerWidth));
}

// A layout-shift score from two snapshots, as Chromium computes one: the share of
// the viewport the moved elements cover, times the largest move as a share of it.
function movedScore() {
	const first = window.__first ?? [];
	const now = new Map(window.__snapshot().map((r) => [r.i, r]));
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	let area = 0;
	let distance = 0;
	const moved = [];
	for (const a of first) {
		const b = now.get(a.i);
		if (!b) continue;
		const d = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
		if (d < 1) continue;
		area += Math.min(a.w, vw) * Math.min(a.h, vh);
		distance = Math.max(distance, d);
		moved.push(`${a.tag} by ${Math.round(d)} px`);
	}
	return { score: Math.min(1, area / (vw * vh)) * (distance / Math.max(vw, vh)), moved: moved.slice(0, 5) };
}


// The analytics beacon is the one request the checks must not make for real: it would count every run as a visit. Its
// script is answered with an empty one and any other request to its host with 204, so a page that loads it still loads
// cleanly (the CSP that allows it is checked by scripts/checks/analytics.mjs).
async function stubBeacon(context) {
	await context.route(/https:\/\/(static\.)?cloudflareinsights\.com\//, (route) => (/beacon\.min\.js/.test(route.request().url()) ? route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* the analytics beacon is not run in the checks */' }) : route.fulfill({ status: 204, body: '' })));
}

// A layout shift seen once is measured again in a fresh window: a shift the
// page causes repeats; one from the browser settling late does not, and is
// reported as a warning with what moved.
async function shiftAgain(browser, route, v) {
	const context = await browser.newContext({ viewport: v.viewport, colorScheme: v.theme, reducedMotion: 'reduce', ignoreHTTPSErrors: true });
	await stubBeacon(context);
	await context.addInitScript(observe, v.theme);
	const page = await context.newPage();
	await page.goto(base + route, { waitUntil: 'load', timeout: 30000 });
	await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(200);
	const stable = await page.evaluate(movedScore);
	await page.evaluate(async () => {
		for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
			window.scrollTo(0, y);
			await new Promise((r) => setTimeout(r, 60));
		}
		window.scrollTo(0, 0);
	});
	await page.waitForTimeout(300);
	const cls = await page.evaluate(() => window.__cls);
	await context.close();
	return (cls ?? 0) <= SHIFT_LIMIT && stable.score <= SHIFT_LIMIT;
}

// The server is up when it answers TLS, even with a certificate Node does not trust.
for (let i = 0; i < 50; i++) {
	const up = await fetch(base, { signal: AbortSignal.timeout(500) }).then(
		() => true,
		(e) => /certificate|self[- ]signed/i.test(`${e?.cause?.code} ${e?.cause?.message}`),
	);
	if (up) break;
	await new Promise((r) => setTimeout(r, 100));
}

try {
	for (const engineName of chosen) {
		let browser;
		const shots = join('.browser', engineName);
		mkdirSync(shots, { recursive: true });
		for (const route of routes) {
			// A fresh browser per page: one browser through more than a hundred contexts
			// stops firing Firefox's load event, which no reader's browser goes through.
			await browser?.close();
			browser = await engines[engineName].launch();
			for (const v of variants) {
				// A page that does not settle gets one more try in a fresh context; a real hang fails twice.
				let context;
				let page;
				let response;
				const errors = [];
				const failed = [];
				for (let attempt = 1; attempt <= 2 && !response; attempt++) {
					context = await browser.newContext({ viewport: v.viewport, colorScheme: v.theme, reducedMotion: 'reduce', ignoreHTTPSErrors: true });
					await stubBeacon(context);
					await context.addInitScript(observe, v.theme);
					page = await context.newPage();
					errors.length = 0;
					failed.length = 0;
					const pending = new Map();
					page.on('request', (r) => pending.set(r, r.url()));
					page.on('requestfinished', (r) => pending.delete(r));
					page.on('requestfailed', (r) => pending.delete(r));
					page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
					page.on('pageerror', (e) => errors.push(e.message));
					// A clip loads only near the screen, and a closed context aborts it: not a failure.
					page.on('requestfailed', (r) => !/\.mp4$/.test(r.url()) && failed.push(`${r.url()} ${r.failure()?.errorText}`));
					try {
						// The load event, then quiet: Firefox does not always report network idle.
						response = await page.goto(base + route, { waitUntil: 'load', timeout: 30000 });
						await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
						if (attempt > 1) console.warn(`\nbrowser: warning: ${engineName} ${route} (${v.name}) settled only on the second try`);
					} catch {
						const ready = await page.evaluate(() => document.readyState).catch(() => 'unknown');
						const loading = `document ${ready}; requests still loading: ${[...pending.values()].slice(0, 5).join(', ') || 'none'}`;
						await context.close();
						if (attempt === 2) report(engineName, route, v.name, `did not settle in 30 s, twice; still loading: ${loading}`);
					}
				}
				if (!response) continue;
				if (response?.status() !== 200 && route !== '/404/') report(engineName, route, v.name, `answered ${response?.status()}`);
				await page.evaluate(() => document.fonts.ready);
				await page.waitForTimeout(200);
				const stable = await page.evaluate(movedScore);

				await page.evaluate(async () => {
					for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
						window.scrollTo(0, y);
						await new Promise((r) => setTimeout(r, 60));
					}
					window.scrollTo(0, 0);
				});
				await page.waitForTimeout(300);

				const state = await page.evaluate(() => ({
					csp: window.__csp,
					cls: window.__cls,
					shifts: window.__shifts,
					firstWidth: window.__w0,
					brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
					unsizedClips: [...document.querySelectorAll('.clip')].filter((c) => {
						const vid = c.querySelector('video');
						const poster = c.querySelector('img.clip__poster');
						return !vid?.getAttribute('width') || !vid?.getAttribute('height') || !poster?.getAttribute('width') || poster?.getAttribute('loading') !== 'lazy';
					}).length,
					overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
					// No table scrolls sideways or is clipped, on any page, at any width: it ends inside its box, no
					// cell is wider than itself, and below 1024px a stacking table (and, in a docs column under 40rem,
					// a docs table of three columns or more, and under 60rem one of six or more) is stacked, its header row hidden.
					wideTables: [...document.querySelectorAll('main table')]
						.flatMap((t) => {
							const box = t.closest('.table-scroll, .table-wrap') ?? t.parentElement;
							const name = t.querySelector('caption')?.textContent?.trim() || t.closest('[aria-label]')?.getAttribute('aria-label') || t.closest('section')?.querySelector('h2')?.textContent?.trim() || 'a table';
							const out = [];
							if (box.scrollWidth > box.clientWidth + 1) out.push(`${name} scrolls: ${box.scrollWidth}px in a ${box.clientWidth}px box`);
							if (t.getBoundingClientRect().right > box.getBoundingClientRect().right + 1) out.push(`${name} runs ${Math.round(t.getBoundingClientRect().right - box.getBoundingClientRect().right)}px past its box`);
							const clipped = [...t.querySelectorAll('th, td')].filter((c) => c.scrollWidth > c.clientWidth + 1);
							if (clipped.length) out.push(`${name} has ${clipped.length} clipped cells, the first: "${clipped[0].textContent.trim().slice(0, 40)}"`);
							const headHeight = t.querySelector('thead')?.getBoundingClientRect().height ?? 0;
							if (window.innerWidth < 1024 && t.classList.contains('data-table--stack') && headHeight > 1) out.push(`${name} is not stacked below 1024px`);
							if (t.classList.contains('docs-table') && headHeight > 1 && ((box.clientWidth < 640 && t.querySelector('tr > :nth-child(3)')) || (box.clientWidth < 960 && t.querySelector('tr > :nth-child(6)')))) out.push(`${name} is not stacked in a ${box.clientWidth}px column`);
							return out;
						}),
					// A code block scrolls its long lines sideways and never breaks one inside a word or a path: its text keeps
					// its white space (`pre`; overflow-wrap has no effect on it) on every page at every width. (That a scrolling block is reachable by keyboard is axe's
					// scrollable-region-focusable rule, below.)
					codeThatWraps: [...document.querySelectorAll('main pre')]
						.filter((pre) => getComputedStyle(pre.querySelector('code') ?? pre).whiteSpace !== 'pre')
						.map((pre) => `${pre.getAttribute('aria-label') ?? pre.textContent.trim().slice(0, 30)} wraps its lines`),
					// A line in a figure is drawn: a stroke painted with a gradient in its bounding box's units (the default) is not
					// painted at all on a straight horizontal or vertical line, whose box has no height or width.
					unpaintedStrokes: [...document.querySelectorAll('svg path, svg line, svg polyline')]
						.filter((el) => {
							const id = /url\("?#([^")]+)"?\)/.exec(getComputedStyle(el).stroke)?.[1];
							const grad = id && document.getElementById(id);
							if (!grad || !/Gradient$/.test(grad.tagName) || grad.getAttribute('gradientUnits') === 'userSpaceOnUse') return false;
							const box = el.getBBox();
							return box.width < 0.5 || box.height < 0.5;
						})
						.map((el) => `${el.id ? '#' + el.id : el.tagName} in ${el.closest('svg').getAttribute('aria-label')?.slice(0, 40) ?? 'a figure'}`),
					styled: getComputedStyle(document.body).fontFamily.includes('Geist'),
				}));
				for (const c of state.csp) report(engineName, route, v.name, `CSP violation: ${c}`);
				for (const f of failed) report(engineName, route, v.name, `request failed: ${f}`);
				// The 404 answers with its own status, which the browser logs; that one line is the page working.
				for (const e of errors) if (!(route === '/404/' && /status of 404/.test(e))) report(engineName, route, v.name, `console error: ${e}`);
				if (!state.styled) {
					// What the page had loaded when it was measured, so a failure says why.
					const why = await page.evaluate(() => ({
						readyState: document.readyState,
						fonts: document.fonts.status,
						bodyFont: getComputedStyle(document.body).fontFamily,
						sheets: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => `${l.getAttribute('href')} ${l.sheet ? 'applied' : 'NOT APPLIED'}`),
						css: performance.getEntriesByType('resource').filter((e) => /\.css/.test(e.name)).map((e) => `${e.name.split('/').pop()} ${Math.round(e.duration)} ms, status ${e.responseStatus ?? '?'}`),
					}));
					report(engineName, route, v.name, `the page is not in the site's font: its styles or fonts did not load (${JSON.stringify(why)})`);
				}
				const shifted = [];
				if (state.cls !== null && state.cls > SHIFT_LIMIT) shifted.push(`layout shift ${state.cls.toFixed(4)} (limit ${SHIFT_LIMIT}): ${state.shifts.join('; ')}`);
				if (stable.score > SHIFT_LIMIT) shifted.push(`what was on screen at first paint moved after load: ${stable.score.toFixed(4)} (limit ${SHIFT_LIMIT}): ${stable.moved.join(', ')}`);
				if (shifted.length) {
					const detail = `${shifted.join('; ')}; window ${state.firstWidth}px wide at the first frame, ${v.viewport.width}px set`;
					if (await shiftAgain(browser, route, v)) console.warn(`\nbrowser: warning: ${engineName} ${route} (${v.name}) shifted once and not again: ${detail}`);
					else report(engineName, route, v.name, detail);
				}
				for (const src of state.brokenImages) report(engineName, route, v.name, `image did not load: ${src}`);
				if (state.unsizedClips) report(engineName, route, v.name, `${state.unsizedClips} clips without a sized video and a lazily loaded, sized poster`);
				if (state.overflow) report(engineName, route, v.name, 'the page is wider than the screen');
				for (const t of state.wideTables) report(engineName, route, v.name, t);
				for (const c of state.codeThatWraps) report(engineName, route, v.name, `code block wraps: ${c}`);
				for (const s of state.unpaintedStrokes) report(engineName, route, v.name, `a line is not drawn (its gradient needs gradientUnits="userSpaceOnUse"): ${s}`);

				const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
				for (const violation of axe.violations) {
					report(engineName, route, v.name, `axe ${violation.id} (${violation.impact}): ${violation.help}; ${violation.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
				}

				// Keyboard reach: from the top, the keyboard must reach every focusable element.
				if (v.keyboard) {
					const total = await page.evaluate(() => {
						const focusable = [...document.querySelectorAll('a[href], button:not([disabled]), select, input, textarea, [tabindex="0"]')].filter((el) => {
							const s = getComputedStyle(el);
							const r = el.getBoundingClientRect();
							// A tab that is not the selected one is reached with the arrow keys from the selected one (the ARIA tabs pattern), not with Tab.
								const rovingTab = el.matches('[role="tab"][tabindex="-1"]') && el.closest('[role="tablist"]')?.querySelector('[role="tab"][tabindex="0"]');
								return !rovingTab && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0 && !el.closest('[inert], [aria-hidden="true"], dialog:not([open])') && !(el.closest('details:not([open])') && !el.closest('summary'));
						});
						focusable.forEach((el, i) => el.setAttribute('data-kb', String(i)));
						return focusable.length;
					});
					const reached = new Set();
					// WebKit, like Safari, moves to links with Alt+Tab; the other engines with Tab.
					const key = engineName === 'webkit' ? 'Alt+Tab' : 'Tab';
					for (let i = 0; i < total + 15 && reached.size < total; i++) {
						await page.keyboard.press(key);
						const at = await page.evaluate(() => document.activeElement?.getAttribute('data-kb'));
						if (at !== null && at !== undefined) reached.add(at);
					}
					if (reached.size < total) {
						const missing = await page.evaluate((seen) => [...document.querySelectorAll('[data-kb]')].filter((el) => !seen.includes(el.getAttribute('data-kb'))).slice(0, 4).map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}"`), [...reached]);
						report(engineName, route, v.name, `the keyboard reaches ${reached.size} of ${total} focusable elements; not: ${missing.join(', ')}`);
					}
				}

				// The first screen as the reader sees it, and the whole page (where WebKit draws
				// fixed headers part-way down, an artefact of the capture, not of the page).
				const shot = `${route.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home'}-${v.name}`;
				await page.screenshot({ path: join(shots, `${shot}-top.png`) });
				// WebKit and Firefox cannot capture more than 32,767 pixels in one image; a page that
				// long (the evaluation card on a phone) is captured to its first 30,000.
				const height = await page.evaluate(() => document.documentElement.scrollHeight);
				const width = v.viewport.width;
				await page.screenshot({ path: join(shots, `${shot}.png`), fullPage: true, ...(height > 30000 && { clip: { x: 0, y: 0, width, height: 30000 } }) });
				await context.close();
			}
			process.stdout.write('.');
		}

		// Search runs under the CSP (Pagefind is WebAssembly).
		await browser.close();
		browser = await engines[engineName].launch();
		const context = await browser.newContext({ viewport: widths.desktop, ignoreHTTPSErrors: true });
		await stubBeacon(context);
		await context.addInitScript(observe, 'light');
		const page = await context.newPage();
		await page.goto(`${base}/docs/`, { waitUntil: 'load' });
		await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
		await page.getByRole('button', { name: /search/i }).first().click();
		await page.keyboard.type('temperature');
		const found = await page.locator('.pagefind-ui__result').first().waitFor({ timeout: 15000 }).then(() => true, () => false);
		if (!found) report(engineName, '/docs/', 'search', 'searching "temperature" found nothing');
		for (const c of await page.evaluate(() => window.__csp)) report(engineName, '/docs/', 'search', `CSP violation: ${c}`);
		await context.close();
		await browser.close();
		console.log(` ${engineName}`);
	}
} finally {
	server.kill();
}

if (problems.length) {
	console.error(problems.map((p) => `browser: ${p}`).join('\n'));
	console.error(`browser: ${problems.length} problems`);
	process.exit(1);
}
console.log(`browser: ${routes.length} pages${process.env.SHARD ? ` (shard ${process.env.SHARD})` : ''} in ${variants.length} variants pass in ${chosen.join(', ')}, keyboard reach and search included`);
