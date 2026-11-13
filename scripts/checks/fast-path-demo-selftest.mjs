import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readUpstream} from '../../src/lib/upstream.mjs';
import {streamView, contextView, timingView, STATIC_TIMING, POLICY, FACTS} from '../../src/lib/fast-path-demo.mjs';
test('current static short-text cost and illustrative model budget replace encoder history',()=>{
 assert.equal(STATIC_TIMING.cpuMs,0.05);assert.equal(STATIC_TIMING.modelMs,50);
 const fast=timingView('fast'), fallback=timingView('fallback');
 assert.equal(fast.totalMs,0.05);assert.equal(fast.displayMs,'0.05');
 assert.equal(fallback.totalMs,50.05);assert.equal(fallback.displayMs,'50.05');
 assert.match(readUpstream('docs/tasks.md'),/static, `base` \| 0.05/);
});
test('the workload calculator charges every CPU check and includes every model fallback',()=>{
 const v=timingView('average',80);
 assert.ok(Math.abs(v.totalMs-10.05)<1e-9);
 assert.equal(v.fastShare,80);assert.equal(v.displayMs,'10.05');
 assert.equal(v.savingPercent,79.9);
 assert.equal(timingView('average',0).totalMs,50.05);
 assert.equal(timingView('average',100).totalMs,0.05);
 for(const mode of ['average','fast','fallback']){
  const row=timingView(mode);
  assert.equal(row.scaleMs,50.05);
  assert.ok(Math.abs(row.cpuMs+row.modelContributionMs-row.totalMs)<1e-9);
  assert.ok(row.totalWidth>0&&row.totalWidth<=592);
 }
 for(const value of [-1,101,NaN,Infinity])assert.throws(()=>timingView('average',value));
 assert.throws(()=>timingView('invented'));
});
test('moving a fixed policy changes CPU input without dropping facts from the model input',()=>{
 const facts='Delivered 12 days ago.\nUnopened.\nCategory: home.';
 const inline=contextView('inline',facts), context=contextView('context',facts);
 assert.equal(inline.modelText,context.modelText);
 assert.equal(inline.cpuText,inline.modelText);
 assert.equal(context.cpuText,facts);
 assert.ok(inline.cpuCharacters>context.cpuCharacters);
 assert.equal(context.modelText,POLICY+'\n\n'+facts);
 assert.equal(context.registeredContext,POLICY);
 assert.equal(inline.registeredContext,null);
 assert.notEqual(contextView('context',FACTS.a).cpuText,contextView('context',FACTS.b).cpuText);
});
test('facts are preserved verbatim, including empty input, Unicode and markup',()=>{
 for(const facts of ['', '  café 🧾\n<script>example</script>  ']){
  const v=contextView('context',facts);
  assert.equal(v.cpuText,facts);
  assert.equal(v.cpuCharacters,[...facts].length);
  assert.equal(v.modelText,POLICY+'\n\n'+facts);
 }
 assert.throws(()=>contextView('invented','facts'));
});

test('illustrative streams preserve the request, answer and fallback meaning across stages',()=>{
 for(const domain of ['support','moderation','refund']){
  const first=streamView(domain,0,0), answer=streamView(domain,0,2);
  assert.equal(first.text,answer.text);assert.equal(first.completed,false);assert.equal(answer.completed,true);
  assert.equal(answer.route,'table');assert.ok(answer.answer.length>0);
  const fallback=streamView(domain,3,2);
  assert.equal(fallback.route,'decisio');assert.equal(fallback.answer,'Ask decisio');
  assert.equal(streamView(domain,4,2).text,answer.text);
  assert.equal(answer.examples.length,3);
 }
 assert.notEqual(streamView('support',0,2).text,streamView('support',1,2).text);
 assert.equal(streamView('support',0,2).answer,streamView('support',1,2).answer);
 for(const args of [['unknown',0,0],['support',-1,0],['support',0,9]])assert.throws(()=>streamView(...args));
});
