// Outputs the site shows as recorded from a decisio server, with the release, card and date that recorded them
// (docs/STYLE_GUIDE.md, "Numbers"; Amin, 2026-10-18 and 2026-10-19). scripts/checks/recorded.mjs finds every page that
// shows one (by its marker text) and applies scripts/checks/recorded-rule.mjs: an output older than the pinned minor
// stays if each page labels it with its release, card and date, and if every release since was read for a change to what
// it shows (`reviews`, from the release notes). No GPU is rented to re-record; that happens when a training box is up.
// All three were recorded again on decisio 0.17.0 (src/lib/recorded.mjs), so the earlier recordings are retired: their
// marks must appear on no page.
import { certificate, session } from '../lib/recorded.mjs';
import { recordedResponse } from '../lib/figures/core.mjs';
import { oosReplay } from '../lib/teach-certify.mjs';

// The first recorded decision's routing answer as pages print it (three places): with its text, it marks a page that shows
// the recorded answer, not one that only sends the same text as an example (Scale, the FAQ).
const firstAnswer = () => { const q = Object.values(recordedResponse().answers).find((a) => a.type === 'choice'); return String(q.probabilities[q.choice]); };

// The card as the labels name it, and the reviews of the releases since the recording, from their notes.
const card = () => session().card.replace(/^NVIDIA /, '').replace(/ Blackwell.*$/, '');
const textRoute018 = "0.18.0's changes are adapters (their temperatures and fingerprint), generated reference docs, the image count and the image engines' shares, and W4A16 checkpoints' engine stream; it has no upgrade notes, and none of these touches a text request to the FP8 31B with no adapter";
const recertify0181 = "0.18.1 changes how a re-certification derives its minimum examples, and help text and docs; a text request, an escalation sweep, a first certification and the monitor are as 0.18.0 had them";
const headers0190 = "0.19.0 stops reading the earlier spellings of the debug and route request headers; no recorded request sent them, and nothing else changed";
const tuned0200 = "0.20.0 adds what a tuned model's repository can carry (served defaults, the FP8 merge) and an opt-in --over-limit truncate; the base repositories keep decision_config/1 and --over-limit stays refuse, so a plain request to the base is served as before";
const think0210 = "0.21.0 adds thinking when unsure, off by default; the base repositories keep decision_config/1 with no defaults.think, so a request to the base is one read, as before";
const ci0212 = "0.21.1 and 0.21.2 change only how the release image is built and scanned; the served code is 0.21.0's";
const hub0220 = "0.22.0 changes only the tools that build a tuned model's repository (a 12B one, and what its defaults record); serving is 0.21.2's";
const batch0230 = "0.23.0 adds an opt-in batched mode; a serial server, the default and the one these ran on, gives the same answers and fingerprint, and the engine's lock now serves requests in arrival order";
const fp8_0240 = "0.24.0 adds the 12B in FP8 as a new base, fixes batched mode's stall and makes thinking reason; none of these ran on the Gemma 4 31B served serially without thinking, as these were, and the monitor is unchanged";
const reviews = {
	decisions: { 'v0.18.0': { changed: false, why: textRoute018 }, 'v0.18.1': { changed: false, why: recertify0181 }, 'v0.19.0': { changed: false, why: headers0190 }, 'v0.20.0': { changed: false, why: tuned0200 }, 'v0.21.0': { changed: false, why: think0210 }, 'v0.21.1': { changed: false, why: ci0212 }, 'v0.21.2': { changed: false, why: ci0212 }, 'v0.22.0': { changed: false, why: hub0220 }, 'v0.23.0': { changed: false, why: batch0230 }, 'v0.24.0': { changed: false, why: fp8_0240 } },
	example5: { 'v0.18.0': { changed: false, why: textRoute018 }, 'v0.18.1': { changed: false, why: recertify0181 }, 'v0.19.0': { changed: false, why: headers0190 }, 'v0.20.0': { changed: false, why: tuned0200 }, 'v0.21.0': { changed: false, why: think0210 }, 'v0.21.1': { changed: false, why: ci0212 }, 'v0.21.2': { changed: false, why: ci0212 }, 'v0.22.0': { changed: false, why: hub0220 }, 'v0.23.0': { changed: false, why: batch0230 }, 'v0.24.0': { changed: false, why: fp8_0240 } },
	certificate: { 'v0.18.0': { changed: false, why: `${textRoute018}; a server with no adapter keeps its certificates as before (docs/running.md), though any release change suspends a certificate until it is made again` }, 'v0.18.1': { changed: false, why: `${recertify0181}; the worked certificate is a first certification, not a re-certification` }, 'v0.19.0': { changed: false, why: headers0190 }, 'v0.20.0': { changed: false, why: tuned0200 }, 'v0.21.0': { changed: false, why: think0210 }, 'v0.21.1': { changed: false, why: ci0212 }, 'v0.21.2': { changed: false, why: ci0212 }, 'v0.22.0': { changed: false, why: hub0220 }, 'v0.23.0': { changed: false, why: batch0230 }, 'v0.24.0': { changed: false, why: fp8_0240 } },
};

export const recordedOutputs = [
	{
		name: 'the recorded decisions (decisio-examples, support routing and three more), sent again',
		version: () => session().decisio,
		marker: 'I was charged twice for October',
		card,
		date: () => session().date,
		reviews: reviews.decisions,
		alsoShows: firstAnswer,
	},
	{
		name: 'the routing example (decisio-examples example 5)',
		version: () => session().decisio,
		marker: 'Escalate only when unsure',
		card,
		date: () => session().date,
		reviews: reviews.example5,
	},
	{
		name: "docs/tasks.md's worked certificate, on the 31B",
		version: () => session().decisio,
		marker: certificate().certificate.id,
		card,
		date: () => session().date,
		reviews: reviews.certificate,
	},
	{
		name: 'the out-of-scope fix, replayed through the monitor (Teach and certify, Demos)',
		version: () => oosReplay().decisio,
		marker: 'Out of scope taught',
		card,
		date: () => oosReplay().date,
		reviews: { 'v0.18.1': { changed: false, why: `${recertify0181}; the monitor (monitor.py) is unchanged since 0.18.0` }, 'v0.19.0': { changed: false, why: `${headers0190}; the replay sends no request` }, 'v0.20.0': { changed: false, why: `${tuned0200}; the monitor is unchanged` }, 'v0.21.0': { changed: false, why: `${think0210}; the monitor is unchanged` }, 'v0.21.1': { changed: false, why: ci0212 }, 'v0.21.2': { changed: false, why: ci0212 }, 'v0.22.0': { changed: false, why: hub0220 }, 'v0.23.0': { changed: false, why: `${batch0230}; the monitor's one change skips answers scored in a shared call, which a serial server never makes` }, 'v0.24.0': { changed: false, why: fp8_0240 } },
	},
];

// The recordings these replaced: decisio 0.9.0's box label for the twelve decisions and example 5, and the certificate of
// decisio's own worked example on a Mac, made before 0.16.0.
export const retired = [
	{ name: "the recorded decisions' decisio 0.9.0 box", marker: 'Gemma 4 31B, decisio 0.9.0' },
	{ name: "docs/tasks.md's worked certificate on a Mac", marker: 'ticket-queue#c2e4cc6e431b' },
];
