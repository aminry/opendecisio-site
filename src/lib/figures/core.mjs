// Shared by the docs' figures: the panel around a drawing, the recorded decision they draw from, and small formatters.
import { recordedExamples } from '../launch.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const p2 = (n) => Number(n).toFixed(2);
export const p3 = (n) => Number(n).toFixed(3);

/** The panel around a figure's drawing. `live` is the number of seconds the animation takes; without it the figure holds still. */
export function panel({ name, label, title, desc, body, legend, source, live, extra = '', interactive = false }) {
	return `<figure class="fig fig--${name}" data-fig="${name}"${live ? ` data-live="${live}"` : ''}>
<div class="fig__head"><div><p class="fig__kicker">Figure · ${esc(label)}</p><p class="fig__title">${esc(title)}</p></div>${live ? '<button type="button" class="fig__pause" data-fig-pause hidden>Pause</button>' : ''}</div>
<div class="fig__stage"${interactive ? ` role="group" aria-label="${esc(desc)}"` : ` role="img" tabindex="0" aria-label="${esc(desc)}"`}>${body}</div>
${extra}${legend ? `<p class="fig__legend">${legend}</p>` : ''}${source ? `<p class="fig__source">${source}</p>` : ''}
</figure>`;
}

export const recorded = () => recordedExamples();
/** The line that labels a recorded answer shown on a page: its box, its date and its place in the run. */
// `shows` says what the line sits under, so it says only what is true of it: a response (abridged, three places), a client's
// printed lines (three places in the code, two in a figure) or a figure's bars (two places).
export const recordedLabel = (shows = 'response') => `<p class="recorded">${sourceLine(recorded(), shows === 'printed' ? 'the printed probabilities are rounded to three places' : 'the response is abridged and its probabilities are rounded to three places')}</p>`;
export const sourceLine = (r, shown = 'the probabilities are rounded to two places') => `Recorded decision: ${esc(r.boxLabel)}, ${r.run.date}; record 1 of ${r.items[0].of} of decisio-examples' support-routing run, sent again on that release; ${shown}.`;
export const wrapText = (text, width) => {
	const lines = [];
	let line = '';
	for (const w of text.split(/\s+/)) {
		if ((line + ' ' + w).trim().length > width) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
	}
	if (line) lines.push(line);
	return lines;
};
// The option a question answers with: a yes/no's yes, a choice's likeliest option, a score's likeliest level.
export const topBar = (q) => (q.type === 'yes/no' ? q.bars[0] : [...q.bars].sort((a, b) => b.p - a.p)[0]);
export const barLabel = (q) => (q.type === 'yes/no' ? 'yes' : q.type === 'score' ? `level ${topBar(q).label}` : topBar(q).label);


/** The request as the page sends it, built from the recorded decision: its text, and each question as it was asked. */
export function recordedRequest() {
	const it = recorded().items[0];
	const questions = {};
	for (const q of it.questions) {
		if (q.type === 'yes/no') questions[q.name] = { type: 'noul', instructions: q.ask };
		else if (q.type === 'choice') questions[q.name] = { type: 'choice', instructions: q.ask, criteria: Object.fromEntries(q.bars.map((b) => [b.label, b.title])) };
		else questions[q.name] = { type: 'score', instructions: q.ask, criteria: q.bars.map((b) => b.title) };
	}
	return { state: it.state, questions };
}

/** The response, abridged and rounded as the README's own is: each answer's likeliest option and its probabilities. */
export function recordedResponse() {
	const it = recorded().items[0];
	const answers = {};
	for (const q of it.questions) {
		const r3 = (n) => Number(p3(n));
		if (q.type === 'yes/no') answers[q.name] = { type: 'noul', noul: r3(q.bars[0].p) };
		else if (q.type === 'choice') answers[q.name] = { type: 'choice', choice: topBar(q).label, probabilities: Object.fromEntries(q.bars.map((b) => [b.label, r3(b.p)])) };
		else answers[q.name] = { type: 'score', probabilities: Object.fromEntries(q.bars.map((b) => [b.label, r3(b.p)])) };
	}
	return { answers };
}

