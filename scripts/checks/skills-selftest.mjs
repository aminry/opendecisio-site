import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkHtml} from '../../src/lib/checks.mjs';
test('package command evidence identifies the package without claiming model inference',()=>{
 const html=checkHtml({status:'skills',version:'0.1.0',date:'2026-11-13'});
 assert.ok(html.includes('0.1.0'));assert.ok(html.includes('2026-11-13'));assert.ok(!html.includes('CPU stand-in'));assert.ok(!html.includes('model answered'));
});
const {packageProblems,evidenceProblems,skillsPackage}=await import('../../src/lib/skills-package.mjs');
test('package compatibility follows the site release pin',()=>{
 assert.deepEqual(packageProblems(skillsPackage,'v0.46.0'),[]);
 assert.ok(packageProblems(skillsPackage,'v0.47.0').some(x=>x.includes('do not match')));
 for(const change of [{sha256:'bad'},{version:'1; echo bad'},{archive:'other.zip'},{repository:'other/repo'},{skills:[]}])assert.ok(packageProblems({...skillsPackage,...change},'v0.46.0').length);
});
test('changed package bytes or published commands invalidate their evidence',()=>{
 const entry={status:'skills',version:skillsPackage.version,sha256:skillsPackage.sha256};
 const record={version:skillsPackage.version,sha256:skillsPackage.sha256,blocks:{a:entry}};
 assert.deepEqual(evidenceProblems(record,[{hash:'a'}]),[]);
 assert.ok(evidenceProblems(record,[{hash:'changed'}]).length);
 assert.ok(evidenceProblems({...record,sha256:'0'.repeat(64)},[{hash:'a'}]).length);
 assert.ok(evidenceProblems({...record,blocks:{a:{...entry,sha256:'0'.repeat(64)}}},[{hash:'a'}]).length);
});
