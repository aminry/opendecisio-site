// One external link, checked with retries for what is transient. A 5xx, a timeout or a dropped connection is tried
// again (3 tries, waiting 2 s and then 6 s); a 429 is a rate limit, tried the same way and, if it persists, a warning.
// Any other 4xx fails at once, with no retry: the link is wrong, not the network. HEAD first, then GET where a
// server refuses HEAD (403, 405).
//   import { checkExternal } from './external.mjs'
export const DELAYS_MS = [2000, 6000];
const HEADERS = { 'User-Agent': 'opendecisio-link-check' };

async function once(url, fetchFn, timeoutMs) {
	try {
		const get = () => fetchFn(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: HEADERS });
		let r = await fetchFn(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: HEADERS });
		if (r.status === 405 || r.status === 403) r = await get();
		return { status: r.status };
	} catch (e) {
		return { error: e.name === 'TimeoutError' ? 'timed out' : `failed (${e.cause?.code ?? e.cause?.errors?.[0]?.code ?? e.name})` };
	}
}

const describe = (o) => (o.status ? String(o.status) : o.error);
const transient = (o) => o.error !== undefined || o.status >= 500 || o.status === 429;

/**
 * Resolves to { ok, warning, tries: [...], message }: `tries` has what each attempt saw, so the caller can log a link
 * that needed a retry. `ok` is false only for a 4xx (other than 429) or for a link still failing after every try.
 */
export async function checkExternal(url, { fetchFn = fetch, delays = DELAYS_MS, timeoutMs = 15000 } = {}) {
	const tries = [];
	for (let attempt = 0; attempt <= delays.length; attempt++) {
		const o = await once(url, fetchFn, timeoutMs);
		tries.push(describe(o));
		if (o.status >= 200 && o.status < 300) return { ok: true, tries };
		if (!transient(o)) return { ok: false, tries, message: `${url} answered ${o.status}` };
		if (attempt < delays.length) await new Promise((r) => setTimeout(r, delays[attempt]));
	}
	const last = tries.at(-1);
	if (last === '429') return { ok: true, warning: `${url} rate-limited (429) on every try`, tries };
	return { ok: false, tries, message: `${url} ${/^\d+$/.test(last) ? `answered ${last}` : last} on all ${tries.length} tries (${tries.join(', ')})` };
}
