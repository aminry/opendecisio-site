import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoveryProblems} from './discovery.mjs';

const fixture=()=>({
 origin:'https://example.com',
 pages:[{route:'/',canonical:'https://example.com/'},{route:'/docs/',canonical:'https://example.com/docs/'},{route:'/404/',canonical:'https://example.com/404/'},{route:'/articles/original/',canonical:'https://publisher.example/original/'}],
 urls:['https://example.com/','https://example.com/docs/'],
 inventory:['/docs/'],navigation:['/docs/'],moved:['/docs/old/'],
 robots:'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap-index.xml\n',indexUrl:'https://example.com/sitemap-index.xml',
});
test('the canonical inventory excludes the error page and an original publisher',()=>{
 assert.deepEqual(discoveryProblems(fixture()),[]);
});
test('a guide missing from the sitemap is detected',()=>{
 const data=fixture();data.urls.pop();
 assert.ok(discoveryProblems(data).some(p=>p.includes('missing https://example.com/docs/')));
});
test('a moved or duplicate sitemap entry is detected',()=>{
 const data=fixture();data.urls.push('https://example.com/docs/old/','https://example.com/docs/');
 const problems=discoveryProblems(data);
 assert.ok(problems.some(p=>p.includes('unexpected https://example.com/docs/old/')));
 assert.ok(problems.some(p=>p.includes('duplicate https://example.com/docs/')));
 assert.ok(problems.some(p=>p.includes('moved route')));
});
test('the written page inventory must match navigation in both directions',()=>{
 const data=fixture();data.inventory=['/docs/old/'];
 const problems=discoveryProblems(data);
 assert.ok(problems.some(p=>p.includes('page inventory: missing /docs/')));
 assert.ok(problems.some(p=>p.includes('page inventory: unexpected /docs/old/')));
});
test('a guide cannot canonicalize to a different local route',()=>{
 for(const canonical of ['https://example.com/','http://example.com/docs/','https://preview.example/docs/']){
  const data=fixture();data.pages[1].canonical=canonical;
  assert.ok(discoveryProblems(data).some(p=>p.includes('canonical')));
 }
});
test('robots must point once at the canonical sitemap index',()=>{
 for(const robots of ['Sitemap: https://preview.example/sitemap.xml\n','',fixture().robots+fixture().robots]){
  assert.ok(discoveryProblems({...fixture(),robots}).some(p=>p.includes('robots.txt')));
 }
});
test('a noindex route cannot be listed for discovery',()=>{
 const data=fixture();data.pages[1].noindex=true;
 assert.ok(discoveryProblems(data).some(p=>p.includes('unexpected https://example.com/docs/')));
});
