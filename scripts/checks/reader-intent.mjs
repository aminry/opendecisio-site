// A film with preload="none" must load nothing before the reader plays it. Shared by the interaction checks.
//
// Before the reader asks, the element must hold no media data, and no request for the film may be the element's own
// (type media, or ranged). WebKit's Linux media backend sends one untyped GET for a preload="none" source on its own,
// at a varying moment, while the element stays empty (CI, 2026-11-21: type other, no range, 0 bytes, networkState 1,
// readyState 0); WebKit on a Mac, Safari's engine, sends none. That probe alone is reported, not failed.
import assert from 'node:assert/strict';

/** Records each request for the film whose URL contains `file`, with what the engine sent, when and how much came back. */
export function watchFilm(page, file) {
	const requests = [];
	const seen = new Map();
	const started = Date.now();
	page.on('request', (r) => {
		if (!r.url().includes(file)) return;
		const e = { ms: Date.now() - started, method: r.method(), type: r.resourceType(), range: r.headers().range ?? null, frame: r.frame() === page.mainFrame() ? 'main' : 'other' };
		seen.set(r, e);
		requests.push(e);
	});
	page.on('requestfinished', async (r) => {
		const e = seen.get(r);
		if (e) e.bytes = (await r.sizes().catch(() => null))?.responseBodySize ?? null;
	});
	return requests;
}

/** Fails if the film loaded before reader intent; prints WebKit's lone probe of an empty element. */
export async function assertNotLoaded({ engine, requests, video, name, check }) {
	if (!requests.length) return;
	const state = await video.evaluate((v) => ({ networkState: v.networkState, readyState: v.readyState, currentSrc: v.currentSrc.split('/').pop() }));
	const probe = (r) => engine === 'webkit' && r.type !== 'media' && r.range === null && r.frame === 'main';
	const detail = JSON.stringify({ requests, state });
	if (state.readyState !== 0 || !requests.every(probe)) assert.fail(`${name} downloaded before reader intent (${engine}): ${detail}`);
	console.log(`${check}: webkit's media backend probed ${name.toLowerCase()} before reader intent and the element stayed empty: ${detail}`);
}
