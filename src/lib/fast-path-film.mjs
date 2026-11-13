// Verify the exported film, captions and poster before including them in a build.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import film from '../data/fast-path-film.json' with {type:'json'};
export function fastPathFilm() {
  const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
  for (const asset of Object.values(film.assets)) {
    if (hash(`public${asset.path}`) !== asset.sha256) throw new Error('Fast-path film asset changed; render it again');
  }
  if (hash('src/data/fast-path-timing.json') !== film.timingSha256) throw new Error('Fast-path film timings changed; render it again');
  if (film.examplesSha256 && hash('src/data/fast-path-examples.json') !== film.examplesSha256) throw new Error('Fast-path film examples changed; render it again');
  const asset = kind => `${film.assets[kind].path}?v=${film.assets[kind].sha256.slice(0,12)}`;
  return `<figure class="fp-film" aria-label="${film.duration}-second narrated decision fast path walkthrough">
    <video controls playsinline preload="none" width="${film.width}" height="${film.height}" poster="${asset('webp')}" aria-label="Decision fast path walkthrough" aria-describedby="fp-film-note">
      <source src="${asset('mp4')}" type="video/mp4"/>
      <track kind="captions" src="${asset('vtt')}" srclang="en" label="English"/>
      <p><a href="${asset('mp4')}">Watch the decision fast path walkthrough</a>.</p>
    </video>
    <figcaption id="fp-film-note">${film.duration}-second overview · narration and original music · <a href="${asset('mp4')}">Download video</a>. Illustrative requests and time budgets.</figcaption>
  </figure>`;
}
