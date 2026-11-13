// Curation must retain the supported client surface and omit source-commit citations.
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {parse} from 'node-html-parser';
import {readUpstream} from '../../src/lib/upstream.mjs';
import {recipeIds,routeScript,teachBody} from '../../src/lib/use-cases.mjs';
const problems=[];
const html=readFileSync('dist/docs/api/index.html','utf8');
const api=parse(html).querySelector('main');
const text=api.text.replace(/\s+/g,' ').replace(/\{task_id\}/g,'{id}');
const spec=JSON.parse(readUpstream('docs/reference/openapi.json'));
let routes=0,fields=0;
for(const [path,ops] of Object.entries(spec.paths)){
 if(path==='/v1/answer')continue;
 for(const method of Object.keys(ops)){
  const route=`${method.toUpperCase()} ${path}`.replace(/\{task_id\}/g,'{id}');
  routes++;if(!text.includes(route))problems.push(`API lost ${route}`);
 }
}
const schemas=['Asset','ChoiceQuestion','NoulCriteria','NoulQuestion','ScoreQuestion','SystemOneRequest','ChoiceAnswer','NoulAnswer','ScoreAnswer','Usage','SystemOneResponse','ModelEntry','ModelList','TaskExample','CertifyBlock','FastTableBlock','TaskRegistration','CertifyRequest','RollbackRequest','TaskImport','AbstentionRegistration','TaskRecord'];
const codes=api.querySelectorAll('code').map(n=>n.text).join(' ');
for(const name of schemas)for(const field of Object.keys(spec.components.schemas[name].properties??{})){
 fields++;if(!new RegExp(`\\b${field}\\b`).test(codes))problems.push(`API lost ${name}.${field}`);
}
// These public extensions are documented in prose but are not named by the base OpenAPI request model.
for(const field of ['images','adapter','think','layout','over_limit','task','options','match','none_option'])if(!new RegExp(`\\b${field}\\b`).test(codes))problems.push(`API lost extension ${field}`);
if(/\/v1\/answer|conformance gates|served_check/.test(text))problems.push('API exposes verification internals');
const flags=parse(readFileSync('dist/docs/flags/index.html','utf8')).querySelector('main').text;
const cli=readUpstream('docs/cli.md');
const supported=cli.slice(cli.indexOf('## Every flag'),cli.indexOf('### Verification'));
for(const flag of new Set(supported.match(/--[a-z][a-z0-9-]*/g)??[]))if(!flags.includes(flag))problems.push(`flags lost ${flag}`);
if(flags.includes('--debug-readout'))problems.push('flags exposes verification-only readout');
function walk(dir){for(const f of readdirSync(dir,{withFileTypes:true})){const path=join(dir,f.name);if(f.isDirectory())walk(path);else if(f.name==='index.html'){
 const main=parse(readFileSync(path,'utf8')).querySelector('main');if(!main)continue;
 main.querySelectorAll('pre,script,style').forEach(x=>x.remove());
 if(/\b(?:revision|at) [a-f0-9]{7,40}\b/i.test(main.text))problems.push(`${path}: prose revision identifier`);
 for(const a of main.querySelectorAll('a[href]'))if(/\/commits?\/[a-f0-9]{7,40}\b/i.test(a.getAttribute('href')))problems.push(`${path}: commit citation`);
}}}
walk('dist/docs');
for(const id of recipeIds){
 for(const [suffix,source] of [['',routeScript(id)],['-register',teachBody(id)]]){
  const path=`dist/examples/recipes/${id}${suffix}.py`;
  if(readFileSync(path,'utf8')!==source+'\n')problems.push(`${path}: differs from the published code block`);
 }
}
if(problems.length){console.error(`reference: ${problems.length} problems\n  ${problems.join('\n  ')}`);process.exit(1);}
console.log(`reference: ${routes} supported routes, ${fields} schema-field placements, extensions, flags and 12 recipe downloads; no verification routes or commit links`);
