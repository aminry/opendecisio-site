// Outputs the site shows as recorded from a decisio server, with the release that recorded them (docs/STYLE_GUIDE.md,
// "Numbers"; Amin, 2026-10-18). scripts/checks/recorded.mjs finds every page that shows one (by its marker text) and fails
// a page showing an output older than the pinned minor release unless the page says which release recorded it.
// All three were recorded again on decisio 0.17.0 (src/lib/recorded.mjs), so the earlier recordings are retired: their
// marks must appear on no page.
import { certificate, session } from '../lib/recorded.mjs';
import { recordedResponse } from '../lib/figures/core.mjs';

// The first recorded decision's routing answer as pages print it (three places): with its text, it marks a page that shows
// the recorded answer, not one that only sends the same text as an example (Scale, the FAQ).
const firstAnswer = () => { const q = Object.values(recordedResponse().answers).find((a) => a.type === 'choice'); return String(q.probabilities[q.choice]); };

export const recordedOutputs = [
	{
		name: 'the recorded decisions (decisio-examples, support routing and three more), sent again',
		version: () => session().decisio,
		marker: 'I was charged twice for October',
		alsoShows: firstAnswer,
	},
	{
		name: 'the routing example (decisio-examples example 5)',
		version: () => session().decisio,
		marker: 'Escalate only when unsure',
	},
	{
		name: "docs/tasks.md's worked certificate, on the 31B",
		version: () => session().decisio,
		marker: certificate().certificate.id,
	},
];

// The recordings these replaced: decisio 0.9.0's box label for the twelve decisions and example 5, and the certificate of
// decisio's own worked example on a Mac, made before 0.16.0.
export const retired = [
	{ name: "the recorded decisions' decisio 0.9.0 box", marker: 'Gemma 4 31B, decisio 0.9.0' },
	{ name: "docs/tasks.md's worked certificate on a Mac", marker: 'ticket-queue#c2e4cc6e431b' },
];
