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

// Execute the published programs so missing context, changed labels, wrong task selection
// and duplicated policy text fail at their HTTP boundary.
for (const type of ['choice', 'noul']) {
 test(`decision fast path ${type}: registers context once and asks with changing state only`, async () => {
  await mkdir('.browser/task-registration', {recursive:true});
  const dir = await mkdtemp(resolve('.browser/task-registration/fast-path-'));
  const question = type === 'choice'
   ? {type:'choice', instructions:'Which team?', criteria:{billing:'Billing', access:'Access'}}
   : {type:'noul', instructions:'Is this return eligible under the policy?'};
  const questions = {own_question_key:question};
  const original = {id:'own-policy-task', layout:'plain', examples:[{request:{state:{days:12}, questions}, answer:type === 'choice' ? 'billing' : true}], certify:{alpha:0.1, delta:0.2}};
  const state = {days:45, opened:true};
  const seen = [];
  const server = createServer(async (req,res) => {
   let raw='';for await(const c of req)raw+=c;
   seen.push({path:req.url,body:JSON.parse(raw)});
   res.setHeader('content-type','application/json');
   res.end(JSON.stringify(req.url === '/v1/tasks' ? {id:original.id,fast_table_report:{kept:false}} : {answers:{own_question_key:{type,certified:false,answered_by:'decisio'}}}));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {
   await writeFile(join(dir,'task.json'),JSON.stringify(original));
   await writeFile(join(dir,'context.txt'),'A fixed refund policy');
   await writeFile(join(dir,'state.json'),JSON.stringify(state));
   for(const name of ['fast-path-register','fast-path-ask']) {
    await writeFile(join(dir,'program.py'),siteBlock(name).text);
    await exec('python3',['program.py'],{cwd:dir,env:{...process.env,DECISIO_BASE_URL:`http://127.0.0.1:${server.address().port}`},timeout:5000});
   }
   assert.deepEqual(seen,[
    {path:'/v1/tasks',body:{...original,context:'A fixed refund policy',fast_table:true}},
    {path:'/v1/systemone',body:{state,task:original.id,questions,layout:original.layout}},
   ]);
  } finally {server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
 });
}
test('decision fast path programs surface server rejection instead of printing success',async()=>{
 await mkdir('.browser/task-registration',{recursive:true});const dir=await mkdtemp(resolve('.browser/task-registration/rejected-fast-path-'));
 const server=createServer((_req,res)=>{res.statusCode=422;res.end('invalid task');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  await writeFile(join(dir,'task.json'),JSON.stringify({id:'reject',examples:[example]}));
  await writeFile(join(dir,'context.txt'),'A policy');await writeFile(join(dir,'state.json'),'"New facts"');
  for(const name of ['fast-path-register','fast-path-ask']) {
   await writeFile(join(dir,'program.py'),siteBlock(name).text);
   await assert.rejects(exec('python3',['program.py'],{cwd:dir,env:{...process.env,DECISIO_BASE_URL:`http://127.0.0.1:${server.address().port}`},timeout:5000}),e=>e.code!==0&&/422/.test(e.stderr));
  }
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
test('decision fast path learning: the same programs preserve learning settings and ask its complete question',async()=>{
 await mkdir('.browser/task-registration',{recursive:true});const dir=await mkdtemp(resolve('.browser/task-registration/learning-fast-path-'));
 const task={id:'refund-policy-learn',question:{type:'noul',instructions:'Is this return eligible under the policy?'},fast_table:{learn:true,kind:'auto'},certify:{alpha:0.1}};
 const seen=[];const server=createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;seen.push({path:req.url,body:JSON.parse(raw)});res.setHeader('content-type','application/json');res.end('{}');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  await writeFile(join(dir,'task.json'),JSON.stringify(task));await writeFile(join(dir,'context.txt'),'A fixed policy');await writeFile(join(dir,'state.json'),'{"days":12}');
  for(const name of ['fast-path-register','fast-path-ask']) {
   await writeFile(join(dir,'program.py'),siteBlock(name).text);
   await exec('python3',['program.py'],{cwd:dir,env:{...process.env,DECISIO_BASE_URL:`http://127.0.0.1:${server.address().port}`},timeout:5000});
  }
  assert.deepEqual(seen,[{path:'/v1/tasks',body:{...task,context:'A fixed policy'}},{path:'/v1/systemone',body:{state:{days:12},task:task.id,questions:{decision:task.question}}}]);
  assert.equal(seen[0].body.examples,undefined,'Invented labels were added to learning mode');
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
