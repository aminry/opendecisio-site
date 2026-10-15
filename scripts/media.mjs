// Records each demo clip the site may serve (size, length, sha256) in
// src/data/media.json and writes its poster to public/posters/, from the
// pinned release's media. Needs ffmpeg and ffprobe; the bump workflow runs it,
// so a site build never does.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { servable } from '../src/config/media-policy.mjs';
import { pin, upstreamRoot } from '../src/lib/upstream.mjs';

const mediaDir = join(upstreamRoot, 'docs/demos/media');
const posters = 'public/posters';
mkdirSync(posters, { recursive: true });
// A clip whose bytes are unchanged keeps its poster, so a bump does not churn every image.
const before = existsSync('src/data/media.json') ? JSON.parse(readFileSync('src/data/media.json', 'utf8')).clips ?? {} : {};

const out = {};
for (const file of readdirSync(mediaDir).filter((f) => f.endsWith('.mp4') && servable(f)).sort()) {
	const name = file.replace(/\.mp4$/, '');
	const path = join(mediaDir, file);
	const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', path], { encoding: 'utf8' }));
	const { width, height } = probe.streams[0];
	const duration = Number(probe.format.duration);
	// A frame a quarter of the way in: past any title, before the closing scoreboard.
	const at = (duration * 0.25).toFixed(2);
	const sha256 = createHash('sha256').update(readFileSync(path)).digest('hex');
	if (before[name]?.sha256 === sha256 && existsSync(join(posters, `${name}.webp`))) {
		out[name] = before[name];
		continue;
	}
	const png = execFileSync('ffmpeg', ['-v', 'error', '-ss', at, '-i', path, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { maxBuffer: 64 * 1024 * 1024 });
	await sharp(png).webp({ quality: 78 }).toFile(join(posters, `${name}.webp`));
	out[name] = { width, height, duration: Number(duration.toFixed(2)), poster_at: Number(at), sha256 };
}
// Posters of clips a release no longer has go.
for (const f of readdirSync(posters)) if (!out[f.replace(/\.webp$/, '')]) unlinkSync(join(posters, f));
writeFileSync('src/data/media.json', JSON.stringify({ tag: pin.tag, clips: out }, null, '\t') + '\n');
console.log(`media: ${Object.keys(out).length} clips recorded, posters in ${posters}/`);
