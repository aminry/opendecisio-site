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
	// The fix (out of scope taught), when its run is in: its alarm totals follow from its readings too, it certified the
	// whole stream at one threshold, and its promise held at 10% and not at 5% (its realised error between the two).
	const f = d.fix;
	if (f) {
		const upTo = (lo, hi) => f.series.filter((s) => s.after > lo && s.after <= hi).reduce((a, s) => a + s.wrong, 0);
		if (upTo(0, f.first_alert_after) !== f.wrong_before || upTo(f.first_alert_after, f.last_reading) !== f.wrong_after) fail('the fix\'s drift totals do not follow from its readings');
		if (f.certified_share !== 1 || !(f.wrong_rate > 0.05 && f.wrong_rate <= 0.1) || f.held['0.1'] !== true || f.held['0.05'] !== false) fail('the fix\'s promise is not the one the page states (held at 10%, missed at 5%, everything certified)');
		if (f.cert_oos !== Math.round(f.cert_oos_share * f.cert_examples)) fail('the fix\'s off-topic share of its certifying examples does not follow from its counts');
	}
	// The gatekeeper, when its run is in: its ranges are ordered, its unsafe answers split into the policy's lists and the
	// model's mistakes, none of its new kind of command was certified, and the policy has a catch-all rule that asks.
	const g = d.gatekeeper;
	if (g) {
		if (!(g.at5.share[0] <= g.at5.share[1] && g.at10.share[0] <= g.at10.share[1] && g.at5.share[1] < g.at10.share[0])) fail('the gatekeeper\'s certified shares are out of order');
		if (g.unsafe.policy_lists + g.unsafe.model_mistakes !== g.unsafe.unsafe || g.unsafe.unsafe > g.unsafe.certified) fail('the gatekeeper\'s unsafe answers do not add up');
		if (g.drift.certified !== 0 || g.drift.to_ask > g.drift.new_kind) fail('the gatekeeper\'s drift replay is not the one the page states');
		if (g.rules.at(-1)?.rule !== 'other' || g.rules.at(-1)?.action !== 'ask') fail('the gatekeeper\'s policy has no catch-all rule that asks');
	}
	// decisio 0.16.0's results are shown only once it is released (release016.released, set after it is on PyPI), and only
	// for the version they were measured for.
	const r = d.release016;
	if (r) {
		if (typeof r.released !== 'boolean' || r.version !== '0.16.0') fail(`release016 is for ${r.version}, released ${r.released}`);
		if (r.jump.first_suspended - r.jump.jump_at <= 0 || r.clinc.wrong_before >= r.clinc.wrong_before_014 || r.false_suspensions !== 0 || r.served_path.max_shift !== 0) fail('release016 is not the result the page states');
		if (r.clinc.wrong_before_014 !== d.drift.g31.wrong_before) fail('release016 compares with another 0.14.0 count than the drift record');
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

/**
 * The out-of-scope fix under the current monitor (oos_replay.json): the CLINC150 stream with out_of_scope taught,
 * its recorded readouts replayed through the monitor of the release it names. Checked against the drift record it
 * replays (the same stream), with the share of off-topic messages at the first pause read from the stream's ramp.
 */
export function oosReplay() {
	const d = data();
	const r = JSON.parse(readFileSync(join(siteRoot, 'src/data/teach-certify/oos_replay.json'), 'utf8'));
	const no = (what) => { throw new Error(`teach-certify: oos_replay.json ${what}; revisit src/lib/teach-certify.mjs`); };
	const f = d.fix;
	if (r.schema !== 'oos_replay/1') no('is not oos_replay/1');
	if (r.messages !== f.messages || r.options !== f.options) no('replays another stream or task than the fix record');
	const p = r.with_pause;
	if (!(p.first_paused_answer > f.start && p.first_paused_answer <= f.top)) no('pauses outside the stream\'s ramp');
	if (r.seed_sweep.paused_in !== r.seed_sweep.seeds || r.no_drift_control.pause_episodes !== 0) no('no longer pauses on every seed, or pauses on the control');
	if (!(p.wrong_certified_from_1001_to_end < r.alert_only.wrong_certified_from_1001_to_end)) no('no longer has the pause cut the wrong certified answers');
	if (p.wrong_answers_whole_stream_if_all_served !== r.alert_only.wrong_answers_whole_stream_if_all_served) no('has two answer sets');
	const rightTaught = 1 - p.wrong_answers_whole_stream_if_all_served / r.messages;
	const rightUntaught = 1 - f.wrong_rate_before;
	if (!(rightTaught > rightUntaught)) no('no longer has the taught task right more often');
	const shareAtPause = f.top_share * (p.first_alert_after_message - f.start) / (f.top - f.start);
	return { ...r, rightTaught, rightUntaught, shareAtPause, untaught: d.release016.clinc };
}
