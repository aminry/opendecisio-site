// Source notes built from the site's data, for ::source{name="..."} (src/lib/remark-upstream.mjs): the release, the card
// and the dates a number was measured on, read from its record rather than typed (docs/STYLE_GUIDE.md, "Numbers").
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteRoot } from './upstream.mjs';
import { setupLine } from './demos.mjs';

const tc = () => JSON.parse(readFileSync(join(siteRoot, 'src/data/teach-certify/teach_certify.json'), 'utf8'));
const span = (dates) => (dates.length > 1 ? `${dates[0]} to ${dates.at(-1)}` : dates[0]);

const NOTES = {
	// The teach-and-certify runs: BANKING77 and CLINC150 taught and certified on the 31B (and the 12B on a Mac).
	'teach-certify': () => {
		const d = tc();
		return `Measured on decisio ${d.decisio}, Gemma 4 31B on ${d.models.g31.machine.replace(/ \(.*\)$/, '')}, ${span(d.dates)}.`;
	},
	// decisio's demos (docs/demos/README.md at the pinned release): the triage demo's latencies.
	'triage-demo': () => {
		const s = setupLine();
		return `The intent head's cost: measured in decisio's triage demo on decisio ${s.version.replace(/^v/, '')}, one RTX PRO 6000, ${s.date}.`;
	},
};

export function sourceNote(name) {
	const note = NOTES[name];
	if (!note) throw new Error(`source-notes: no note "${name}"`);
	return note();
}
