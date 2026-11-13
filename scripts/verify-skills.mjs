// Execute the published project commands against the pinned skills archive.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectBlocks} from '../src/lib/blocks.mjs';
import {blockHash} from '../src/lib/checks.mjs';
import {skillsPackage as meta,skillsBlock,evidenceProblems} from '../src/lib/skills-package.mjs';

const names=['skills-download','skills-codex','skills-claude','skills-select','skills-update','skills-uninstall-codex','skills-uninstall-claude'];
const published=collectBlocks().filter(b=>b.page==='/docs/ai-skills/');
const blocks=names.map(name=>{
 const hash=blockHash(skillsBlock(name).text);
 const block=published.find(b=>b.hash===hash);assert.ok(block,`guide lost ${name}`);return {...block,name};
});
mkdirSync('.browser/skills-verification',{recursive:true});
const work=mkdtempSync(resolve('.browser/skills-verification/run-'));
const project=join(work,'application with spaces'),cache=join(work,'tools with spaces');
mkdirSync(project);mkdirSync(cache);
const records={};const date=new Date().toISOString().slice(0,10);
function run(name,target=project){
 const block=blocks.find(b=>b.name===name);const file=join(work,name+'.sh');
 writeFileSync(file,block.text+'\n');
 execFileSync('bash',['-e',file],{cwd:target,env:{...process.env,DECISIO_PROJECT:target,DECISIO_SKILLS:cache},encoding:'utf8',timeout:120000,stdio:['ignore','pipe','pipe']});
 records[block.hash]={status:'skills',version:meta.version,sha256:meta.sha256,date};
 console.log(`skills: ran ${name}`);
}
run('skills-download');
const root=join(cache,`decisio-skills-${meta.version}`);
const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
assert.equal(manifest.version,meta.version);assert.equal(manifest.decisioVersion,meta.decisioVersion);assert.deepEqual(manifest.skills,meta.skills);
const digest=data=>createHash('sha256').update(data).digest('hex');
const walk=(dir,base=dir)=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
 const path=join(dir,e.name);assert.ok(!lstatSync(path).isSymbolicLink(),'archive contains a symlink');
 return e.isDirectory()?walk(path,base):[path.slice(base.length+1).split('\\').join('/')];
});
assert.deepEqual(walk(root).sort(),[...Object.keys(manifest.files),'manifest.json'].sort());
for(const [file,sha] of Object.entries(manifest.files)){
 assert.ok(file.split('/').every(x=>x&&x!=='.'&&x!=='..')&&!file.includes('\\'),'invalid archive path');
 assert.equal(digest(readFileSync(join(root,file))),sha,`archive changed ${file}`);
}
function installed(host,target=project,selected=meta.skills){
 const discovery=host==='codex'?'.agents/skills':'.claude/skills';
 for(const name of meta.skills){
  const dest=join(target,discovery,name);
  if(!selected.includes(name)){assert.ok(!existsSync(dest));continue;}
  const marker=JSON.parse(readFileSync(join(dest,'.decisio-skill.json'),'utf8'));assert.equal(marker.version,meta.version);
  for(const [file,sha] of Object.entries(marker.files))assert.equal(digest(readFileSync(join(dest,file))),sha);
  assert.ok(existsSync(join(dest,'SKILL.md')));
 }
}
run('skills-codex');installed('codex');assert.ok(!existsSync(join(project,'.claude')));
run('skills-claude');installed('claude');installed('codex');
const single=join(work,'one skill project');mkdirSync(single);run('skills-select',single);installed('codex',single,['decisio-request']);
const note=join(project,'.agents/skills/decisio-request/notes.md');writeFileSync(note,'My notes\n');
const other=join(project,'.agents/skills/another-workflow/SKILL.md');mkdirSync(join(other,'..'),{recursive:true});writeFileSync(other,'Other workflow\n');
run('skills-update');installed('codex');assert.equal(readFileSync(note,'utf8'),'My notes\n');
run('skills-uninstall-codex');assert.ok(!existsSync(join(project,'.agents/skills/decisio-setup/SKILL.md')));assert.equal(readFileSync(note,'utf8'),'My notes\n');assert.ok(existsSync(other));installed('claude');
run('skills-uninstall-claude');assert.ok(!existsSync(join(project,'.claude/skills/decisio-request/SKILL.md')));
// Exercise personal scope through the installer's explicit home parameter.
const {installSkills}=await import(pathToFileURL(join(root,'scripts/install.mjs')));
for(const host of ['codex','claude']){
 const home=join(work,host+' fixture home');mkdirSync(home);
 installSkills({host,home,scope:'user'});
 const dir=host==='codex'?'.agents/skills':'.claude/skills';assert.ok(existsSync(join(home,dir,'decisio-setup/SKILL.md')));
 installSkills({host,home,scope:'user',action:'uninstall'});assert.ok(!existsSync(join(home,dir,'decisio-setup/SKILL.md')));
}
const temp=join(work,'test temporary files');mkdirSync(temp);
const testFiles=readdirSync(join(root,'test')).filter(n=>n.endsWith('.test.mjs')).map(n=>'test/'+n);
const result=execFileSync(process.execPath,['--test','--test-reporter=tap',...testFiles],{cwd:root,env:{...process.env,TMPDIR:temp},encoding:'utf8'});
assert.match(result,/# pass 28\b/);execFileSync(process.execPath,['scripts/check.mjs'],{cwd:root,encoding:'utf8'});
const record={version:meta.version,decisioVersion:meta.decisioVersion,sha256:meta.sha256,date,blocks:records};
if(process.argv.includes('--write'))writeFileSync('verification/skills.json',JSON.stringify(record,null,'\t')+'\n');
else {const problems=evidenceProblems(JSON.parse(readFileSync('verification/skills.json','utf8')),blocks);assert.deepEqual(problems,[]);}
console.log(`skills: public archive, ${Object.keys(manifest.files).length} manifest files, seven published commands, both host layouts and 28 bundled tests pass`);
