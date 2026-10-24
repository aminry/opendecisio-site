// The figure of "Think when unsure": one read, the unsure test with each type's threshold, the second read after the
// served model's reasoning, and the two reads mixed. The thresholds, the option limit and the default budget are read
// from decisio's docs at the pinned release (docs/cli.md's think rows, docs/running.md's procedure), so the figure moves
// with them and the build stops if they are no longer stated.
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

/** The think settings as decisio's docs state them. */
export function thinkFacts() {
	const cli = readUpstream('docs/cli.md');
	const row = /^\| `--think-factor`, `--think-budget` \| ([\d.]+), (\d+) \|[^\n]*the thresholds \(choice ([\d.]+), yes\/no ([\d.]+), score ([\d.]+)\)/m.exec(cli);
	if (!row) throw new Error("think figure: docs/cli.md no longer gives the think factor, budget and thresholds in its flags table");
	const running = readUpstream('docs/running.md');
	const options = /and it has at most (\d+) options/.exec(running)?.[1];
	if (!options) throw new Error('think figure: docs/running.md no longer says how many options a thinking question may have');
	if (!/The two reads are mixed in log space/.test(running)) throw new Error('think figure: docs/running.md no longer says how the two reads are mixed');
	if (!/through the question type's \*\*think temperature\*\* where there is one/.test(running)) throw new Error('think figure: docs/running.md no longer says the mix goes through the type\'s think temperature');
	return { factor: Number(row[1]), budget: Number(row[2]), choice: Number(row[3]), noul: Number(row[4]), score: Number(row[5]), options: Number(options) };
}

const STEPS = (f) => [
	{ title: '1. Read once', lines: ['every question, as always,', 'at its type\'s temperature'] },
	{ title: '2. Unsure?', lines: [`top probability under choice ${f.choice},`, `yes/no ${f.noul}, score ${f.score}`, `(times the factor, ${f.factor} by default)`] },
	{ title: '3. Reason, read again', lines: ['the served model writes', `up to ${f.budget} tokens, then the`, 'options are read again'] },
	{ title: '4. Mix', lines: ['the two reads, in log space,', 'at the type\'s think', 'temperature, if it has one'] },
];

function thinkFlow() {
	const f = thinkFacts();
	const steps = STEPS(f);
	const box = (s, i) => {
		const x = 8 + i * 178;
		return `<rect class="f-node${i === 2 ? ' f-node--on' : ''}" x="${x}" y="12" width="160" height="112" rx="12"/>
<text class="ft ft-b" x="${x + 12}" y="38">${esc(s.title)}</text>
${s.lines.map((l, j) => `<text class="ft ft-s" x="${x + 12}" y="${62 + j * 18}">${esc(l)}</text>`).join('')}
${i < steps.length - 1 ? `<path class="f-line" d="M${x + 160} 68L${x + 178} 68" pathLength="1" marker-end="url(#th)"/>` : ''}`;
	};
	const sure = `<path class="f-frame" d="M266 124L266 150L80 150L80 124"/><text class="ft ft-s" x="96" y="168">sure: answered from the one read, in milliseconds</text>`;
	const body = `<svg class="fig__svg" viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><marker id="th" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="f-head" d="M0 0L10 5L0 10z"/></marker></defs>${steps.map(box).join('')}${sure}</svg>`;
	return panel({
		name: 'think-flow', label: 'Thinking when unsure', title: 'Only an unsure question is read again, after the model writes its reasoning.',
		desc: `Four steps. 1: every question is read once, as always. 2: it is unsure when its top probability is under its type's threshold, ${f.choice} for a choice, ${f.noul} for yes/no and ${f.score} for a score, times the factor (${f.factor} by default), and it has at most ${f.options} options; a sure question is answered from the one read. 3: an unsure question is read again after the served model writes up to ${f.budget} tokens of reasoning. 4: the two reads are mixed in log space and go through the type's think temperature if it has one, else the same temperature.`,
		body, legend: `A question with more than ${f.options} options is never unsure: it stays at one read.`, source: 'Source: docs/running.md ("Thinking when unsure") and docs/cli.md of the pinned release.',
	});
}

export const thinkFigures = { 'think-flow': thinkFlow };
