import test from 'node:test';
import assert from 'node:assert/strict';
import {recordedExamples} from '../../src/lib/launch.mjs';
import {heroDecisions} from '../../src/lib/home-decision.mjs';
test('hero shows all answer types and preserves the complete recorded request timing',()=>{
 const recording=recordedExamples(),items=heroDecisions(recording);
 assert.deepEqual(new Set(items.map(x=>x.type)),new Set(['choice','yes/no','score']));
 for(const item of items){
  const source=recording.items.find(x=>x.id===item.id),q=source.questions.find(x=>x.type===item.type);
  assert.equal(item.serverMs,source.serverMs);assert.equal(item.questionCount,source.questions.length);
  assert.equal(item.text,source.state);assert.equal(item.question,q.ask);
  if(item.type==='choice'){assert.equal(item.answer,q.result);assert.equal(item.detail,q.bars.find(b=>b.top).p.toFixed(3));}
  if(item.type==='yes/no'){assert.equal(item.answer,q.bars[0].p>=.5?'yes':'no');assert.equal(item.detail,q.bars[0].p.toFixed(3));assert.equal(item.detailLabel,'P(yes)');}
  if(item.type==='score'){assert.equal(`expected level ${item.answer}`,q.result);assert.equal(item.detailLabel,'Score range');assert.equal(item.detail,'0–3');}
 }
});
test('hero refuses a missing recording or missing timing',()=>{
 assert.throws(()=>heroDecisions({items:[]}),/recorded question/);
 const recording=structuredClone(recordedExamples());delete recording.items[0].serverMs;
 assert.throws(()=>heroDecisions(recording),/request timing/);
});
