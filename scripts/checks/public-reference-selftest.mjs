import {test} from 'node:test';
import assert from 'node:assert/strict';
import {redact} from '../../src/config/upstream-redactions.mjs';
const hash='a'.repeat(40), url=`https://github.com/example/project/commit/${hash}`;
test('release bullets keep changes and issue links without commit citations',()=>{
 const out=redact('CHANGELOG.md',`## 1.0\n* Fix a bug ([#12](https://github.com/example/project/issues/12)) ([aaaaaaa](${url}))`);
 assert.ok(out.includes('Fix a bug'));
 assert.ok(out.includes('/issues/12'));
 assert.ok(!out.includes('/commit/'));
 assert.ok(!out.includes('aaaaaaa'));
});
test('named commit links retain readable text, including relative links',()=>{
 assert.equal(redact('docs/upgrading.md',`See [the upgrade fix](${url}) and [another fix](../commit/${hash}).`),'See the upgrade fix and another fix.');
});
test('artifact pins and tagged release links remain intact',()=>{
 const text=`--revision ${hash}\n[release](https://github.com/example/project/releases/tag/v1.0)\nimage@sha256:${hash}`;
 assert.equal(redact('docs/running.md',text),text);
});
test('duplicate release bullets still collapse before citations are removed',()=>{
 const out=redact('CHANGELOG.md',`## 1.0\n* Fix ([aaaaaaa](${url}))\n* Fix with more detail ([#12](https://github.com/example/project/issues/12)) ([aaaaaaa](${url}))`);
 assert.equal(out.split('\n').filter(l=>l.startsWith('*')).length,1);
 assert.ok(out.includes('more detail'));
 assert.ok(!out.includes('/commit/'));
});
test('recipe source notes retain model and date without revision identifiers',async()=>{
 const {proofHtml}=await import('../../src/lib/use-cases.mjs');
 const out=proofHtml('issue-triage');
 assert.ok(out.includes('Gemma 4 31B'));
 assert.match(out,/2026-10-(14|15)/);
 assert.doesNotMatch(out,/\bat [a-f0-9]{7,40}\b/);
});
test('integration compatibility notes retain dates without source identifiers',async()=>{
 const {integrationsTable}=await import('../../src/lib/figures/use-from.mjs');
 const out=integrationsTable();assert.match(out,/2026-\d\d-\d\d/);assert.ok(out.includes('LangChain'));
 assert.doesNotMatch(out,/at <code>[a-f0-9]{7,40}<\/code>/);
});
test('upgrade notes describe preloading without inline revision commands',()=>{
 const out=redact('docs/upgrading.md',`Preload the student (\`hf download example/model weights --revision ${hash}\`).`);
 assert.equal(out,'Preload the student.');
});
