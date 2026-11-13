// Compact usage diagrams. The existing guides and pinned upstream docs remain the source of behavior.
import { readUpstream } from '../upstream.mjs';
import { questionExample } from '../question-examples.mjs';
import { RECIPES } from '../use-cases.mjs';
import { esc, panel } from './core.mjs';

const needs = (file, phrase) => {
	if (!readUpstream(file).includes(phrase)) throw new Error(`Guide figure: ${file} no longer says ${phrase}`);
};
const flow = (items) => `<ol class="learn__flow learn__flow--${items.length}">${items.map(([title, note]) => `<li><b>${esc(title)}</b><span>${esc(note)}</span></li>`).join('')}</ol>`;
const drawing = (name, title, items, legend, source) => panel({ name, label: 'How to use it', title, desc: items.map(([title, note]) => `${title}: ${note}.`).join(' '), body: flow(items), legend, source, interactive: true });

function context() {
	needs('docs/tasks.md', 'Task context');
	needs('docs/running.md', 'the context, a blank line, the state and the question');
	return drawing('fixed-context', 'Save the fixed policy with the task; send only the new message.', [
		['Register the task', 'Store the fixed policy as its context, beside the question.'],
		['Send a message', 'Put only the changing message in state.'],
		['Answer with context', 'The model reads the task context with this new message.'],
		['Use the result', 'Your backend reads the typed answer as usual.'],
	], 'Keep the context out of later messages so the policy is not included twice. Cache reuse depends on the serving engine.', 'Source: task context in the pinned task and running guides.');
}

function dynamic() {
	needs('docs/tasks.md', '"options": "dynamic"');
	needs('docs/api.md', 'matched on the question\'s instructions');
	const first = questionExample('choice');
	const second = structuredClone(first);
	second.questions.category.criteria = { billing: 'Invoices and payments', access: 'Login and permissions', refunds: 'Requests to refund a payment' };
	const requests = [first, second];
	const body = flow([
		['Keep the question', 'A dynamic task matches the question’s instructions.'],
		['Supply candidates', 'Each request can supply its own choice options.'],
		['Read this answer', 'Its probability keys are the options in this request.'],
	]) + `<details><summary>Compare two complete example requests</summary><div class="fig__cols">${requests.map((request, i) => `<div class="fig__col"><p class="fig__colhead">Request ${i + 1}</p><pre class="fig__json" tabindex="0"><code>${esc(JSON.stringify(request, null, 2))}</code></pre><p>Answer probability keys: ${Object.keys(request.questions.category.criteria).map((key) => `<code>${esc(key)}</code>`).join(', ')}.</p></div>`).join('')}</div></details>`;
	return panel({ name: 'dynamic-options', label: 'Changing options', title: 'Keep the instruction stable while the candidate list changes.', desc: 'Two illustrative choice requests share an instruction. The first offers billing, access and bug; the second billing, access and refunds. Each answer uses its own request’s keys.', body, interactive: true, legend: 'Register the dynamic task with a certificate before using its certified-answer path.', source: 'Illustrative requests, using the choice tutorial. Matching behavior: the pinned task and API guides.' });
}

function fastTable() {
	needs('docs/tasks.md', 'a small learned classifier on the server\'s CPU');
	needs('docs/tasks.md', 'The certificate is an agreement certificate.');
	const body = flow([['New text', 'Send the question your task was registered for.'], ['CPU classifier', 'A fitted classifier tries the task first.']]) + `<p class="learn__junction">The request follows one of these paths:</p><div class="learn__branches"><section><h3>Accepted by the classifier</h3><p>Return its typed answer and certificate information.</p></section><section><h3>Deferred to the model</h3><p>Decisio answers the request; your backend reads the same answer fields.</p></section></div><p>A gold certificate concerns labelled answers. A learned table’s agreement certificate concerns agreement with the model.</p>`;
	return panel({ name: 'table-fallback', label: 'A classifier before the model', title: 'The classifier answers the requests it accepts and passes the rest to decisio.', desc: 'Text goes first to the fitted CPU classifier. Accepted requests get its answer. Deferred requests go to the decisio model. Gold and agreement certificates have different meanings.', body, interactive: true, source: 'Source: the fast-table section of the pinned task guide. This diagram has no timing scale.' });
}

function concurrency() {
	needs('docs/running.md', 'scores all their rows in one engine call');
	const body = `<section class="learn__schedule"><h3>Serial</h3>${flow([['Call for A', 'One request uses the engine.'], ['Call for B', 'The next request follows.'], ['Call for C', 'The next request follows.']])}</section><section class="learn__schedule"><h3>Batched, when eligible requests are waiting</h3>${flow([['Requests A, B, C', 'Several clients have requests waiting.'], ['One shared call', 'Eligible requests share the engine call.'], ['Separate answers', 'Each client receives its own response.']])}</section>`;
	return panel({ name: 'concurrent-requests', label: 'Request scheduling', title: 'Serial handles requests one at a time; batched can combine eligible waiting requests.', desc: 'A schematic, not a timing chart. Serial calls handle A, B and C in turn. Batched can put eligible waiting requests in one shared engine call, returning separate responses.', body, interactive: true, legend: 'An idle server still answers a lone request at once. Certified-task reads, thinking and image requests take their documented separate paths.', source: 'Source: concurrency in the pinned running guide. Box widths do not represent latency or a speed ratio.' });
}

function layouts() {
	needs('docs/running.md', '`--layout header` lists the request\'s questions before the state');
	const body = `<section class="learn__schedule"><h3>Header</h3>${flow([['All questions', 'The list of what this request asks.'], ['Text', 'The material to ask about.'], ['One question', 'The question being answered.']])}</section><section class="learn__schedule"><h3>Plain</h3>${flow([['Text', 'The material to ask about.'], ['One question', 'The question being answered.']])}</section>`;
	return panel({ name: 'request-layout', label: 'Prompt layout', title: 'The layout changes what comes before the text.', desc: 'Header: all questions, then the text, then the question being answered. Plain: the text, then the question being answered.', body, interactive: true, legend: 'Choose a layout for your workload and keep certified tasks on the layout they were certified under.', source: 'Source: the header layout section of the pinned running guide.' });
}

function sharedRead() {
	needs('docs/api.md', 'Each question costs its own time');
	return drawing('shared-read', 'Ask the questions together when they concern the same text.', [['One text', 'Send the message or document in state.'], ['Named questions', 'Ask separate judgments in one questions object.'], ['Typed answers', 'Read each result under the name you supplied.']], 'The request shares the read of its text; every additional question still costs its own work.', 'Source: questions per request in the pinned API guide.');
}

function upgrade() {
	needs('docs/upgrading.md', 'After any upgrade, certify certified tasks again.');
	return drawing('upgrade-flow', 'Check the new server before switching your callers.', [['Export tasks', 'Save the task export; keep labelled examples separately.'], ['Start alongside', 'Bring up the new release on another endpoint.'], ['Certify again', 'Check representative requests and certify under the new setup.'], ['Switch callers', 'Move traffic after the new server is ready.']], 'A certificate belongs to a task and serving setup. Keep a way to return callers to the previous endpoint during the change.', 'Source: the pinned upgrade guide.');
}

const recipeCopy = {
	'support-routing': ['A support ticket', 'A queue key and probabilities', 'Route a certified answer; send the rest to review.'],
	gatekeeper: ['A shell command', 'A policy-rule key and probabilities', 'Map the rule to allow, block or ask; review uncertified answers.'],
	'issue-triage': ['An issue description', 'An issue kind and probabilities', 'Apply the label for a certified answer; otherwise ask a maintainer.'],
	guardrails: ['A message to screen', 'The probability of yes', 'Apply your allow/block policy to certified answers; review the rest.'],
	'rag-gate': ['A question and passage', 'An answerability key and probabilities', 'Answer from the passage, explain what is missing or ask for review.'],
	'document-classification': ['A document', 'A document-type key and probabilities', 'File a certified classification; send the rest to review.'],
};
function recipe(id) {
	const spec = RECIPES[id];
	const [input, result, action] = recipeCopy[id];
	return drawing(`recipe-${id}`, 'The model judges the input; your code chooses the action.', [['Input', input], ['Question', spec.instructions], ['Typed answer', result], ['Your code', action]], `The answer is under answers.${spec.key}. Check the certificate required by your application before automating the action.`, `Source: this recipe’s question and application policy. No model result is illustrated here.`);
}

export const guideFigures = {
	'fixed-context': context,
	'dynamic-options': dynamic,
	'table-fallback': fastTable,
	'concurrent-requests': concurrency,
	'request-layout': layouts,
	'shared-read': sharedRead,
	'upgrade-flow': upgrade,
	...Object.fromEntries(Object.keys(recipeCopy).map((id) => [`recipe-${id}`, () => recipe(id)])),
};
