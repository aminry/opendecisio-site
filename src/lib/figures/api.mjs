// The figure of the HTTP API page: how an abstention threshold turns the model's probabilities into a can't-tell answer.
// The page's own Abstention section is the source; the build stops if it stops saying what the figure draws.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { esc, panel } from './core.mjs';

const page = readFileSync(join(process.cwd(), 'src/content/docs/docs/api.md'), 'utf8');

function abstention() {
	for (const phrase of ['tells the server when to choose a designated can\'t-tell option', 'The server abstains above the fitted threshold and otherwise chooses among the remaining options; reported probabilities stay unchanged.']) {
		if (!page.includes(phrase)) throw new Error(`API figure: the Abstention section no longer says ${phrase}`);
	}
	const steps = [
		['Request', 'The options include one designated can\'t-tell option.', ''],
		['Model reads', 'It scores every option as it always does.', 'model'],
		['Fitted threshold', 'The server abstains above it and otherwise chooses among the remaining options.', ''],
		['Answer', 'The reported probabilities stay unchanged.', 'model'],
	];
	const body = `<ol class="learn__flow learn__flow--4">${steps.map(([t, n, side], i) => `<li data-phase="${i}"${side ? ` data-side="${side}"` : ''}><b>${esc(t)}</b><span>${esc(n)}</span></li>`).join('')}</ol>`;
	return panel({
		name: 'abstention-gate', label: 'Abstention', title: 'A fitted threshold decides when the server picks the can\'t-tell option.',
		desc: steps.map(([t, n]) => `${t}: ${n}`).join(' '),
		body, interactive: true,
		legend: 'The threshold chooses the can\'t-tell option; it is separate from a certificate and from your review policy.',
		source: 'Source: the Abstention section of this page. A schematic with no measured values.',
	});
}

export const apiFigures = { 'abstention-gate': abstention };
