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
	await page.locator('.fig[data-live] [data-fig-pause]').waitFor({ state: 'visible' });
	await check('a complete diagram is shown before playback is requested', async () => {
		assert.ok(await page.locator('.fig[data-live]').count());
		assert.equal(await page.locator('.fig.is-run').count(), 0, 'A diagram started moving without user input');
	});
	await page.clock.install();
	const flow = page.locator('.fig[data-live]').first();
	await check('Play is finite and ends on the complete diagram', async () => {
		await flow.locator('[data-fig-play]').click();
		assert.equal(await flow.getAttribute('data-playback'), 'running');
		await page.clock.runFor(4500);
		assert.equal(await flow.getAttribute('data-playback'), 'finished');
		assert.equal(await page.locator('.fig.is-run').count(), 0);
		await page.clock.runFor(20_000);
		assert.equal(await flow.getAttribute('data-playback'), 'finished', 'Playback looped');
	});
	await check('Pause holds a sequence until Play resumes it', async () => {
		await flow.locator('[data-fig-play]').click();
		await page.clock.runFor(300);
		await flow.locator('[data-fig-pause]').click();
		await page.clock.runFor(10_000);
		assert.equal(await flow.getAttribute('data-playback'), 'paused');
		await flow.locator('[data-fig-play]').click();
		await page.clock.runFor(4500);
		assert.equal(await flow.getAttribute('data-playback'), 'finished');
	});
	await check('Step works from the keyboard and Show all restores the full view', async () => {
		await flow.locator('[data-fig-step]').focus();
		await page.keyboard.press('Enter');
		assert.equal(await flow.getAttribute('data-step'), '0');
		assert.match(await flow.locator('[data-fig-status]').textContent(), /Text/);
		await page.keyboard.press('Enter');
		assert.equal(await flow.getAttribute('data-step'), '1');
		await flow.locator('[data-fig-all]').click();
		assert.equal(await flow.getAttribute('data-step'), null);
	});
	await check('playback holds off screen and resumes only the requested sequence', async () => {
		await flow.locator('[data-fig-play]').click();
		await page.clock.runFor(200);
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.clock.runFor(100);
		await eventually(async () => await flow.getAttribute('data-playback') === 'paused', 'Playback continued off screen');
		await page.clock.runFor(10_000);
		assert.equal(await flow.getAttribute('data-playback'), 'paused');
		await flow.scrollIntoViewIfNeeded();
		await page.clock.runFor(100);
		await eventually(async () => await flow.getAttribute('data-playback') === 'running', 'Requested playback did not resume on return');
		await page.clock.runFor(4500);
		assert.equal(await flow.getAttribute('data-playback'), 'finished');
	});
	await check('a hidden document holds its requested sequence', async () => {
		await flow.locator('[data-fig-play]').click();
		await page.clock.runFor(200);
		await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
		await page.clock.runFor(10_000);
		assert.equal(await flow.getAttribute('data-playback'), 'paused');
		await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
		await page.clock.runFor(4500);
		assert.equal(await flow.getAttribute('data-playback'), 'finished');
	});
	await check('a motion preference changed after load stops playback', async () => {
		await flow.locator('[data-fig-play]').click();
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await eventually(async () => await flow.getAttribute('data-playback') === 'finished', 'Reduced motion did not restore the complete diagram');
		assert.equal(await flow.locator('[data-fig-play]').isDisabled(), true);
		assert.equal(await page.locator('.fig.is-run').count(), 0);
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await eventually(() => flow.locator('[data-fig-play]').isEnabled(), 'Playback did not respond to the changed motion preference');
		assert.equal(await flow.locator('[data-fig-play]').isEnabled(), true);
		assert.equal(await page.locator('.fig.is-run').count(), 0);
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
	await check('the question-type overview steps highlight the corresponding parts of its SVG', async () => {
		await page.goto(`${base}/docs/concepts/questions/`);
		await page.waitForLoadState('networkidle');
		const overview = page.locator('[data-fig="request-flow"]');
		await overview.locator('[data-fig-step]').click();
		assert.equal(await overview.locator('[data-phase="0"].is-current').count(), 1);
		await overview.locator('[data-fig-step]').click();
		assert.equal(await overview.locator('[data-phase="1"].is-current').count(), 1);
		await overview.locator('[data-fig-step]').click();
		assert.equal(await overview.locator('[data-phase="2"].is-current').count(), 3);
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
	await check('drift frames identify the recorded change and suspension without inventing a recovery', async () => {
		await page.goto(`${base}/docs/tasks/drift/`);
		await page.waitForLoadState('networkidle');
		const fig = page.locator('[data-fig="drift-replay"]');
		assert.equal(await fig.locator('[data-drift-select]').count(), 3);
		await fig.locator('[data-drift-select="shift"]').click();
		assert.match(await fig.locator('[data-drift-out]').textContent(), /out-of-scope traffic/);
		await fig.locator('[data-drift-select="suspended"]').focus();
		await page.keyboard.press('Enter');
		assert.match(await fig.locator('[data-drift-out]').textContent(), /certification.*suspended/i);
		assert.equal(await fig.locator('[data-drift-event][aria-current="step"]').count(), 1);
	});
	await check('interactive figures remain accessible in light and dark themes', async () => {
		for (const route of ['/docs/introduction/', '/docs/build-request/', '/docs/concepts/score/', '/docs/concepts/probabilities/', '/docs/tasks/certify/', '/docs/tasks/drift/']) {
			await page.goto(`${base}${route}`);
			await page.waitForLoadState('networkidle');
			const action = { '/docs/introduction/': '[data-fig-step]', '/docs/build-request/': '[data-field-select="options"]', '/docs/tasks/drift/': '[data-drift-select="shift"]' }[route];
			if (action) await page.locator(action).first().click();
			for (const theme of ['light', 'dark']) {
				await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
				const results = await new AxeBuilder({ page }).include('.sl-markdown-content').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
				assert.deepEqual(results.violations.map((v) => `${route} ${theme}: ${v.id}: ${v.help}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`), []);
			}
		}
		assert.deepEqual(errors, []);
	});
	await check('without JavaScript the values remain and enhancement controls are hidden', async () => {
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
		assert.equal(await staticPage.locator('.fig.is-run').count(), 0);
		assert.equal(await staticPage.locator('[data-fig-play]').isVisible(), false);
		await staticContext.close();
	});
	await context.close();
	console.log(`figure-interactions: ${passed} checks pass in ${engine}`);
} finally {
	await browser?.close();
	server.kill('SIGTERM');
}
