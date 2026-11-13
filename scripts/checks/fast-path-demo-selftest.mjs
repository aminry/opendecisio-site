import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readUpstream} from '../../src/lib/upstream.mjs';
import {contextView, timingView, POLICY, FACTS} from '../../src/lib/fast-path-demo.mjs';
const record = JSON.parse(readUpstream('runs/2026-10-30_fast-table/summary.json')).clinc150_timed;
test('timing replay keeps the measured sample separate from the full test population',()=>{
 const average=timingView(record,'average');
 assert.equal(average.modelMs,384);assert.equal(average.cpuMs,21.1);
 assert.equal(average.displayMs,'71');assert.equal(average.savingPercent,82);
 assert.ok(Math.abs(average.totalMs-71.02)<1e-9);
 assert.equal(average.modelRequests,26);assert.equal(average.requestCount,200);
 assert.equal(timingView(record,'fast').displayMs,'21.1');
 const fallback=timingView(record,'fallback');
 assert.equal(fallback.displayMs,'405');assert.ok(fallback.totalMs>fallback.modelMs);
});
test('all timing views use one scale and account for CPU work before model fallback',()=>{
 for(const mode of ['average','fast','fallback']){
  const v=timingView(record,mode);
  assert.equal(v.scaleMs,405.1);
  assert.ok(Math.abs(v.cpuMs+v.modelContributionMs-v.totalMs)<1e-9);
  assert.ok(v.totalWidth>0&&v.totalWidth<=592);
 }
 assert.throws(()=>timingView(record,'invented'));
 assert.throws(()=>timingView({...record,n:0},'average'));
 assert.throws(()=>timingView({...record,deferred:201},'average'));
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
