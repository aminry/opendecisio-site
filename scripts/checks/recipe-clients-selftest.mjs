import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { RECIPES, routeScript, teachBody } from '../../src/lib/use-cases.mjs';

const exec = promisify(execFile);
const reviews = { 'support-routing': 'to a person', gatekeeper: 'ask', 'issue-triage': 'to a maintainer', guardrails: 'to a moderator', 'rag-gate': 'to a larger model or a person', 'document-classification': 'to a person' };
const actions = { 'support-routing': 'send to billing', gatekeeper: 'ask', 'issue-triage': 'label bug', guardrails: 'allow', 'rag-gate': 'answer from the passage', 'document-classification': 'file as invoice' };

async function fixture(id, fn) {
    await mkdir('.browser/recipe-clients', {recursive:true});
    const dir = await mkdtemp(resolve('.browser/recipe-clients/case-'));
    const r = RECIPES[id];
    const question = {type:r.type,instructions:r.instructions,...(r.criteria?{criteria:r.criteria}:{})};
    let response = {status:200, body:{answers:{[r.key]:{type:r.type, ...(r.type==='noul'?{noul:0.1}:{choice:r.label}), certified:true, certificate_kind:'gold', certificate:'fixture-certificate'}}}};
    let seen;
    const server = createServer(async(req,res)=>{
        let raw='';for await(const c of req)raw+=c;
        seen={path:req.url, body:JSON.parse(raw), contentType:req.headers['content-type']};
        if(response.delay) await new Promise(r=>setTimeout(r,response.delay));
        res.writeHead(response.status,{'content-type':'application/json'});
        res.end(response.raw ?? JSON.stringify(response.body));
    });
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    const env={...process.env,DECISIO_BASE_URL:`http://127.0.0.1:${server.address().port}/`};
    await writeFile(join(dir,'client.py'),routeScript(id));
    const call=async()=> (await exec('python3',['-c','import runpy; n=runpy.run_path("client.py"); n["route"].__globals__["TIMEOUT"]=0.05; print(n["route"]("new input"))'],{cwd:dir,env,timeout:5000})).stdout.trim().split('\n').at(-1);
    try { await fn({r,question,dir,env,call,set:value=>{response=value},seen:()=>seen,answer:()=>response.body.answers[r.key]}); }
    finally {server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
}

for(const id of Object.keys(RECIPES)){
    test(`${id}: the caller uses its endpoint and exact question`,()=>fixture(id,async f=>{
        const result=await f.call();
        assert.ok(result);
        assert.equal(f.seen()?.path,'/v1/systemone');
        assert.equal(f.seen().contentType,'application/json');
        assert.deepEqual(f.seen().body,{state:'new input',questions:{[f.r.key]:f.question}});
        if(id!=='gatekeeper')assert.equal(result,actions[id]);
        else assert.equal(result,RECIPES.gatekeeper.pre.match(/"delete_in_workspace": "([^"]+)"/)[1]);
    }));
    test(`${id}: false or agreement certificates never act`,()=>fixture(id,async f=>{
        for(const change of [{certified:false},{certified:'true'},{certificate_kind:'agreement'},{certificate_kind:null},{certificate:null}]){
            Object.assign(f.answer(),{certified:true,certificate_kind:'gold',certificate:'fixture-certificate'},change);
            const result=await f.call();
            if(id!=='gatekeeper')assert.notEqual(result,actions[id]);
            else assert.equal(result,'ask');
        }
    }));
    test(`${id}: service and response failures return review`,()=>fixture(id,async f=>{
        for(const value of [{status:503,body:{detail:'unavailable'}},{status:422,body:{detail:'invalid'}},{status:200,raw:'broken JSON'},{status:200,body:{answers:{}}},{status:200,body:{answers:{[f.r.key]:null}}},{status:200,body:{answers:{[f.r.key]:{type:f.r.type,choice:'not-an-option',noul:2,certified:true,certificate_kind:'gold',certificate:'x'}}}},{status:200,delay:150,body:{}}]){
            f.set(value);assert.equal(await f.call(),reviews[id]);
        }
    }));
    test(`${id}: registration uses each real label and the caller question`,()=>fixture(id,async f=>{
        const rows=[{state:'A labelled input',answer:f.r.type==='noul'?false:f.r.label},{state:'Another input',answer:f.r.type==='noul'?true:f.r.label}];
        await writeFile(join(f.dir,`${id}-labels.jsonl`),rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
        await writeFile(join(f.dir,'register.py'),teachBody(id));
        f.set({status:200,body:{certificate:{threshold:null}}});
        await exec('python3',['register.py'],{cwd:f.dir,env:f.env,timeout:5000});
        assert.equal(f.seen().path,'/v1/tasks');
        assert.deepEqual(f.seen().body,{id,certify:{alpha:0.05},examples:rows.map(row=>({request:{state:row.state,questions:{[f.r.key]:f.question}},answer:row.answer}))});
    }));
}
