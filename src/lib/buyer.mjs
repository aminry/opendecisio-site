// The capabilities table as the questions a buyer asks. Each answer is a few words, written here, for decisio
// and for Jev 1.13; each row says which rows of docs/comparison.md's capabilities table it summarises, and the
// words that must still be in those rows, so a release that changes what the upstream rows say stops the build
// until the answer is read again. The full upstream cells, quotes and snapshots, are the row's sources.
import { comparison } from './comparison.mjs';

const yes = (text) => ({ mark: 'yes', text });
const no = (text) => ({ mark: 'no', text });
const say = (text) => ({ mark: null, text });

// from: the upstream rows (first column) behind the answer; ours / theirs: patterns that must match the upstream cells.
const QUESTIONS = [
	{ id: 'data', q: 'Where does my data go?', from: ['Where data goes'], ours: /to the machine that runs the server, and nowhere else/, theirs: /not trained on customer requests/,
		decisio: say('Stays on the machine that runs it'), jev: say("TypeSafe's hosted API; not used for training") },
	{ id: 'cost', q: 'What does it cost?', from: ['Price'], ours: /no per-call price/, theirs: /\$42/,
		decisio: say('No per-call price; you pay for the card'), jev: say('$42 per billion input tokens; output free') },
	{ id: 'own-hardware', q: 'Does it run on my own GPU, Mac or laptop?', from: ['Self-hosting', 'Mac and Ollama'], ours: /Apple silicon|Mac/, theirs: /no self-hosted option/,
		decisio: yes('GPU, Mac with MLX, or a laptop with Ollama'), jev: no('Hosted API only; its documentation describes no self-hosted option') },
	{ id: 'context', q: 'Longest document?', from: ['Context'], ours: /32,768 tokens per prompt/, theirs: /32k tokens for `?state`? plus the longest question/,
		decisio: say('32,768 tokens per prompt on 2026-10-05; from decisio 0.14.0 a Gemma base serves what the card holds, up to 98,304 on the 31B'), jev: say('32k tokens for the state plus the longest question (64k per request)') },
	{ id: 'options', q: 'Options per question?', from: ['Options per question'], ours: /up to 255 named options/, theirs: /maximum of 255 options per Choice/,
		decisio: say('Up to 255'), jev: say('Up to 255 on a choice') },
	{ id: 'many', q: 'Many questions in one read?', from: ['Several questions per request'], ours: /read once and shared/, theirs: /every question in a request in parallel/,
		decisio: yes('The state is read once and shared by every question'), jev: yes('Every question in a request is evaluated in parallel') },
	{ id: 'images', q: 'Images?', from: ['Image input'], ours: /photos in the state/, theirs: /Text only/,
		decisio: yes('Photos in the state; measured on the Qwen base only'), jev: no('Text only') },
	{ id: 'trust', q: 'Probabilities I can trust?', from: ['Calibration'], ours: /Gemma 4 31B 0\.035 and 0\.091/, theirs: /trained for calibrated decisions/,
		decisio: yes('Fitted per base; each base\'s calibration error is under Confidence, above'), jev: yes('Trained for calibrated decisions, in its documentation') },
	{ id: 'teach', q: 'Can I teach it with my own examples?', from: ['Teaching from labelled examples'], ours: /\/v1\/tasks/, theirs: /not fine-tuned or LoRA-adapted with customer data/,
		decisio: yes('POST /v1/tasks fits calibration and an intent head to your labelled examples, and from decisio 0.12.0 certifies which answers to trust at the error rate you pick; the model stays frozen'), jev: no('Not fine-tuned on customer data; shaped through the request') },
	{ id: 'repeat', q: 'Same answer every time?', from: ['Repeatability'], ours: /bit for bit/, theirs: /do not state whether a repeated request/,
		decisio: say('Qwen: bit for bit. The Gemma bases: the same top answer on one running server, with the exact numbers able to move'), jev: say('Not stated in its documentation; an alias moves when a release ships') },
	{ id: 'licence', q: 'Licence?', from: ['Licence'], ours: /Apache-2\.0/, theirs: /customer agreements/,
		decisio: say('Apache-2.0'), jev: say("A hosted service under TypeSafe's customer agreements") },
];

const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');

/** The questions, each with the upstream cells behind it; the upstream rows must still say what the answer says. */
export function buyerQuestions() {
	const c = comparison();
	if (!c) throw new Error('buyer: the pinned release has no docs/comparison.md');
	const byLabel = new Map(c.capabilities.rows.map((r) => [plain(r[0]).trim(), r]));
	return {
		intro: c.capabilities.intro,
		rows: QUESTIONS.map((x) => {
			const sources = x.from.map((label) => {
				const row = byLabel.get(label);
				if (!row) throw new Error(`buyer: docs/comparison.md has no capabilities row "${label}" (for "${x.q}"); read the table again`);
				return { label, ours: row[1], theirs: row[2] };
			});
			const ours = sources.map((s) => plain(s.ours)).join(' ');
			const theirs = sources.map((s) => plain(s.theirs)).join(' ');
			if (!x.ours.test(ours)) throw new Error(`buyer: the decisio cell for "${x.q}" no longer says ${x.ours}; read it again: ${ours.slice(0, 200)}`);
			if (!x.theirs.test(theirs)) throw new Error(`buyer: the Jev cell for "${x.q}" no longer says ${x.theirs}; read it again: ${theirs.slice(0, 200)}`);
			return { id: x.id, question: x.q, decisio: x.decisio, jev: x.jev, sources };
		}),
	};
}
