// The project's demo reel: shown under the hero once
// src/data/launch/reel.json names it. The file must be the one named there: its sha256 is
// checked at build, so a re-exported reel cannot go out unrecorded.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteRoot } from './upstream.mjs';

export function reel() {
	const meta = join(siteRoot, 'src/data/launch/reel.json');
	if (!existsSync(meta)) return undefined;
	const r = JSON.parse(readFileSync(meta, 'utf8'));
	for (const key of ['video', 'poster', 'sha256', 'width', 'height', 'source']) {
		if (!r[key]) throw new Error(`reel: src/data/launch/reel.json has no ${key}`);
	}
	const path = join(siteRoot, 'public', r.video);
	if (!existsSync(path)) throw new Error(`reel: ${r.video} is named in reel.json but is not in public/`);
	if (!existsSync(join(siteRoot, 'public', r.poster))) throw new Error(`reel: ${r.poster} is named in reel.json but is not in public/`);
	const sha = createHash('sha256').update(readFileSync(path)).digest('hex');
	if (sha !== r.sha256) throw new Error(`reel: ${r.video} has sha256 ${sha.slice(0, 12)}, not the ${r.sha256.slice(0, 12)} in reel.json; record the new export`);
	return r;
}
