// Keep the published route inventory and search-engine discovery in agreement.
import {fileURLToPath} from 'node:url';

export function discoveryProblems({origin,pages,urls,inventory,navigation,moved,robots,indexUrl}) {
 const problems=[];
 const unique=(values,label)=>{const seen=new Set();for(const value of values){if(seen.has(value))problems.push(`${label}: duplicate ${value}`);seen.add(value);}return seen;};
 const listed=unique(urls,'sitemap');
 const canonical=new Set();
 for(const page of pages){
  if(!page.canonical){problems.push(`${page.route}: missing canonical URL`);continue;}
  if(page.route==='/404/'||page.noindex)continue;
  const expected=new URL(page.route,origin).href;
  if(new URL(page.canonical).origin!==new URL(origin).origin){
   if(!page.route.startsWith('/articles/')||page.route==='/articles/')problems.push(`${page.route}: canonical points outside the published site`);
   continue; // Historical articles name their original publisher.
  }
  if(page.canonical!==expected)problems.push(`${page.route}: canonical is not its published route`);
  canonical.add(page.canonical);
 }
 for(const url of canonical)if(!listed.has(url))problems.push(`sitemap: missing ${url}`);
 for(const url of listed)if(!canonical.has(url))problems.push(`sitemap: unexpected ${url}`);
 const documented=unique(inventory,'page inventory'),nav=unique(navigation,'navigation');
 for(const route of nav)if(!documented.has(route))problems.push(`page inventory: missing ${route}`);
 for(const route of documented)if(!nav.has(route))problems.push(`page inventory: unexpected ${route}`);
 for(const route of nav)if(!listed.has(new URL(route,origin).href))problems.push(`guide is not in sitemap: ${route}`);
 for(const route of moved)if(listed.has(new URL(route,origin).href)||documented.has(route))problems.push(`moved route is still discoverable: ${route}`);
 const declarations=[...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gmi)].map(m=>m[1]);
 if(declarations.length!==1||declarations[0]!==indexUrl)problems.push('robots.txt: expected one canonical sitemap index');
 return problems;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const {readFileSync,readdirSync}=await import('node:fs');
 const {join,relative}=await import('node:path');
 const {parse}=await import('node-html-parser');
 const {docsGroups}=await import('../../src/config/docs-groups.mjs');
 const {redirects}=await import('../../src/config/redirects.mjs');
 const {site}=await import('../../src/config/site.ts');
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):e.name.endsWith('.html')?[join(dir,e.name)]:[]);
 const pages=walk('dist').map(file=>{
  const doc=parse(readFileSync(file,'utf8'));
  const route=file==='dist/404.html'?'/404/':'/'+relative('dist',file).replace(/index\.html$/,'');
  return {route,canonical:doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),noindex:/\bnoindex\b/i.test(doc.querySelector('meta[name="robots"]')?.getAttribute('content')??'')};
 });
 const locations=xml=>[...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m=>m[1]);
 const indexUrl=new URL('/sitemap-index.xml',site.url).href;
 const maps=locations(readFileSync('dist/sitemap-index.xml','utf8'));
 if(!maps.length)throw new Error('sitemap index is empty');
 const urls=maps.flatMap(url=>{
  const path=new URL(url);if(path.origin!==new URL(site.url).origin||path.search||path.hash||!/^\/sitemap-\d+\.xml$/.test(path.pathname))throw new Error('sitemap index names an unexpected file');
  return locations(readFileSync(join('dist',path.pathname),'utf8'));
 });
 const inventory=[...readFileSync('docs/SITEMAP.md','utf8').matchAll(/^\| `(\/docs(?:\/[^`]*)?\/)` \|/gm)].map(m=>m[1]);
 const navigation=docsGroups.flatMap(g=>g.items.map(i=>`/${i.slug}/`));
 const problems=discoveryProblems({origin:site.url,pages,urls,inventory,navigation,moved:redirects.map(r=>r.from),robots:readFileSync('dist/robots.txt','utf8'),indexUrl});
 if(problems.length){console.error(`discovery: ${problems.length} problems\n  ${problems.join('\n  ')}`);process.exit(1);}
 console.log(`discovery: ${urls.length} canonical pages and ${navigation.length} guides agree with sitemap, page inventory and robots.txt`);
}
