// Exercise the connected recorded walkthrough under the published headers.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { get } from 'node:https';
import { chromium, firefox, webkit } from 'playwright';
const port = Number(process.env.CERTIFIED_PORT ?? 4394);
const base = `https://127.0.0.1:${port}`;
const server = spawn('node', ['scripts/serve.mjs', String(port)], { stdio: ['ignore', 'ignore', 'pipe'] });
let serverErrors = '', browser;
server.stderr.on('data', chunk => { serverErrors += chunk; });
const ready = () => new Promise(resolve => { const r = get(base, { rejectUnauthorized: false }, res => { res.resume(); resolve(true); }); r.on('error', () => resolve(false)); r.setTimeout(1000, () => r.destroy()); });
const until = async (check, message) => { for (let i = 0; i < 100; i++) { if (await check()) return; await new Promise(r => setTimeout(r, 20)); } assert.fail(message); };
try {
  for (let i = 0; !(await ready()); i++) { if (server.exitCode !== null || i >= 200) throw new Error(`Server failed: ${serverErrors}`); await new Promise(r => setTimeout(r, 100)); }
  const engine = process.env.ENGINE ?? 'chromium';
  browser = await ({ chromium, firefox, webkit })[engine].launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  await context.route(/https:\/\/(static\.)?cloudflareinsights\.com\//, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await context.route('**/cdn-cgi/rum*', r => r.fulfill({ status: 204 }));
  const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/demos/teach-and-certify/`); await page.waitForLoadState('networkidle');
  const root = page.locator('[data-ca]');
  assert.equal(await root.count(), 1, 'The connected teach/certify/application walkthrough is missing');
  await root.locator('[data-case="clear"]').waitFor({ state: 'visible' });
  assert.equal(await root.locator('[data-stage]').count(), 3);
  assert.equal(await root.getAttribute('data-target'), '0.05');
  for (const [alpha, count, review] of [['0.02', '0', '3,080'], ['0.05', '1,335', '1,745'], ['0.1', '2,426', '654']]) {
    await root.locator(`[data-target-select="${alpha}"]`).click();
    assert.equal(await root.locator('[data-covered]').textContent(), count);
    assert.equal(await root.locator('[data-review]').textContent(), review);
    for (const [id, probability] of [['clear', 0.96158], ['borderline', 0.83128], ['mistake', 0.95534]]) {
      await root.locator(`[data-case="${id}"]`).click();
      const threshold = { '0.02': null, '0.05': 0.941338173394959, '0.1': 0.690210411337554 }[alpha];
      const eligible = threshold !== null && probability >= threshold;
      assert.equal(await root.getAttribute('data-eligible'), String(eligible));
      assert.match(await root.locator('[data-destination]').textContent(), eligible ? /Route automatically/ : /Human review/);
    }
    if (alpha === '0.02') assert.equal(await root.locator('[data-error-rate]').textContent(), 'Not applicable');
  }
  await root.locator('[data-target-select="0.05"]').click();
  await root.locator('[data-case="mistake"]').click();
  await root.locator('[data-truth] summary').click();
  assert.match(await root.locator('[data-verdict]').textContent(), /Wrong in this test/);
  assert.equal(await root.getAttribute('data-eligible'), 'true', 'Revealing a label changed the route');
  assert.deepEqual(await root.locator('[data-case-text]').allTextContents(), ['How do I change currencies to euros?', 'How do I change currencies to euros?']);
  assert.equal(await root.locator('[data-case-probability]').textContent(), '0.95534');
  console.log('certified-interactions: all recorded cases and targets, denominator and label reveal pass');
  await page.clock.install();
  for (const name of ['learn', 'drift']) {
    const panel = page.locator(`[data-player="${name}"]`);
    assert.equal(await panel.locator('button, input').count(), 0, `${name} still has motion controls`);
    await panel.scrollIntoViewIfNeeded();
    await until(async () => await panel.getAttribute('data-playback') === 'running', `${name} did not autoplay`);
    const phases = await panel.locator('[data-phase]').count();
    await page.clock.runFor(2400 * (phases + 1));
    assert.equal(await panel.getAttribute('data-playback'), 'running', `${name} stopped instead of looping`);
    assert.notEqual(await panel.getAttribute('data-position'), null);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.clock.runFor(10000); assert.equal(await panel.getAttribute('data-playback'), 'paused');
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await until(async () => await panel.getAttribute('data-playback') === 'running', `${name} did not resume after tab visibility`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.clock.runFor(100);
    await until(async () => await panel.getAttribute('data-playback') === 'paused', `${name} continued offscreen`);
    await page.clock.runFor(10000); assert.equal(await panel.getAttribute('data-playback'), 'paused');
    await panel.scrollIntoViewIfNeeded(); await page.clock.runFor(100);
    await until(async () => await panel.getAttribute('data-playback') === 'running', `${name} did not resume on return`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await until(async () => await panel.getAttribute('data-playback') === 'static', `Reduced motion did not stop ${name}`);
    assert.equal(await panel.locator('.is-current').count(), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await until(async () => await panel.getAttribute('data-playback') === 'running', `Motion preference did not restore ${name}`);
  }
  console.log('certified-interactions: both control-free loops, visibility and live reduced motion pass');
  for (const id of ['inbox', 'share', 'promise', 'drift', 'fix', 'gatekeeper', 'rely', 'method', 'next', 'tc-lane-auto', 'tc-lane-person']) assert.equal(await page.locator(`[id="${id}"]`).count(), 1);
  assert.match(await page.locator('[data-monitor-note]').textContent(), /answer.mix.*only reports/i);
  await page.goto(`${base}/demos/teach-and-certify/#promise`);
  assert.equal(await page.locator('#promise .tc-chart').isVisible(), true, 'Repeated-split evidence is hidden');
  assert.equal(await page.locator('.ca-evidence-area details').count(), 0, 'Evidence still collapses');
  assert.equal(await page.getByRole('heading', { name: 'How it was run', exact: true }).count(), 0);
  assert.equal(await page.locator('#method').isVisible(), true, 'Dataset credits must remain visible');
  assert.deepEqual(errors, []);
  await page.clock.resume();
  const nojs = await browser.newContext({ ignoreHTTPSErrors: true, javaScriptEnabled: false });
  const staticPage = await nojs.newPage(); await staticPage.goto(`${base}/demos/teach-and-certify/`);
  assert.equal(await staticPage.locator('[data-stage]').count(), 3);
  assert.equal(await staticPage.locator('.ca-evidence-area details').count(), 0);
  assert.equal(await staticPage.locator('#promise .tc-chart').isVisible(), true);
  assert.equal(await staticPage.locator('[data-covered]').textContent(), '1,335');
  assert.equal(await staticPage.locator('[data-enhance]:visible').count(), 0);
  assert.equal(await staticPage.locator('[data-static-targets]').isVisible(), true);
  assert.equal(await staticPage.locator('[data-truth] summary').isVisible(), true);
  await staticPage.locator('[data-static-cases] summary').click();
  assert.match(await staticPage.locator('[data-static-cases]').textContent(), /Wrong in this test, despite being certified/);
  console.log(`certified-interactions: drift events, aliases, current monitor and static fallback pass in ${engine}`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
