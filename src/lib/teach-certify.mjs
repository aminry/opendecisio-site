// The teach-and-certify demo page's numbers, from src/data/teach-certify/teach_certify.json (schema teach_certify/1):
// twelve taught tasks on two public intent sets, each with its accuracy, its certificates on the test split and its
// 200 re-splits; the support inbox's messages; and the drift replay on both bases. The build stops if the file's shape
// changes, or if a count it states does not follow from the records it carries (a re-split's held count from its
// splits, a drift total from its readings).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteRoot } from './upstream.mjs';

const fail = (what) => { throw new Error(`teach-certify: teach_certify.json ${what}; revisit src/lib/teach-certify.mjs`); };
export const ALPHAS = ['0.02', '0.05', '0.1'];

let memo;
export function data() {
	if (memo) return memo;
	const d = JSON.parse(readFileSync(join(siteRoot, 'src/data/teach-certify/teach_certify.json'), 'utf8'));
	if (d.schema !== 'teach_certify/1') fail(`has schema ${d.schema}, not teach_certify/1`);
	if (d.tasks?.length !== 12) fail(`has ${d.tasks?.length} tasks, not 12`);
	for (const t of d.tasks) {
		for (const a of ALPHAS) {
			const r = t.resplit[a];
			const over = r.splits.filter(([s, e]) => s > 0 && e > Number(a) + 1e-12).length;
			if (r.splits.length !== 200 || r.held !== 200 - over || r.nothing !== r.splits.filter(([s]) => s === 0).length) fail(`${t.id} at ${a}: the held count does not follow from its splits`);
			const c = t.certs[a];
			if (c && c.covered && (c.errors > c.covered || c.covered > t.test_n)) fail(`${t.id} at ${a}: ${c.errors} wrong of ${c.covered} certified, on ${t.test_n}`);
		}
	}
	for (const [b, dr] of Object.entries(d.drift)) {
		const upTo = (lo, hi) => dr.series.filter((s) => s.after > lo && s.after <= hi).reduce((a, s) => a + s.wrong, 0);
		if (upTo(0, dr.first_alert_after) !== dr.wrong_before || upTo(dr.first_alert_after, dr.last_reading) !== dr.wrong_after) fail(`the ${b} drift totals do not follow from its readings`);
	}
	const ib = d.inbox;
	if (ib.messages.length % 8 !== 0) fail(`has ${ib.messages.length} inbox messages, not a multiple of eight`);
	for (const a of ALPHAS) if (ib.targets[a].threshold === null && ib.targets[a].covered !== 0) fail(`inbox at ${a}: certified answers with no threshold`);
	memo = d;
	return d;
}

const DS = { banking77: 'BANKING77', clinc150: 'CLINC150' };
export const datasetName = (ds) => DS[ds] ?? fail(`names an unknown dataset ${ds}`);
export const baseName = (b) => data().models[b]?.name ?? fail(`names an unknown base ${b}`);
export const baseClass = (b) => ({ g12: 'base-g12', g31: 'base-g31' })[b] ?? fail(`names an unknown base ${b}`);

/** A task by base, dataset, examples per intent and draw. */
export function task(model, dataset, k = 10, draw = 1) {
	return data().tasks.find((t) => t.model === model && t.dataset === dataset && t.k === k && t.draw === draw) ?? fail(`has no ${model} ${dataset} task at k = ${k}, draw ${draw}`);
}

/** The four setups the page shows, at 10 examples per intent, draw 1: each base on each set. */
export const SETUPS = [['g31', 'banking77'], ['g12', 'banking77'], ['g31', 'clinc150'], ['g12', 'clinc150']];
