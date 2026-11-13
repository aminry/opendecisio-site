import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {siteBlock} from '../../src/lib/site-blocks.mjs';
const exec=promisify(execFile);
const example={request:{state:'An input',questions:{q:{type:'choice',instructions:'Which candidate?',criteria:{a:'First',b:'Second'}}}},answer:'a'};
for(const [name,file,extras] of [['context-register','task.json',{context:'A fixed policy'}],['dynamic-register','dynamic-task.json',{options:'dynamic',match:'instructions'}],['fast-table-register','task.json',{fast_table:true}]]){
 test(`${name}: sends complete labelled examples without changing the labels or target`,async()=>{
  await mkdir('.browser/task-registration',{recursive:true});const dir=await mkdtemp(resolve('.browser/task-registration/case-'));
  let seen;const server=createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;seen={path:req.url,body:JSON.parse(raw)};res.setHeader('content-type','application/json');res.end('{"certificate":{"threshold":null}}');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const body={id:'own-task',examples:[example],certify:{alpha:0.1}};
  try{
   await writeFile(join(dir,file),JSON.stringify(body));await writeFile(join(dir,'context.txt'),'A fixed policy');await writeFile(join(dir,'register.py'),siteBlock(name).text);
   await exec('python3',['register.py'],{cwd:dir,env:{...process.env,DECISIO_BASE_URL:`http://127.0.0.1:${server.address().port}`},timeout:5000});
   assert.deepEqual(seen,{path:'/v1/tasks',body:{...body,...extras}});
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
 });
}
test('traffic learning sends a complete question and no invented human labels',async()=>{
 await mkdir('.browser/task-registration',{recursive:true});const dir=await mkdtemp(resolve('.browser/task-registration/learn-'));
 let body;const server=createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;assert.equal(req.url,'/v1/tasks');body=JSON.parse(raw);res.setHeader('content-type','application/json');res.end('{"id":"support-queue-learn"}');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  await writeFile(join(dir,'learn.py'),siteBlock('fast-table-learn').text);
  await exec('python3',['learn.py'],{cwd:dir,env:{...process.env,DECISIO_BASE_URL:`http://127.0.0.1:${server.address().port}`},timeout:5000});
  assert.equal(body.fast_table.learn,true);assert.equal(body.certify.alpha,0.05);assert.equal(body.examples,undefined);
  assert.equal(body.question.type,'choice');assert.ok(body.question.instructions);assert.deepEqual(Object.keys(body.question.criteria),['billing','access','other']);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
