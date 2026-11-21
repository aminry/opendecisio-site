import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkHtml} from '../../src/lib/checks.mjs';
test('package command evidence shows no release, date or machine under the block',()=>{
 const html=checkHtml({status:'skills',version:'0.1.0',date:'2026-11-13'});
 assert.equal(html,'');
});
const {packageProblems,evidenceProblems,skillsPackage}=await import('../../src/lib/skills-package.mjs');
test('a package is accepted while its floor is at or below the site release pin',()=>{
 const target=`v${skillsPackage.minDecisio}`;
 assert.deepEqual(packageProblems(skillsPackage,target),[]);
 assert.deepEqual(packageProblems(skillsPackage,'v99.0.0'),[]);
 assert.ok(packageProblems(skillsPackage,'v0.0.1').some(x=>x.includes('later decisio')));
 assert.ok(packageProblems({...skillsPackage,minDecisio:'latest'},target).some(x=>x.includes('floor')));
 for(const change of [{sha256:'bad'},{version:'1; echo bad'},{archive:'other.zip'},{repository:'other/repo'},{skills:[]}])assert.ok(packageProblems({...skillsPackage,...change},target).length);
});
test('changed package bytes or published commands invalidate their evidence',()=>{
 const entry={status:'skills',version:skillsPackage.version,sha256:skillsPackage.sha256};
 const record={version:skillsPackage.version,sha256:skillsPackage.sha256,blocks:{a:entry}};
 assert.deepEqual(evidenceProblems(record,[{hash:'a'}]),[]);
 assert.ok(evidenceProblems(record,[{hash:'changed'}]).length);
 assert.ok(evidenceProblems({...record,sha256:'0'.repeat(64)},[{hash:'a'}]).length);
 assert.ok(evidenceProblems({...record,blocks:{a:{...entry,sha256:'0'.repeat(64)}}},[{hash:'a'}]).length);
});
