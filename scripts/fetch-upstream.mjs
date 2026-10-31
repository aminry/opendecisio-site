// Fetches the decisio repository at the commit pinned in upstream.json into
// .upstream/<commit>/, after checking that the pinned tag still points at that
// commit. Media under docs/demos/media is copied to public/media/upstream/ so
// the site serves the clips of exactly that release.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import * as tar from 'tar';
import { servable } from '../src/config/media-policy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pinned = JSON.parse(readFileSync(join(root, 'upstream.json'), 'utf8'));
const preview = process.env.UPSTREAM_PREVIEW;
if (preview && process.env.CI) {
	console.error('fetch-upstream: UPSTREAM_PREVIEW is for local previews; CI builds only the pinned release');
	process.exit(1);
}
const pin = preview ? { ...pinned, tag: `preview-${preview.slice(0, 7)}`, commit: preview } : pinned;
const dest = join(root, '.upstream', pin.commit);
const marker = join(dest, '.complete');

// Paths the site reads; everything else in the archive is skipped.
const KEEP = [
	/^[^/]+\.md$/, /^docs\//, /^examples\/tasks\//, /^deploy\//, /^runs\/[^/]+\/(manifest\.json|summary\.md|summary\.json|README\.md)$/,
	// The think budget's range, which decisio states in its code only (the site's Think when unsure page cites it).
	/^src\/decisio\/serve\/think\.py$/,
	// The certified-answers run behind the home page's teaching section: its README and the Mac run's certificate and answers.
	/^runs\/2026-10-14_certified-answers\/(README\.md|results\/mac_mlx\/first_start_(answers|sample_answers|task_response)\.json)$/,
];
// A cache made with another list of paths is fetched again, so a path added here is never missing from a cached release.
const keepSig = createHash('sha256').update(KEEP.map(String).join('\n')).digest('hex').slice(0, 12);
const markerText = () => `${pin.tag} ${pin.commit} keep:${keepSig}\n`;
const cached = () => existsSync(marker) && readFileSync(marker, 'utf8') === markerText();

function fail(message) {
	console.error(`fetch-upstream: ${message}`);
	process.exit(1);
}

function tagCommit() {
	const out = execFileSync('git', ['ls-remote', `https://github.com/${pin.repository}`, `refs/tags/${pin.tag}`, `refs/tags/${pin.tag}^{}`], { encoding: 'utf8' });
	const lines = out.trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
	// An annotated tag lists its peeled commit as <tag>^{}; a lightweight tag lists the commit itself.
	const peeled = lines.find(([, ref]) => ref.endsWith('^{}')) ?? lines[0];
	return peeled?.[0];
}

async function download() {
	const url = `https://codeload.github.com/${pin.repository}/tar.gz/${pin.commit}`;
	const response = await fetch(url);
	if (!response.ok) fail(`${url} answered ${response.status}`);
	rmSync(dest, { recursive: true, force: true });
	mkdirSync(dest, { recursive: true });
	await pipeline(
		Readable.fromWeb(response.body),
		tar.x({
			cwd: dest,
			strip: 1,
			filter: (path) => KEEP.some((re) => re.test(path.split('/').slice(1).join('/'))),
		}),
	);
}

if (!/^[0-9a-f]{40}$/.test(pin.commit)) fail('upstream.json: commit must be a full 40-character sha');
// The release's container image by digest (the Docker guide shows it); the bump workflow reads it from the release notes.
if (!/^ghcr\.io\/aminry\/decisio@sha256:[0-9a-f]{64}$/.test(pinned.image ?? '')) fail('upstream.json: image must be the release image by digest, ghcr.io/aminry/decisio@sha256:<64 hex>');

if (preview) {
	console.warn(`fetch-upstream: previewing unreleased decisio commit ${preview.slice(0, 7)}; not for publishing`);
	if (!cached()) {
		await download();
		writeFileSync(marker, markerText());
	}
} else if (process.env.UPSTREAM_OFFLINE === '1' && cached()) {
	console.log(`fetch-upstream: offline, using the cached ${pin.tag}`);
} else {
	const resolved = tagCommit();
	if (!resolved) fail(`tag ${pin.tag} does not exist in ${pin.repository}`);
	if (resolved !== pin.commit) fail(`tag ${pin.tag} points at ${resolved}, but upstream.json pins ${pin.commit}`);
	// With a token (CI), the image must be the one the release notes give; the deploy's build has no token, and the
	// unauthenticated API's rate limit must not fail a deploy, so it trusts the pin CI checked.
	if (process.env.GH_TOKEN) {
		const release = await fetch(`https://api.github.com/repos/${pin.repository}/releases/tags/${pin.tag}`, { headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` } });
		if (!release.ok) fail(`could not read the release notes of ${pin.tag}: ${release.status}`);
		if (!(await release.json()).body?.includes(pinned.image)) fail(`the release notes of ${pin.tag} do not give the image upstream.json pins (${pinned.image})`);
	}
	if (!cached()) {
		await download();
		writeFileSync(marker, markerText());
		console.log(`fetch-upstream: ${pin.repository} ${pin.tag} (${pin.commit.slice(0, 7)}) fetched`);
	} else {
		console.log(`fetch-upstream: ${pin.tag} (${pin.commit.slice(0, 7)}) already cached`);
	}
}

// Serve the release's media from the site itself.
const media = join(dest, 'docs/demos/media');
const publicMedia = join(root, 'public/media/upstream');
rmSync(publicMedia, { recursive: true, force: true });
if (existsSync(media)) {
	mkdirSync(publicMedia, { recursive: true });
	// Only the clips the site may show are served; the hosted players' stay on GitHub.
	cpSync(media, publicMedia, { recursive: true, filter: (src) => src === media || servable(src.split('/').pop()) });
}
// The clips must be the ones src/data/media.json and the posters were made from.
const recorded = JSON.parse(readFileSync(join(root, 'src/data/media.json'), 'utf8'));
if (existsSync(media)) {
	const stale = [];
	for (const file of readdirSync(media).filter((f) => f.endsWith('.mp4') && servable(f))) {
		const name = file.replace(/\.mp4$/, '');
		const sha = createHash('sha256').update(readFileSync(join(media, file))).digest('hex');
		if (recorded.clips[name]?.sha256 !== sha) stale.push(name);
	}
	const gone = Object.keys(recorded.clips).filter((name) => !existsSync(join(media, `${name}.mp4`)));
	if (stale.length || gone.length) fail(`the clips at ${pin.tag} differ from src/data/media.json (${[...stale, ...gone].join(', ')}); run npm run media`);
}
// decisio's social preview image, once a release carries it.
const social = join(dest, 'docs/media/social-preview.png');
rmSync(join(root, 'public/social-preview.png'), { force: true });
if (existsSync(social)) cpSync(social, join(root, 'public/social-preview.png'));
else console.warn('fetch-upstream: this release has no docs/media/social-preview.png; pages carry no og:image');
const digest = createHash('sha256').update(readFileSync(join(dest, 'README.md'))).digest('hex').slice(0, 12);
console.log(`fetch-upstream: README.md sha256 ${digest}`);
