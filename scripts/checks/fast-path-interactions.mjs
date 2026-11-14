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
  let videoRequests=0;page.on('request',request=>{if(request.url().includes('/media/decision-fast-path.mp4'))videoRequests++;});
  await page.goto(`${base}/docs/tasks/fast-table/`); await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('[data-context-consumer=cpu]').count(),1,'Facts-only CPU path is missing');
  assert.equal(await page.locator('[data-context-consumer=model]').count(),1,'Combined context and facts path is missing');
  assert.match(await page.locator('[data-workload-saving]').textContent(),/79\.9%/);
  const scenes = page.locator('[data-fast-loop]');
  assert.equal(await scenes.count(), 3, 'The context, routing and learning scenes are missing');
  assert.equal(await page.getByRole('heading', {level:1}).textContent(), 'Give recurring decisions a fast path');
  const levels = await page.locator('main h1,main h2,main h3,main h4').evaluateAll(nodes => nodes.map(n => Number(n.tagName.slice(1))));
  let previous = 0;
  for (const level of levels) { assert.ok(level <= previous + 1, 'The guide skips a heading level'); previous = level; }
  const stream=page.locator('[data-fast-stream]');
  assert.equal(await stream.count(),1);
  assert.equal(await page.locator('html').getAttribute('data-has-sidebar'),null);
  assert.ok((await page.locator('.fp-hero').boundingBox()).width>1000,'Opening still uses the narrow docs column');
  assert.ok((await stream.boundingBox()).x>(await page.locator('.fp-hero-copy').boundingBox()).x+300,'Hero has not become a side-by-side explanation');
  assert.equal(await stream.locator('button,input,textarea').count(),0);
  assert.match(await stream.textContent(),/~50 µs/);assert.match(await stream.textContent(),/~50 ms/);
  const timing=page.locator('[data-fast-timing]'),anatomy=page.locator('[data-fast-context]');
  assert.equal(await timing.locator('.fp-cost-card').count(),3);
  assert.match(await timing.textContent(),/50.05/);assert.match(await timing.textContent(),/10.05/);
  assert.match(await timing.textContent(),/assumed 80%/);
  assert.equal(await timing.locator('button,input,textarea').count(),0);
  assert.equal(await anatomy.locator('button,input,textarea').count(),0);
  assert.equal(await page.getByRole('heading',{name:'Video transcript',exact:true}).count(),0);
  assert.equal(await page.locator('.fp-transcript,[data-film-seek]').count(),0);
  const video=page.locator('.fp-film video');
  assert.equal(await video.count(),1);
  assert.equal(await video.getAttribute('preload'),'none');
  assert.equal(await video.getAttribute('autoplay'),null);
  assert.equal(videoRequests,0,'Film downloaded before reader intent');
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(v=>{v.muted=true;return v.play();});
  await until(()=>video.evaluate(v=>!v.paused&&v.currentTime>0),'Video did not actually decode and play');
  assert.equal(await video.evaluate(v=>Math.round(v.duration)),40);
  await video.evaluate(v=>{v.pause();v.currentTime=25;});
  await until(()=>video.evaluate(v=>!v.seeking&&v.currentTime>=25),'Video could not seek to the context scene');
  const mediaHeaders=await page.request.head(`${base}/media/decision-fast-path.mp4`);
  assert.equal(mediaHeaders.headers()['accept-ranges'],'bytes');
  const captions=await page.request.get(`${base}/media/decision-fast-path.vtt`);
  assert.equal(captions.status(),200);assert.match(captions.headers()['content-type'],/text\/vtt/);
  await video.evaluate(v=>{v.textTracks[0].mode='hidden';});
  await until(()=>video.evaluate(v=>v.textTracks[0].cues?.length===5),'Caption track did not load and parse');
  assert.ok(await video.evaluate(v=>v.textTracks[0].activeCues?.[0]?.text.includes('shared policy')),'Caption does not match the selected context scene');
  assert.match(await captions.text(),/WEBVTT/);
  assert.match(await captions.text(),/00:00:32.000 --> 00:00:40.000/);
  await video.evaluate(v=>v.pause());
  await page.clock.install();
  await stream.scrollIntoViewIfNeeded();await page.clock.runFor(100);
  await until(async()=>await stream.getAttribute('data-playback')==='running','Opening stream did not autoplay');
  const before=await stream.locator('[data-stream-message]').textContent();
  await page.clock.runFor(6100);
  assert.notEqual(await stream.locator('[data-stream-message]').textContent(),before,'Loop highlights without advancing a request');
  const counter=await stream.getAttribute('data-example');
  await page.clock.runFor(24000);
  assert.notEqual(await stream.getAttribute('data-example'),counter);
  assert.equal(await stream.locator('[data-stream-domain].is-current').count(),1);
  await anatomy.scrollIntoViewIfNeeded();await page.clock.runFor(100);
  await until(async()=>await anatomy.getAttribute('data-playback')==='running','Context did not autoplay');
  const policy=await anatomy.locator('[data-fp-context]').textContent(),facts=await anatomy.locator('[data-context-facts]').textContent();
  await page.clock.runFor(5100);
  assert.equal(await anatomy.locator('[data-fp-context]').textContent(),policy);
  assert.notEqual(await anatomy.locator('[data-context-facts]').textContent(),facts);
  await stream.scrollIntoViewIfNeeded();await until(async()=>await stream.getAttribute('data-playback')==='running','Opening did not resume');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(10000);assert.equal(await stream.getAttribute('data-playback'),'paused');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await until(async()=>await stream.getAttribute('data-playback')==='running','Stream did not resume in visible tab');
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.clock.runFor(100);
  await until(async()=>await stream.getAttribute('data-playback')==='paused','Stream did not stop offscreen');
  await stream.scrollIntoViewIfNeeded();await page.clock.runFor(100);
  await page.emulateMedia({reducedMotion:'reduce'});
  await until(async()=>await stream.getAttribute('data-playback')==='static','Stream ignored reduced motion');
  assert.equal(await stream.getAttribute('data-phase'),'2');
  await page.emulateMedia({reducedMotion:'no-preference'});

  for (const scene of await scenes.all()) {
    assert.equal(await scene.getByRole('button', {name:/play|pause|animate/i}).count(), 0, 'An animation control was added');
    await scene.scrollIntoViewIfNeeded();
    await until(async () => await scene.getAttribute('data-playback') === 'running', 'Scene did not autoplay');
    const count = await scene.locator('[data-fast-phase]').count();
    assert.ok(count >= 2 || await scene.getAttribute('data-fast-timing') !== null || await scene.getAttribute('data-fast-context') !== null);
    await page.clock.runFor(Math.max(8000,(count + 1) * 2400));
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
    assert.equal(await scene.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0,'Motion continued with reduced motion');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await until(async()=>await scene.getAttribute('data-playback')==='running','Scene did not resume after motion preference');
  }
  for (const arrow of await page.locator('.fp-scene .fp-arrow').all()) {
    const box=await arrow.boundingBox();assert.ok(box.width<=80&&box.height<=80,'A flow arrow lost its size constraints');
  }
  const fragments=['1-see-where-it-works-great','2-choose-a-student','3-ask-for-it','4-read-what-it-kept','5-learn-from-your-traffic-with-no-labels','6-learn-across-replicas','7-measure-it-on-your-own-host','8-when-to-use-something-else','9-operating-notes','what-next'];
  for(const id of fragments)assert.equal(await page.locator(`[id="${id}"]`).count(),1,`Missing old fragment ${id}`);
  assert.equal(await page.locator('.fp-scene details').count(),0);
  assert.deepEqual(errors,[]);
  for(const width of [390,360]){
    await page.setViewportSize({width,height:844});
    const saving=page.locator('[data-workload-saving]');await saving.scrollIntoViewIfNeeded();
    const number=await saving.locator(':scope>strong').boundingBox(),explanation=await saving.locator(':scope>span').boundingBox();
    assert.ok(number.x+number.width<=explanation.x+1,`Workload saving overlaps its explanation at ${width}px`);
  }
  await page.clock.resume();
  const staticContext=await browser.newContext({ignoreHTTPSErrors:true,javaScriptEnabled:false});
  const staticPage=await staticContext.newPage();await staticPage.goto(`${base}/docs/tasks/fast-table/`);
  assert.equal(await staticPage.locator('[data-fast-loop]').count(),3);
  assert.match(await staticPage.locator('[data-fast-stream]').textContent(),/billing/);
  assert.equal(await staticPage.locator('[data-fast-stream] button:visible').count(),0);
  for(const scene of await staticPage.locator('[data-fast-loop]').all()) {
    assert.equal(await scene.locator('[data-fast-phase]:visible').count(),await scene.locator('[data-fast-phase]').count());
    assert.equal(await scene.locator('button:visible,input:visible,textarea:visible').count(),0);
  }
  assert.match(await staticPage.locator('[data-fp-context]').textContent(),/policy/i);
  assert.match(await staticPage.locator('[data-context-facts]').textContent(),/days/i);
  assert.match(await staticPage.locator('.fp-cost-card').first().textContent(),/50 µs/);
  console.log(`fast-path-interactions: compact costs, automatic facts, automatic requests, visibility, reduced motion, aliases and no-JS pass in ${engine}`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
