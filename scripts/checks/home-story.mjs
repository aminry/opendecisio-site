// Exercise the homepage explanations under the published headers.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { get } from 'node:https';
import { chromium, firefox, webkit } from 'playwright';
const port = Number(process.env.HOME_STORY_PORT ?? 4401);
const base = `https://127.0.0.1:${port}`;
const server = spawn('node', ['scripts/serve.mjs', String(port)], { stdio: ['ignore', 'ignore', 'pipe'] });
let serverErrors = '', browser;
server.stderr.on('data', chunk => { serverErrors += chunk; });
const ready = () => new Promise(resolve => { const r = get(base, { rejectUnauthorized: false }, res => { res.resume(); resolve(true); }); r.on('error', () => resolve(false)); r.setTimeout(1000, () => r.destroy()); });
const until = async (check, message) => { for (let i = 0; i < 100; i++) { if (await check()) return; await new Promise(r => setTimeout(r, 20)); } assert.fail(message); };
try {
  for(let i=0;!(await ready());i++){if(server.exitCode!==null||i>200)throw Error(serverErrors);await new Promise(r=>setTimeout(r,100));}
  const engine=process.env.ENGINE??'chromium';browser=await({chromium,firefox,webkit})[engine].launch();
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  await context.route(/https:\/\/(static\.)?cloudflareinsights\.com\//,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  await context.route('**/cdn-cgi/rum*',r=>r.fulfill({status:204}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/');await page.waitForLoadState('networkidle');
  assert.match(await page.locator('h1').textContent(),/decision model for your application/i);
  assert.equal(await page.locator('[data-home-core],[data-home-cert],[data-home-fast]').count(),3);
  const scenes=page.locator('[data-home-core],[data-home-cert],[data-home-fast]');
  assert.equal(await scenes.locator('button,input').count(),0,'Explanations depend on controls');
  assert.equal(await page.locator('[data-home-core] .dv-answer').count(),1);
  for(const type of ['choice','yes/no','score'])assert.equal(await page.locator(`[data-core-type="${type}"]`).count(),1);
  assert.equal(await page.locator('[data-core-latency]').count(),1,'Hero does not show decision speed');
  assert.match(await page.locator('[data-home-fast]').textContent(),/50 µs/);
  assert.match(await page.locator('[data-home-fast]').textContent(),/50 ms/);
  assert.match(await page.locator('[data-home-cert]').textContent(),/certified/);
  const learning=page.locator('[data-task-learning]');
  assert.equal(await learning.count(),1,'Task adaptation is missing');
  assert.match(await learning.textContent(),/labelled messages/i);
  assert.match(await learning.textContent(),/base weights stay fixed/i);
  assert.match(await learning.textContent(),/small task head/i);
  assert.match(await page.locator('[data-teaching-gain]').textContent(),/77\.6%[\s\S]*84\.2%/,'Recorded teaching gain missing');
  assert.match(await page.locator('[data-cert-check]').textContent(),/separate examples/i);
  assert.match(await page.locator('[data-cert-check]').textContent(),/5%/);
  for(const id of ['teach','certify','use-cases','fit','board','try','ask'])assert.equal(await page.locator('#'+id).count(),1);
  assert.equal(await page.getByRole('tab',{name:'GPU',exact:true}).count(),1);
  for(const name of ['Mac (MLX)','Ollama']){await page.getByRole('tab',{name,exact:true}).click();assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);}
  if(engine==='chromium'){
    await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:base});
    const copy=page.locator('.gs__panel.on [data-copy-box]').first(),expected=await copy.locator('..').getAttribute('data-copy-text');
    await copy.click();await until(async()=>await copy.textContent()==='Copied','Copy did not complete');
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),expected,'Copied command differs from the displayed block');
  }
  await page.clock.install();
  const core=page.locator('[data-home-core]');await core.scrollIntoViewIfNeeded();
  await until(async()=>await core.getAttribute('data-playback')==='running','Hero does not start');
  const heroRecords=JSON.parse(await core.getAttribute('data-records')),seenTypes=new Set();
  for(let i=0;i<28;i++){
    await page.clock.runFor(1000);const step=Number(await core.getAttribute('data-step')),record=heroRecords[Math.floor(step/3)%heroRecords.length];
    assert.equal(await core.locator('[data-core-type].is-current').getAttribute('data-core-type'),record.type);
    assert.equal(await core.locator('[data-core-latency]').textContent(),record.serverMs.toFixed(1));
    assert.equal(await core.locator('[data-core-timing-scope]').textContent(),`Whole ${record.questionCount}-question request`);
    if(step%3===2){seenTypes.add(record.type);assert.equal(await core.locator('[data-core-answer]').textContent(),record.answer);assert.equal(await core.locator('[data-core-probability]').textContent(),record.detail);assert.equal(await core.locator('[data-core-detail-label]').textContent(),record.detailLabel);}
  }
  assert.deepEqual(seenTypes,new Set(['choice','yes/no','score']),'Hero did not show all question types automatically');
  const taught=page.locator('[data-home-cert]');await taught.scrollIntoViewIfNeeded();
  await until(async()=>await taught.getAttribute('data-playback')==='running','Teaching does not start');
  for(let i=0;await taught.getAttribute('data-phase')!=='0';i++){assert.ok(i<17);await page.clock.runFor(1000);}
  assert.notEqual(await taught.locator('.hp-label-packet').evaluate(el=>getComputedStyle(el).animationName),'none','Labels do not flow into the task head');
  assert.notEqual(await taught.locator('.hp-head-weights i').first().evaluate(el=>getComputedStyle(el).animationName),'none','Task head does not visibly adapt');
  for(let i=0;await taught.getAttribute('data-phase')!=='1';i++){assert.ok(i<6);await page.clock.runFor(1000);}
  assert.equal(await taught.locator('[data-cert-badge]').textContent(),'Checking…');
  assert.equal(await taught.locator('[data-cert-route].dv-selected').count(),0,'Certification check is presented as an app action');
  for(const scene of await scenes.all()){
    await scene.scrollIntoViewIfNeeded();await until(async()=>await scene.getAttribute('data-playback')==='running','Scene does not start');
    const before=await scene.getAttribute('data-step');await page.clock.runFor(19000);assert.notEqual(await scene.getAttribute('data-step'),before);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    const step=await scene.getAttribute('data-step');await page.clock.runFor(10000);assert.equal(await scene.getAttribute('data-step'),step);assert.equal(await scene.getAttribute('data-playback'),'paused');
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    await page.emulateMedia({reducedMotion:'reduce'});await until(async()=>await scene.getAttribute('data-playback')==='static','Reduced motion ignored');
    assert.equal(await scene.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
    await page.emulateMedia({reducedMotion:'no-preference'});
  }
  assert.deepEqual(errors,[]);
  for(const width of [390,360,320]){
    await page.setViewportSize({width,height:844});
    for(const scene of await scenes.all()){
      await scene.scrollIntoViewIfNeeded();await until(async()=>await scene.getAttribute('data-playback')==='running','Phone scene does not start');
      const heights=[];
      for(let i=0;i<52;i++){await page.clock.runFor(1000);heights.push(await scene.evaluate(el=>el.clientHeight));}
      assert.ok(await scene.locator('.dv-route>strong').evaluateAll(nodes=>nodes.every(el=>el.scrollWidth<=el.clientWidth+2)),`Route label spills into its card padding at ${width}px`);
      assert.ok(Math.max(...heights)-Math.min(...heights)<=2,`Scene changes height through its cases at ${width}px: ${Math.min(...heights)}–${Math.max(...heights)}`);
    }
  }
  await page.clock.resume();
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.emulateMedia({reducedMotion:'reduce'});
  const output=await page.locator('[data-home-core] .dv-answer').boundingBox();assert.ok(output.y+output.height<=844,'First result is below the phone screen');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone overflow');
  const staticContext=await browser.newContext({ignoreHTTPSErrors:true,javaScriptEnabled:false});const staticPage=await staticContext.newPage();await staticPage.goto(base+'/');
  assert.match(await staticPage.locator('[data-home-core]').textContent(),/billing/);assert.match(await staticPage.locator('[data-home-fast]').textContent(),/decisio/);
  console.log(`home-story: model, real examples, feature states, setup, automatic motion, reduced motion, no-JS, phone first result pass in ${engine}`);
} finally {await browser?.close();server.kill('SIGTERM');}
