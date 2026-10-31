// Lighthouse on the home page, a docs page, the benchmarks page and the two demos pages, served
// with the site's own headers: each of the four categories must score 95 or
// better (the median of three runs, Lighthouse's default mobile settings).
// Performance is a timing, and a slow runner can pull all three runs of a page
// down together; a page whose performance misses is measured three more times
// in a fresh browser, and fails only if it misses again (a miss that does not
// repeat is a warning, with both sets of scores). The other three categories do
// not depend on timing and get no second measurement. Every run's scores are
// logged.
//   node scripts/checks/lighthouse.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const port = 4391;
const pages = ['/', '/docs/deploy/cloud-gpu/', '/benchmarks/', '/demos/', '/demos/teach-and-certify/'];
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const MIN = 0.95;
const RUNS = 3;
const pct = (s) => Math.round(s * 100);

// Plain HTTP for Lighthouse alone (see scripts/serve.mjs); the browser checks use HTTPS.
const server = spawn('node', ['scripts/serve.mjs', String(port)], { stdio: 'ignore', env: { ...process.env, PLAIN_HTTP: '1' } });
await new Promise((r) => setTimeout(r, 500));

// Chrome now and then fails to bring up its debugging port on a runner; that says nothing about the page, so start it again.
async function launchChrome(tries = 3) {
	for (let i = 1; ; i++) {
		try {
			return await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
		} catch (e) {
			if (i === tries) throw e;
			console.log(`lighthouse: Chrome did not start (${e.message}); try ${i + 1} of ${tries}`);
		}
	}
}

// Three runs of a page in a browser of its own; the median of each category, and every run's performance.
async function measure(path, report) {
	const chrome = await launchChrome();
	try {
		const runs = [];
		for (let i = 0; i < RUNS; i++) {
			const result = await lighthouse(`http://127.0.0.1:${port}${path}`, { port: chrome.port, output: 'html', logLevel: 'error', onlyCategories: categories, blockedUrlPatterns: ['*cloudflareinsights.com*'] });
			runs.push(result.lhr);
			if (report && i === RUNS - 1) writeFileSync(`.lighthouse/${path.replace(/\//g, '_') || 'home'}.html`, result.report);
		}
		const median = (k) => runs.map((r) => r.categories[k].score).sort((a, b) => a - b)[Math.floor(RUNS / 2)];
		return { scores: Object.fromEntries(categories.map((k) => [k, median(k)])), perf: runs.map((r) => pct(r.categories.performance.score)) };
	} finally {
		await chrome.kill();
	}
}

const failures = [];
mkdirSync('.lighthouse', { recursive: true });
try {
	for (const path of pages) {
		const first = await measure(path, true);
		const { scores } = first;
		console.log(`lighthouse: ${path} ${categories.map((k) => `${k} ${pct(scores[k])}`).join(', ')} (performance runs ${first.perf.join(', ')})`);
		for (const k of categories.filter((c) => c !== 'performance')) if (scores[k] < MIN) failures.push(`${path}: ${k} ${pct(scores[k])} (needs ${MIN * 100})`);
		if (scores.performance >= MIN) continue;
		const again = await measure(path, false);
		const note = `performance ${pct(scores.performance)} (runs ${first.perf.join(', ')}), then ${pct(again.scores.performance)} (runs ${again.perf.join(', ')}) in a fresh browser`;
		if (again.scores.performance >= MIN) console.warn(`lighthouse: warning: ${path} ${note}; the miss did not repeat`);
		else failures.push(`${path}: ${note} (needs ${MIN * 100})`);
	}
} finally {
	server.kill();
}
if (failures.length) {
	console.error(failures.map((f) => `lighthouse: ${f}`).join('\n'));
	console.error('lighthouse: the reports are in .lighthouse/');
	process.exit(1);
}
