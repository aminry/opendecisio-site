// Exercise the decision fast path guide under the published headers.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { get } from 'node:https';
import { chromium, firefox, webkit } from 'playwright';
const port = Number(process.env.FAST_PATH_PORT ?? 4397);
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
  await page.goto(`${base}/docs/tasks/fast-table/`); await page.waitForLoadState('networkidle');
  const scenes = page.locator('[data-fast-loop]');
  assert.equal(await scenes.count(), 3, 'The context, routing and learning scenes are missing');
  assert.equal(await page.getByRole('heading', {level:1}).textContent(), 'Give recurring decisions a fast path');
  const levels = await page.locator('main h1,main h2,main h3,main h4').evaluateAll(nodes => nodes.map(n => Number(n.tagName.slice(1))));
  let previous = 0;
  for (const level of levels) { assert.ok(level <= previous + 1, 'The guide skips a heading level'); previous = level; }
  await page.clock.install();
  for (const scene of await scenes.all()) {
    assert.equal(await scene.locator('button,input').count(), 0, 'An animation control was added');
    await scene.scrollIntoViewIfNeeded();
    await until(async () => await scene.getAttribute('data-playback') === 'running', 'Scene did not autoplay');
    const count = await scene.locator('[data-fast-phase]').count();
    assert.ok(count >= 2);
    await page.clock.runFor((count + 1) * 2400);
    assert.equal(await scene.getAttribute('data-playback'), 'running', 'Scene stopped after one cycle');
    await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange')); });
    await page.clock.runFor(10000);assert.equal(await scene.getAttribute('data-playback'),'paused');
    await page.evaluate(() => { delete document.hidden;document.dispatchEvent(new Event('visibilitychange')); });
    await until(async()=>await scene.getAttribute('data-playback')==='running','Scene did not resume in visible tab');
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.clock.runFor(100);
    await until(async()=>await scene.getAttribute('data-playback')==='paused','Scene continued offscreen');
    await scene.scrollIntoViewIfNeeded();await page.clock.runFor(100);
    await until(async()=>await scene.getAttribute('data-playback')==='running','Scene did not resume onscreen');
    await page.emulateMedia({reducedMotion:'reduce'});
    await until(async()=>await scene.getAttribute('data-playback')==='static','Reduced motion did not stop scene');
    assert.equal(await scene.locator('.is-current').count(),0);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await until(async()=>await scene.getAttribute('data-playback')==='running','Scene did not resume after motion preference');
  }
  const fragments=['1-see-where-it-works-great','2-choose-a-student','3-ask-for-it','4-read-what-it-kept','5-learn-from-your-traffic-with-no-labels','6-learn-across-replicas','7-measure-it-on-your-own-host','8-when-to-use-something-else','9-operating-notes','what-next'];
  for(const id of fragments)assert.equal(await page.locator(`[id="${id}"]`).count(),1,`Missing old fragment ${id}`);
  assert.equal(await page.locator('.fp-scene details').count(),0);
  assert.deepEqual(errors,[]);
  await page.clock.resume();
  const staticContext=await browser.newContext({ignoreHTTPSErrors:true,javaScriptEnabled:false});
  const staticPage=await staticContext.newPage();await staticPage.goto(`${base}/docs/tasks/fast-table/`);
  assert.equal(await staticPage.locator('[data-fast-loop]').count(),3);
  for(const scene of await staticPage.locator('[data-fast-loop]').all()) {
    assert.equal(await scene.locator('[data-fast-phase]:visible').count(),await scene.locator('[data-fast-phase]').count());
    assert.equal(await scene.locator('button,input').count(),0);
  }
  assert.match(await staticPage.locator('[data-fp-context]').textContent(),/policy/i);
  assert.match(await staticPage.locator('[data-fp-state]').first().textContent(),/days/i);
  console.log(`fast-path-interactions: three autoplay scenes, visibility, reduced motion, aliases and no-JS pass in ${engine}`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
