// Learning figures use illustrative answers, never measured model output or fitted certificates.
import { questionExample } from '../question-examples.mjs';
import { weightedScore, manualAction } from '../figure-math.mjs';
import { esc, panel } from './core.mjs';

const number = (n) => n.toFixed(2);
const source = 'Illustration: chosen probabilities, using the tutorial request. Your model returns its own values.';
const choice = { billing: 0.8, access: 0.05, bug: 0.15 };
const yes = 0.1;
const scores = [
	{ name: 'Mostly low', probabilities: [0.05, 0.8, 0.1, 0.05] },
	{ name: 'Middle', probabilities: [0.1, 0.2, 0.6, 0.1] },
	{ name: 'Mostly high', probabilities: [0.05, 0.05, 0.2, 0.7] },
];
const cases = [
	{ name: 'Ticket A', choice: 'billing', probability: 0.95 },
	{ name: 'Ticket B', choice: 'access', probability: 0.9 },
	{ name: 'Ticket C', choice: 'billing', probability: 0.65 },
	{ name: 'Ticket D', choice: 'bug', probability: 0.4 },
];

const bar = (p, extra = '') => `<svg class="learn__bar" preserveAspectRatio="none" viewBox="0 0 100 12" aria-hidden="true"><rect class="f-rail" width="100" height="12" rx="3"/><rect class="f-bar" width="${p * 100}" height="12" rx="3" ${extra}/></svg>`;
const rows = (items) => `<dl class="learn__distribution">${items.map(({ key, label, probability }) => `<div><dt>${esc(label)}</dt><dd>${bar(probability)}<span ${key === undefined ? '' : `data-score-prob="${key}"`}>${number(probability)}</span></dd></div>`).join('')}</dl>`;

function firstQuestion() {
	const req = questionExample('choice');
	const q = req.questions.category;
	const items = [
		{ title: 'Text', value: req.state },
		{ title: 'Question', value: q.instructions },
		{ title: 'Answer', value: 'billing, probability 0.80' },
		{ title: 'Your code', value: 'Route to a queue or ask for review' },
	];
	const answer = `<div class="learn__mini-distribution">${Object.entries(choice).map(([key, p]) => `<div><span>${esc(key)}</span><span>${number(p)}</span>${bar(p)}</div>`).join('')}</div><span class="learn__selected">Selected: billing</span>`;
	const body = `<ol class="learn__flow">${items.map((item, i) => `<li class="f-pop fd-${i * 2}" data-phase="${i}"><b>${esc(item.title)}</b>${i === 2 ? answer : `<span>${esc(item.value)}</span>`}</li>`).join('')}</ol>`;
	return panel({ name: 'first-question', label: 'Illustrative decision', title: 'Ask a question; use the answer in your backend.', desc: items.map((item) => `${item.title}: ${item.value}.`).join(' '), body, interactive: true, live: 3, steps: items.map((item) => `${item.title}: ${item.value}`), legend: 'The question and possible answers are yours. Your application chooses what happens next.', source });
}

function choiceDistribution() {
	const req = questionExample('choice');
	const body = rows(Object.entries(choice).map(([key, probability]) => ({ label: key, probability }))) + '<p>The selected key is <code>billing</code>, the largest probability. The other options still have a probability.</p>';
	if (Object.keys(req.questions.category.criteria).join(',') !== Object.keys(choice).join(',')) throw new Error('Choice illustration no longer matches its tutorial options');
	return panel({ name: 'choice-distribution', label: 'A choice', title: 'One selected key, with the alternatives alongside it.', desc: 'Illustrative billing 0.80, access 0.05 and bug 0.15. Billing is selected; the values sum to 1.', body, interactive: true, source });
}

function yesNo() {
	return panel({ name: 'yes-no-probability', label: 'Yes or no', title: 'The answer is the probability of yes; no is the remainder.', desc: 'Illustrative probability of yes 0.10 and no 0.90. Neither value is a Boolean.', body: rows([{ label: 'Yes', probability: yes }, { label: 'No', probability: 1 - yes }]) + '<p><code>noul = 0.10</code>. Your code decides when to act on yes, on no or on neither.</p>', interactive: true, source });
}

const scoreSentence = (values) => `Mean level ${number(weightedScore(values))}. The likeliest level is ${values.indexOf(Math.max(...values))}, with probability ${number(Math.max(...values))}.`;
function scoreDistribution() {
	const req = questionExample('score');
	const rubric = req.questions.impact.criteria;
	const initial = scores[1].probabilities;
	if (rubric.length !== initial.length) throw new Error('Score illustration no longer matches the tutorial rubric');
	const mean = weightedScore(initial);
	const body = `<div data-score data-presets="${esc(JSON.stringify(scores))}">
<div class="fig__enhance"><label for="score-preset">Illustrative score distribution</label><input id="score-preset" data-score-input type="range" min="0" max="2" step="1" value="1" aria-valuetext="Middle distribution, mean level 1.70" aria-describedby="score-out" disabled><div class="learn__ticks" aria-hidden="true"><span>Mostly low</span><span>Middle</span><span>Mostly high</span></div></div>
<p class="learn__result" id="score-out" data-score-out aria-live="polite">${scoreSentence(initial)}</p>
<svg class="learn__axis" viewBox="0 0 600 34" aria-hidden="true"><path class="f-axis" d="M20 25H580"/>${rubric.map((_, i) => `<path class="f-axis" d="M${20 + i * (560 / 3)} 20V30"/>`).join('')}<path data-score-marker class="learn__marker" d="M${20 + mean / 3 * 560} 6l-7 12h14z"/></svg><div class="learn__ticks" aria-hidden="true">${rubric.map((_, i) => `<span>${i}</span>`).join('')}</div>
${rows(rubric.map((label, index) => ({ key: index, label: `${index}. ${label}`, probability: initial[index] })))}
<p class="learn__arithmetic" data-score-arithmetic>0 × 0.10 + 1 × 0.20 + 2 × 0.60 + 3 × 0.10 = 1.70</p>
</div>`;
	return panel({ name: 'score-distribution', label: 'An ordered score', title: 'The mean moves between rubric levels as the distribution changes.', desc: 'An illustrative four-level rubric. The initial probabilities are 0.10, 0.20, 0.60 and 0.10; their weighted mean is 1.70 and the likeliest level is 2.', body, interactive: true, source });
}

function manualThreshold() {
	const threshold = 0.9;
	const accepted = cases.filter((item) => manualAction(item.probability, threshold) === 'act').length;
	const body = `<div data-manual-policy data-cases="${esc(JSON.stringify(cases))}">
<div class="fig__enhance"><label for="manual-threshold">Manual threshold: top probability at least <output data-threshold-value for="manual-threshold">0.90</output></label><input id="manual-threshold" data-threshold-input type="range" min="0.5" max="1" step="0.01" value="0.9" aria-valuetext="0.90" aria-describedby="threshold-out" disabled><div class="learn__ticks" aria-hidden="true"><span>0.50</span><span>0.75</span><span>1.00</span></div></div>
<p class="learn__result" id="threshold-out" data-threshold-out aria-live="polite">${accepted} act, ${cases.length - accepted} review at a manual threshold of 0.90.</p>
<ul class="learn__cases">${cases.map((item, i) => `<li><div><b>${item.name}</b><span>${item.choice}, probability ${number(item.probability)}</span></div><svg class="learn__bar" viewBox="0 0 100 16" aria-hidden="true"><rect class="f-rail" y="2" width="100" height="12" rx="3"/><rect class="f-bar" y="2" width="${item.probability * 100}" height="12" rx="3"/><path data-threshold-line class="learn__threshold-halo" d="M90 0V16"/><path data-threshold-line class="learn__threshold" d="M90 0V16"/></svg><strong data-policy-result="${i}">${manualAction(item.probability, threshold) === 'act' ? 'Act' : 'Review'}</strong></li>`).join('')}</ul>
<p>This is a manual policy. To automate at an error target, <a href="/docs/tasks/certify/">certify a task</a> and check its certificate.</p></div>`;
	return panel({ name: 'manual-threshold', label: 'Act or review', title: 'Choose a probability line; see which example answers your policy accepts.', desc: 'Four illustrative answers with top probabilities 0.95, 0.90, 0.65 and 0.40. At a manual line of 0.90 two act and two go to review. This is not a fitted certificate.', body, interactive: true, source: 'Illustration: chosen probabilities for four example answers. The control changes the application policy, not the model.' });
}

// Mark whole fields so four ordinary buttons can explain the request without dozens of tab stops.
function pretty(value, identify, path = [], depth = 0) {
	if (value === null || typeof value !== 'object') return esc(JSON.stringify(value));
	const pad = '  '.repeat(depth);
	const array = Array.isArray(value);
	const entries = array ? value.map((item, index) => [index, item]) : Object.entries(value);
	if (!entries.length) return array ? '[]' : '{}';
	const lines = entries.map(([key, item], index) => {
		const next = [...path, key];
		const field = identify(next);
		const line = `${array ? '' : `${esc(JSON.stringify(key))}: `}${pretty(item, identify, next, depth + 1)}${index < entries.length - 1 ? ',' : ''}`;
		return `${pad}  ${field ? `<span class="j" data-field="${field}">${line}</span>` : line}`;
	});
	return `${array ? '[' : '{'}\n${lines.join('\n')}\n${pad}${array ? ']' : '}'}`;
}

export function fieldMap({ name, request, response, source: sourceText, title, label = 'Explore the fields' }) {
	const notes = {
		text: 'state is the text to ask about. Keep it separate from the question.',
		question: 'questions names each judgment. Its type and instructions tell the server what to answer.',
		options: 'criteria gives named options for choice or ordered levels for score. A noul question already has yes and no, and can optionally describe true and false.',
		answer: 'answers uses your question names. Read the typed value and its probabilities before your application acts.',
	};
	const requestField = (path) => path[0] === 'state' ? 'text' : path[0] === 'questions' && path.length === 2 ? 'question' : path.length === 3 && (path[2] === 'criteria' || (path[2] === 'type' && request.questions[path[1]].type === 'noul')) ? 'options' : undefined;
	const responseField = (path) => path[0] === 'answers' && path.length === 2 ? 'answer' : undefined;
	const controls = `<div class="fig__enhance"><div class="fig__controls" aria-label="Explain a field">${Object.keys(notes).map((field) => `<button type="button" data-field-select="${field}" aria-pressed="false" disabled>${{ text: 'Text', question: 'Question', options: 'Options', answer: 'Answer' }[field]}</button>`).join('')}</div></div>`;
	const body = `${controls}<div class="fig__cols"><div class="fig__col"><p class="fig__colhead">Request</p><pre class="fig__json" tabindex="0"><code>${pretty(request, requestField)}</code></pre></div><div class="fig__col"><p class="fig__colhead">Answer fields</p><pre class="fig__json" tabindex="0"><code>${pretty(response, responseField)}</code></pre></div></div><p class="fig__field-note" data-field-note aria-live="polite">The text, question, options and typed answer are separate parts of one decision.</p><details><summary>Read all field explanations</summary><dl>${Object.entries(notes).map(([field, note]) => `<dt>${{ text: 'Text', question: 'Question', options: 'Options', answer: 'Answer' }[field]}</dt><dd data-field-explain="${field}">${esc(note)}</dd>`).join('')}</dl></details>`;
	return panel({ name, label, title, desc: 'A request beside its answer. Four controls identify the text, question, options and answer. All field explanations are also available below.', body, interactive: true, source: sourceText });
}

function requestMap(type) {
	const request = questionExample(type);
	const [key, q] = Object.entries(request.questions)[0];
	const answer = type === 'choice' ? { type, choice: 'billing', probabilities: choice } : type === 'noul' ? { type, noul: yes } : { type, score: weightedScore(scores[1].probabilities), legend: Object.fromEntries(q.criteria.map((label, i) => [i, label])), probabilities: Object.fromEntries(scores[1].probabilities.map((p, i) => [i, p])) };
	return fieldMap({ name: `request-map-${type}`, request, response: { answers: { [key]: answer } }, source, label: 'Illustrative field map', title: 'Find the field your code sends or reads.' });
}

export const learningFigures = {
	'first-question': firstQuestion,
	'choice-distribution': choiceDistribution,
	'yes-no-probability': yesNo,
	'score-distribution': scoreDistribution,
	'manual-threshold': manualThreshold,
	'request-map-choice': () => requestMap('choice'),
	'request-map-noul': () => requestMap('noul'),
	'request-map-score': () => requestMap('score'),
};
