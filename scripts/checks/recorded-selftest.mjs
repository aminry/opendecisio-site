// The recorded-output rule (scripts/checks/recorded-rule.mjs) on made-up pages: what passes and what fails.
//   node scripts/checks/recorded-selftest.mjs
import { judge } from './recorded-rule.mjs';

const rec = { name: 'a recording', version: '0.17.0', card: 'RTX PRO 6000', date: '2026-10-19', reviews: { 'v0.18.0': { changed: false, why: 'text route untouched' } } };
const page = (text) => [{ route: '/p/', text }];
const label = 'Recorded on Gemma 4 31B, decisio 0.17.0, one RTX PRO 6000 at 600 W, 2026-10-19; abridged.';
const cases = [
	['current minor, unlabelled', judge(rec, 'v0.17.3', page('no label')), 0],
	['older, full label, reviewed unchanged', judge(rec, 'v0.18.0', page(label)), 0],
	['older, unlabelled', judge(rec, 'v0.18.0', page('Recorded on Gemma 4 31B.')), 1],
	['older, release only', judge(rec, 'v0.18.0', page('Recorded on decisio 0.17.0.')), 1],
	['older, card and date apart from the release', judge(rec, 'v0.18.0', page('decisio 0.17.0. Elsewhere: RTX PRO 6000, 2026-10-19.')), 1],
	['older, another release in the label', judge(rec, 'v0.18.0', page('decisio 0.16.0, one RTX PRO 6000 at 600 W, 2026-10-19')), 1],
	['older, release not reviewed', judge({ ...rec, reviews: {} }, 'v0.18.0', page(label)), 1],
	['older, the release changed it', judge({ ...rec, reviews: { 'v0.18.0': { changed: true, why: 'new readout' } } }, 'v0.18.0', page(label)), 1],
	['a change in an earlier reviewed release still fails', judge({ ...rec, reviews: { 'v0.18.0': { changed: true, why: 'x' }, 'v0.19.0': { changed: false, why: 'y' } } }, 'v0.19.0', page(label)), 1],
	['a review written ahead of the pin is not used', judge({ ...rec, reviews: { 'v0.19.0': { changed: true, why: 'x' } } }, 'v0.18.0', page(label)), 1],
	['shown on no page, reviewed', judge(rec, 'v0.18.0', []), 0],
	['a review that asks the label for more, given', judge({ ...rec, reviews: { 'v0.18.0': { changed: false, why: 'x', label: 'plain layout' } } }, 'v0.18.0', page(`${label.replace('; abridged.', ', on the plain layout; abridged.')}`)), 0],
	['a review that asks the label for more, missing', judge({ ...rec, reviews: { 'v0.18.0': { changed: false, why: 'x', label: 'plain layout' } } }, 'v0.18.0', page(label)), 1],
	['the addition far from the label does not count', judge({ ...rec, reviews: { 'v0.18.0': { changed: false, why: 'x', label: 'plain layout' } } }, 'v0.18.0', page(`${label}${' filler'.repeat(40)} plain layout`)), 1],
	['an earlier review\'s addition still holds', judge({ ...rec, reviews: { 'v0.18.0': { changed: false, why: 'x', label: 'plain layout' }, 'v0.19.0': { changed: false, why: 'y' } } }, 'v0.19.0', page(label)), 1],
];
let bad = 0;
for (const [what, r, want] of cases) {
	const ok = r.problems.length === want;
	if (!ok) bad += 1;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}: ${r.problems.length} problems${r.problems.length ? ` (${r.problems[0]})` : ''}`);
}
if (bad) { console.error(`recorded-selftest: ${bad} of ${cases.length} cases wrong`); process.exit(1); }
console.log(`recorded-selftest: ${cases.length} cases as expected`);
