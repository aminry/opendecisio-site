import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {teachFilmStory,teachCertifyFilm} from '../../src/lib/teach-certify-film.mjs';
import {inboxStory} from '../../src/lib/home-page.mjs';
import {data} from '../../src/lib/teach-certify.mjs';
test('film uses recorded task gains and whole-inbox counts at the chosen target',()=>{
 const story=teachFilmStory(),d=data(),learn=inboxStory().learn,target=d.inbox.targets['0.05'];
 assert.deepEqual(story.learning,learn);
 assert.equal(story.population.total,d.inbox.test_n);
 assert.equal(story.population.certified,target.covered);
 assert.equal(story.population.wrong,target.errors);
 assert.equal(story.population.review,story.population.total-story.population.certified);
 assert.equal(story.population.correct+story.population.wrong,story.population.certified);
 assert.equal(story.target,.05);assert.equal(story.confidence,1-d.delta);
 assert.equal(story.cases[0].eligible,true);assert.equal(story.cases[1].eligible,false);
 assert.equal(story.cases[0].id,'clear');assert.equal(story.cases[1].id,'borderline');
});
test('story covers teaching, separate certification, application routing and remaining mistakes in forty seconds',()=>{
 const story=teachFilmStory();assert.equal(story.duration,40);assert.equal(story.chapters.length,5);
 for(let i=0;i<5;i++){const c=story.chapters[i];assert.equal(c.start,i*8);assert.equal(c.end,(i+1)*8);assert.ok(c.text.split(' ').length<=25);}
 assert.match(story.chapters[1].text,/base model stays fixed/i);
 assert.match(story.chapters[2].text,/separate examples/i);
 assert.match(story.chapters[3].text,/review/i);
 assert.match(story.chapters[4].text,/still wrong/i);
});

test('published film matches its sources, streams before download completion and has ordered captions',()=>{
 teachCertifyFilm();
 const movie=readFileSync('public/media/teach-and-certify.mp4');assert.ok(movie.length<20*1024*1024,'Film exceeds the static-asset budget');
 const atoms=[];for(let offset=0;offset+8<movie.length;){const size=movie.readUInt32BE(offset);assert.ok(size>=8);atoms.push(movie.toString('ascii',offset+4,offset+8));offset+=size;}
 assert.ok(atoms.indexOf('moov')>=0&&atoms.indexOf('moov')<atoms.indexOf('mdat'),'Player must wait for the complete file before starting');
 const captions=readFileSync('public/media/teach-and-certify.vtt','utf8'),time=s=>{const [h,m,secs]=s.split(':').map(Number);return h*3600+m*60+secs;};
 assert.match(captions,/^WEBVTT/);
 const cues=[...captions.matchAll(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/g)].map(m=>({start:time(m[1]),end:time(m[2])}));
 assert.ok(cues.length>=10);let end=0;
 for(const cue of cues){assert.ok(cue.start>=end&&cue.end>cue.start&&cue.end<=40);end=cue.end;}
 for(const chapter of teachFilmStory().chapters)assert.ok(cues.some(c=>c.start>=chapter.start&&c.end<=chapter.end));
});
