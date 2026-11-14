// The film and interactive walkthrough share their immutable task recording.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import script from '../data/teach-certify-film-script.json' with {type:'json'};
import cases from '../data/teach-certify/walkthrough.json' with {type:'json'};
import {data} from './teach-certify.mjs';
import {inboxStory} from './home-page.mjs';
import {makeWalkthrough,selectResult} from './certified-walkthrough.mjs';
import {esc} from './figures/core.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function teachFilmStory(){
 const d=data(),inbox=inboxStory(),record=makeWalkthrough(d.inbox,cases,d.decisio),result=selectResult(record,'0.05','clear');
 return {title:script.title,duration:script.duration,learning:inbox.learn,source:inbox.source,release:d.decisio,date:d.dates[0],target:.05,confidence:1-d.delta,heldExamples:record.heldN,
  population:{total:record.testN,certified:result.covered,review:result.review,wrong:result.errors,correct:result.covered-result.errors},
  cases:['clear','borderline'].map(id=>{const r=selectResult(record,'0.05',id);return {...r.example,eligible:r.eligible};}),
  chapters:script.chapters.map((c,i)=>({...c,start:i*8,end:(i+1)*8}))};
}
export function teachCertifyFilm(){
 const story=teachFilmStory(),film=JSON.parse(readFileSync('src/data/teach-certify-film.json','utf8'));
 if(hash(JSON.stringify(story))!==film.storySha256||film.duration!==story.duration)throw Error('Teach & Certify film story changed; render it again');
 for(const asset of Object.values(film.assets))if(hash(readFileSync(`public${asset.path}`))!==asset.sha256)throw Error('Teach & Certify film asset changed; render it again');
 const asset=kind=>`${film.assets[kind].path}?v=${film.assets[kind].sha256.slice(0,12)}`;
 return `<figure class="ca-film" data-teach-film aria-label="${film.duration}-second narrated Teach and Certify walkthrough">
  <video controls playsinline preload="none" width="${film.width}" height="${film.height}" poster="${asset('webp')}" aria-label="Teach and Certify walkthrough" aria-describedby="teach-film-note">
   <source src="${asset('mp4')}" type="video/mp4"/><track kind="captions" src="${asset('vtt')}" srclang="en" label="English" default/>
   <p><a href="${asset('mp4')}">Watch the Teach and Certify walkthrough</a>.</p>
  </video>
  <figcaption id="teach-film-note"><p>${film.duration}-second overview · narration and original music · <a href="${asset('mp4')}">Download video</a> · <a href="/demos/teach-and-certify/#method">Dataset credits</a>.</p><p class="src-note">Recorded results: ${esc(story.source)}; 5% error target, 90% confidence. Learning motion is schematic. A certified prediction can still be wrong.</p></figcaption>
 </figure>`;
}
