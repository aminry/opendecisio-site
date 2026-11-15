// Exercise the actual figure controls, motion preferences and static fallbacks in a browser.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { get } from 'node:https';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const port = Number(process.env.FIGURE_PORT ?? 4393);
const base = `https://127.0.0.1:${port}`;
const engine = process.env.ENGINE ?? 'chromium';
const server = spawn('node', ['scripts/serve.mjs', String(port)], { stdio: ['ignore', 'ignore', 'pipe'] });
let serverErrors = '';
server.stderr.on('data', (chunk) => { serverErrors += chunk; });
let browser;
let passed = 0;
const ready = () => new Promise((resolve) => {
	const request = get(base, { rejectUnauthorized: false }, (response) => { response.resume(); resolve(response.statusCode === 200); });
	request.on('error', () => resolve(false));
	request.setTimeout(1000, () => request.destroy());
});
const eventually = async (condition, message) => {
	for (let i = 0; i < 100; i++) {
		if (await condition()) return;
		await new Promise((resolve) => setTimeout(resolve, 20));
	}
	assert.fail(message);
};
const check = async (name, run) => { await run(); passed++; console.log(`figure-interactions: ${name}`); };

try {
	for (let i = 0; !(await ready()); i++) {
		if (server.exitCode !== null) throw new Error(`Figure test server exited: ${serverErrors}`);
		if (i === 300) throw new Error(`Figure test server did not start: ${serverErrors}`);
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	browser = await ({ chromium, firefox, webkit })[engine].launch();
	const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
	// Match the page matrix: analytics is unrelated to these controls and is not run by tests.
	await context.route(/https:\/\/(static\.)?cloudflareinsights\.com\//, (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* analytics disabled in tests */' }));
	await context.route('**/cdn-cgi/rum*', (route) => route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } }));
	const page = await context.newPage();
	page.setDefaultTimeout(5000);
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(`${base}/docs/introduction/`);
	await page.waitForLoadState('networkidle');
	await page.clock.install();
	// Reload under the fake clock so the loop's first timer is the fake one.
	await page.reload();
	await page.waitForLoadState('networkidle');
	const flow = page.locator('.fig[data-loop]').first();
	await page.evaluate(() => window.scrollTo(0, 0));
	await flow.scrollIntoViewIfNeeded();
	await page.clock.runFor(100);
	await check('a looping figure has no play, pause or step controls and starts on its own', async () => {
		assert.ok(await page.locator('.fig[data-loop]').count());
		assert.equal(await page.locator('.fig button[data-fig-play], .fig button[data-fig-pause], .fig button[data-fig-step], .fig [data-fig-all]').count(), 0);
		await eventually(async () => await flow.getAttribute('data-playback') === 'running', 'The figure did not start on its own');
	});
	await check('the loop walks every part in order and starts again', async () => {
		const seen = [];
		for (let i = 0; i < 9; i++) {
			seen.push(await flow.locator('[data-phase].is-current').first().getAttribute('data-phase'));
			await page.clock.runFor(1800);
		}
		const parts = await flow.locator('[data-phase]').evaluateAll((els) => [...new Set(els.map((el) => el.dataset.phase))].length);
		assert.ok(new Set(seen).size === parts, `Saw ${[...new Set(seen)]} of ${parts} parts`);
		assert.equal(await flow.getAttribute('data-playback'), 'running', 'The loop stopped');
	});
	await check('the panel keeps one height in every state', async () => {
		const heights = new Set();
		for (let i = 0; i < 6; i++) { heights.add(Math.round((await flow.boundingBox()).height)); await page.clock.runFor(1800); }
		assert.equal(heights.size, 1, `Panel height changed: ${[...heights]}`);
	});
	await check('the loop holds off screen and resumes on return', async () => {
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.clock.runFor(100);
		await eventually(async () => await flow.getAttribute('data-playback') === 'paused', 'The loop continued off screen');
		const held = await flow.locator('.is-current').first().getAttribute('data-phase');
		await page.clock.runFor(10_000);
		assert.equal(await flow.locator('.is-current').first().getAttribute('data-phase'), held);
		await flow.scrollIntoViewIfNeeded();
		await page.clock.runFor(100);
		await eventually(async () => await flow.getAttribute('data-playback') === 'running', 'The loop did not resume on return');
	});
	await check('a hidden document holds the loop', async () => {
		await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
		await page.clock.runFor(100);
		assert.equal(await flow.getAttribute('data-playback'), 'paused');
		await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
		await eventually(async () => await flow.getAttribute('data-playback') === 'running', 'The loop did not resume when the tab returned');
	});
	await check('a motion preference changed after load shows the complete still drawing, and back', async () => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await eventually(async () => await flow.getAttribute('data-playback') === 'static', 'Reduced motion did not stop the loop');
		assert.equal(await page.locator('.fig .is-current').count(), 0, 'A part stayed highlighted under reduced motion');
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await eventually(async () => await flow.getAttribute('data-playback') === 'running', 'The loop did not respond to the restored preference');
	});
	await check('the new abstention figure loops from the API page', async () => {
		await page.goto(`${base}/docs/api/`);
		await page.waitForLoadState('networkidle');
		const fig = page.locator('[data-fig="abstention-gate"]');
		await fig.scrollIntoViewIfNeeded();
		await eventually(async () => await fig.getAttribute('data-playback') === 'running', 'The abstention figure did not loop');
		assert.equal(await fig.locator('li[data-phase]').count(), 4);
	});
	await check('the Images guide\'s three figures loop on their own, walk every part and keep one height', async () => {
		await page.goto(`${base}/docs/images/`);
		await page.waitForLoadState('networkidle');
		for (const [name, parts] of [['image-placement', 3], ['image-box', 4], ['image-budget', 5]]) {
			const fig = page.locator(`[data-fig="${name}"]`);
			await fig.scrollIntoViewIfNeeded();
			await eventually(async () => await fig.getAttribute('data-playback') === 'running', `The ${name} figure did not loop`);
			assert.equal(await fig.locator('button, input').count(), 0, `${name} has a control`);
			const seen = new Set();
			const heights = new Set();
			for (let i = 0; i < parts * 2; i++) {
				seen.add(await fig.locator('[data-phase].is-current').first().getAttribute('data-phase'));
				heights.add(Math.round((await fig.boundingBox()).height));
				await page.clock.runFor(1800);
			}
			assert.equal(seen.size, parts, `${name}: saw ${[...seen]} of ${parts} parts`);
			assert.equal(heights.size, 1, `${name}: the panel height changed: ${[...heights]}`);
		}
	});
	await page.clock.resume();
	await check('field selection uses four keyboard controls instead of individual JSON members', async () => {
		await page.goto(`${base}/docs/build-request/`);
		await page.waitForLoadState('networkidle');
		const map = page.locator('[data-fig="request-map-choice"]');
		assert.equal(await map.locator('[data-field-select]').count(), 4);
		assert.equal(await map.locator('.j[tabindex]').count(), 0);
		const options = map.locator('[data-field-select="options"]');
		await options.focus();
		await page.keyboard.press('Enter');
		assert.equal(await options.getAttribute('aria-pressed'), 'true');
		assert.ok(await map.locator('[data-field="options"].on').count());
		assert.match(await map.locator('[data-field-note]').textContent(), /criteria/);
	});
	await check('the request-flow figure lights the text, the read and the answers in turn', async () => {
		await page.goto(`${base}/docs/concepts/questions/`);
		await page.waitForLoadState('networkidle');
		const overview = page.locator('[data-fig="request-flow"]');
		await overview.scrollIntoViewIfNeeded();
		await eventually(async () => await overview.getAttribute('data-playback') === 'running', 'The request flow did not loop');
		const seen = new Set();
		for (let i = 0; i < 30 && seen.size < 3; i++) {
			for (const phase of ['0', '1', '2']) if (await overview.locator(`[data-phase="${phase}"].is-current`).count()) seen.add(phase);
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
		assert.equal(seen.size, 3, `Lit parts: ${[...seen]}`);
	});
	await check('score presets move the weighted marker and change the level probabilities', async () => {
		await page.goto(`${base}/docs/concepts/score/`);
		await page.waitForLoadState('networkidle');
		const fig = page.locator('[data-fig="score-distribution"]');
		const input = fig.locator('[data-score-input]');
		await input.focus();
		await page.keyboard.press('End');
		assert.match(await fig.locator('[data-score-out]').textContent(), /2\.55/);
		assert.equal(await fig.locator('[data-score-prob="3"]').textContent(), '0.70');
		await page.keyboard.press('Home');
		assert.match(await fig.locator('[data-score-out]').textContent(), /1\.15/);
	});
	await check('manual line includes equality and sends every other case to review', async () => {
		await page.goto(`${base}/docs/concepts/probabilities/`);
		await page.waitForLoadState('networkidle');
		const fig = page.locator('[data-fig="manual-threshold"]');
		const input = fig.locator('[data-threshold-input]');
		assert.match(await fig.locator('[data-threshold-out]').textContent(), /2 act.*2 review/);
		await input.focus();
		await page.keyboard.press('End');
		assert.match(await fig.locator('[data-threshold-out]').textContent(), /0 act.*4 review/);
		await page.keyboard.press('Home');
		assert.match(await fig.locator('[data-threshold-out]').textContent(), /3 act.*1 review/);
		assert.match(await fig.textContent(), /manual policy/i);
	});
	await check('the certificate slider stays on recorded stops, including a refusal', async () => {
		await page.goto(`${base}/docs/tasks/certify/`);
		await page.waitForLoadState('networkidle');
		const fig = page.locator('[data-fig="certify-slider"]');
		const input = fig.locator('input[type="range"]');
		await input.focus();
		await page.keyboard.press('End');
		assert.equal(await input.inputValue(), '2');
		assert.match(await fig.locator('[data-cs-out]').textContent(), /10%.*2,426.*196/);
		await page.keyboard.press('Home');
		assert.match(await fig.locator('[data-cs-out]').textContent(), /nothing is certified/);
		await page.keyboard.press('ArrowRight');
		assert.match(await fig.locator('[data-cs-out]').textContent(), /5%.*1,335.*43/);
	});
	await check('the drift figure loops through the recorded stages with no controls', async () => {
		await page.goto(`${base}/docs/tasks/drift/`);
		await page.waitForLoadState('networkidle');
		const fig = page.locator('[data-fig="drift-replay"]');
		assert.equal(await fig.locator('button, input').count(), 0);
		assert.equal(await fig.locator('li[data-phase]').count(), 3);
		assert.match(await fig.locator('li[data-phase="1"]').textContent(), /out-of-scope traffic/);
		assert.match(await fig.locator('li[data-phase="2"]').textContent(), /certification.*suspended/i);
	});
	await check('interactive figures remain accessible in light and dark themes', async () => {
		for (const route of ['/docs/introduction/', '/docs/build-request/', '/docs/concepts/score/', '/docs/concepts/probabilities/', '/docs/tasks/certify/', '/docs/tasks/drift/']) {
			await page.goto(`${base}${route}`);
			await page.waitForLoadState('networkidle');
			const action = { '/docs/build-request/': '[data-field-select="options"]' }[route];
			if (action) await page.locator(action).first().click();
			for (const theme of ['light', 'dark']) {
				await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
				// The figures' colours transition for up to 480ms after a theme change; axe reads the settled colours.
				await page.waitForTimeout(700);
				const results = await new AxeBuilder({ page }).include('.sl-markdown-content').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
				assert.deepEqual(results.violations.map((v) => `${route} ${theme}: ${v.id}: ${v.help}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`), []);
			}
		}
		assert.deepEqual(errors, []);
	});
	await check('without JavaScript the values remain and no figure is left half-drawn', async () => {
		const staticContext = await browser.newContext({ ignoreHTTPSErrors: true, javaScriptEnabled: false });
		const staticPage = await staticContext.newPage();
		await staticPage.goto(`${base}/docs/concepts/score/`);
		assert.match(await staticPage.locator('[data-score-out]').textContent(), /1\.70/);
		assert.equal(await staticPage.locator('[data-score-input]').isVisible(), false);
		assert.equal(await staticPage.locator('[data-score-prob="2"]').textContent(), '0.60');
		await staticPage.goto(`${base}/docs/tasks/certify/`);
		assert.equal(await staticPage.locator('[data-cs] input').isVisible(), false);
		assert.match(await staticPage.locator('[data-cs-out]').textContent(), /1,335/);
		await staticPage.goto(`${base}/docs/introduction/`);
		assert.equal(await staticPage.locator('.fig .is-current').count(), 0, 'A part is lit without script');
		assert.equal(await staticPage.locator('.fig[data-loop]').first().getAttribute('data-playback'), 'static');
		await staticContext.close();
	});
	await context.close();
	console.log(`figure-interactions: ${passed} checks pass in ${engine}`);
} finally {
	await browser?.close();
	server.kill('SIGTERM');
}
