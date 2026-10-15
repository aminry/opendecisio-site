// The decisio release the site is built from, as pinned in upstream.json.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Builds run from the repository root; page modules are bundled, so their own
// location says nothing about where the repository is.
export const siteRoot = process.cwd();
if (!existsSync(join(siteRoot, 'upstream.json'))) throw new Error(`upstream: run from the repository root (no upstream.json in ${siteRoot})`);
const pinned = JSON.parse(readFileSync(join(siteRoot, 'upstream.json'), 'utf8'));
// UPSTREAM_PREVIEW=<commit> builds locally from an unreleased decisio commit, to
// see a coming release before it is tagged; CI refuses it (scripts/fetch-upstream.mjs).
const preview = process.env.UPSTREAM_PREVIEW;
export const pin = preview ? { ...pinned, tag: `preview-${preview.slice(0, 7)}`, commit: preview } : pinned;
export const upstreamRoot = join(siteRoot, '.upstream', pin.commit);

/** The absolute path of a decisio file at the pinned commit. */
export function upstreamPath(file) {
	const path = join(upstreamRoot, file);
	if (!existsSync(path)) throw new Error(`upstream: ${file} does not exist at ${pin.tag}; run npm run fetch-upstream`);
	return path;
}

export function upstreamHas(file) {
	return existsSync(join(upstreamRoot, file));
}

export function readUpstream(file) {
	return readFileSync(upstreamPath(file), 'utf8');
}
