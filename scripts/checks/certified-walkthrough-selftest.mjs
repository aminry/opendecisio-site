import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = JSON.parse(readFileSync(new URL('../../src/data/teach-certify/teach_certify.json', import.meta.url)));
const cases = JSON.parse(readFileSync(new URL('../../src/data/teach-certify/walkthrough.json', import.meta.url)));
import * as api from '../../src/lib/certified-walkthrough.mjs';
test('recorded walkthrough supports the three measured targets', () => {
  assert.equal(typeof api.makeWalkthrough, 'function', 'walkthrough data helper is missing');
  const record = api.makeWalkthrough(source.inbox, cases, source.decisio);
  const results = ['0.02', '0.05', '0.1'].map(a => api.selectResult(record, a, 'clear'));
  assert.deepEqual(results.map(r => r.covered), [0, 1335, 2426]);
  assert.deepEqual(results.map(r => r.review), [3080, 1745, 654]);
  assert.deepEqual(results.map(r => r.errors), [0, 43, 196]);
  assert.equal(results[0].wrongRate, null);
  assert.equal(results[0].eligible, false);
  assert.equal(results[1].wrongRate, 43 / 1335);
});
test('changing the target leaves a recorded prediction intact', () => {
  assert.equal(typeof api.makeWalkthrough, 'function');
  const record = api.makeWalkthrough(source.inbox, cases, source.decisio);
  const before = JSON.stringify(record);
  const a = api.selectResult(record, '0.05', 'borderline');
  const b = api.selectResult(record, '0.1', 'borderline');
  assert.equal(a.eligible, false); assert.equal(b.eligible, true);
  assert.deepEqual(a.example, b.example); assert.equal(JSON.stringify(record), before);
});
test('a known certified mistake is not sent to review by knowledge of its label', () => {
  assert.equal(typeof api.makeWalkthrough, 'function');
  const record = api.makeWalkthrough(source.inbox, cases, source.decisio);
  const r = api.selectResult(record, '0.05', 'mistake');
  assert.equal(r.eligible, true); assert.notEqual(r.example.answer, r.example.label);
  assert.equal(r.example.testIndex, 255);
});
test('the exact cutoff is included; rounding cannot affect routing', () => {
  assert.equal(typeof api.makeWalkthrough, 'function');
  const record = api.makeWalkthrough(source.inbox, cases, source.decisio);
  const copy = structuredClone(record);
  copy.cases[0].probability = copy.targets['0.05'].threshold;
  assert.equal(api.selectResult(copy, '0.05', copy.cases[0].id).eligible, true);
  copy.cases[0].probability -= 0.000000001;
  assert.equal(api.selectResult(copy, '0.05', copy.cases[0].id).eligible, false);
});
test('unknown selections and inconsistent recordings fail explicitly', () => {
  assert.equal(typeof api.makeWalkthrough, 'function');
  const record = api.makeWalkthrough(source.inbox, cases, source.decisio);
  assert.throws(() => api.selectResult(record, '0.03', 'clear'));
  assert.throws(() => api.selectResult(record, '0.05', 'missing'));
  assert.throws(() => api.makeWalkthrough(source.inbox, { ...cases, model: 'g12' }, source.decisio));
  assert.throws(() => api.makeWalkthrough(source.inbox, cases, '0.17.0'));
  const bad = structuredClone(source.inbox); bad.targets['0.02'].covered = 1;
  assert.throws(() => api.makeWalkthrough(bad, cases, source.decisio));
});
