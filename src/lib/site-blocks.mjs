// Code blocks the site writes itself, where decisio's docs have none, each
// shown on a docs page through ::site-block{name="..."} and, if the home page
// shows it too, from here. Every one is checked like any other block
// (verification/plan.mjs).

// The README's example request, sent to Ollama's decision route with a
// listing's model, one key per line so that no line is long; decisio's docs give the pulls only. Fixed text, not derived
// from the README: the Ollama listings are published apart from decisio's
// releases, and scripts/verify-ollama.mjs ran each against its listing.
const ollamaRequest = (model) => `curl http://localhost:11434/v1/systemone \\
  -H 'Content-Type: application/json' \\
  -d '{
  "model": "${model}",
  "state": "Hi, since this morning none of our 40 staff can log in to the dashboard. We get \\"session expired\\" right after entering the password. Payroll is due today.",
  "questions": {
    "urgent": {
      "type": "noul",
      "instructions": "Does this ticket need a response within the hour?"
    },
    "category": {
      "type": "choice",
      "instructions": "Which team should handle this ticket?",
      "criteria": {
        "billing": "Invoices, payments, refunds",
        "access": "Login, passwords, permissions",
        "bug": "The product behaves wrongly",
        "other": null
      }
    },
    "impact": {
      "type": "score",
      "instructions": "Rate the business impact using only the reported facts.",
      "criteria": [
        "No function impaired",
        "One user impaired, with a workaround",
        "Many users blocked from a core function",
        "Data loss or legal exposure"
      ]
    }
  }
}'`;

import { recordedRequest, recordedResponse } from './docs-figures.mjs';
import { pin, readUpstream } from './upstream.mjs';
import { recipeIds, routeScript, teachBody } from './use-cases.mjs';
import { certificate, health } from './recorded.mjs';

// The recorded decision of the docs' first pages (the launch facts (launch_facts.public.json), figures.recorded_decisions), as a request
// to a server on this machine. The body is indented JSON between single quotes, so no value may hold a single quote.
const curl = (body) => {
	const json = JSON.stringify(body, null, 2);
	if (json.includes("'")) throw new Error('site-blocks: a recorded request holds a single quote, which a shell block cannot carry');
	return `curl http://127.0.0.1:8000/v1/systemone \\\n  -H 'Content-Type: application/json' \\\n  -d '${json}'`;
};
const firstRequest = () => recordedRequest();
const standInStart = () => `git clone --branch ${pin.tag} https://github.com/${pin.repository}
cd decisio
uv sync --extra dev --frozen
uv run python -m decisio.serve.vllm_engine --backend hf --model Qwen/Qwen3-0.6B-Base`;

// The deploy guides: decisio's commands at the pinned release, from a clone or a package of that release.
const version = () => pin.tag.replace(/^v/, '');
const clone = () => `git clone --branch ${pin.tag} https://github.com/${pin.repository}\ncd decisio`;
// The code blocks of one section of a decisio file, in order, so a guide can show a line or a file decisio's docs give.
const sectionBlocks = (file, heading) => {
	const text = readUpstream(file);
	const start = text.indexOf(`\n## ${heading}\n`);
	if (start < 0) throw new Error(`site-blocks: ${file} has no section "${heading}"`);
	const end = text.indexOf('\n## ', start + 1);
	const body = text.slice(start, end < 0 ? undefined : end);
	return [...body.matchAll(/^```[a-z]*\n([\s\S]*?)^```$/gm)].map((m) => m[1].replace(/\n$/, ''));
};
// One line of a block, found by what it contains; the build fails when decisio's block no longer has it.
const lineOf = (block, has) => {
	const line = block.split('\n').find((l) => l.includes(has));
	if (!line) throw new Error(`site-blocks: no line with "${has}" in decisio's block`);
	return line;
};
const macStart = (has) => lineOf(sectionBlocks('docs/running.md', 'Mac with MLX')[0], has).replace(/\s+#.*$/, '');
const gpuPip = () => `python3.12 -m venv .venv && . .venv/bin/activate
pip install "decisio[serve]==${version()}"
python -m decisio.serve.vllm_engine          # serves Gemma 4 31B; the first start downloads about 31 GB
curl -s http://127.0.0.1:8000/health         # answers once it is ready`;
const dockerRun = () => `docker run -d --gpus all --shm-size 8g --restart unless-stopped \\
  -p 127.0.0.1:8000:8000 -v decisio-data:/data \\
  ${pin.image}
curl -s http://127.0.0.1:8000/health   # answers once the first start has fetched the weights`;
// decisio's compose file, run from the release image instead of a local build.
const dockerCompose = () => {
	const file = sectionBlocks('docs/operating.md', 'Docker Compose')[0];
	const built = /    build:\n(?:      .*\n)+    image: decisio:local\n/;
	if (!built.test(file)) throw new Error("site-blocks: docs/operating.md's compose file no longer builds the image it names decisio:local");
	return file.replace(built, `    image: ${pin.image}\n`);
};
// decisio's Kubernetes Deployment, with the release image in place of its placeholder.
const kubernetes = () => {
	const file = sectionBlocks('docs/operating.md', 'Kubernetes')[0];
	const placeholder = 'ghcr.io/aminry/decisio@sha256:<the digest in the release notes>';
	if (!file.includes(placeholder)) throw new Error("site-blocks: docs/operating.md's Deployment no longer has the image placeholder");
	return file.replace(placeholder, pin.image);
};

// Serve your own adapter: decisio's adapter file with choice bands (docs/running.md, "LoRA adapters"), written and checked
// by decisio's own tool; the start, a question with the adapter, the /health fields and the fit, as that section gives them.
const ADAPTER = 'my-adapter';
const adapterBlocks = () => sectionBlocks('docs/running.md', 'LoRA adapters');
const adapterFile = () => {
	const file = adapterBlocks().find((b) => b.includes('"choice_bands"')) ?? (() => { throw new Error("site-blocks: docs/running.md's LoRA adapters section has no adapter file with choice_bands"); })();
	JSON.parse(file);
	return file;
};
const adapterCheck = () => `cat > decisio_adapter.json <<'EOF'\n${adapterFile()}\nEOF\nuv run python -m decisio.serve.adapter_temperatures check decisio_adapter.json`;
const adapterStart = () => `pip install "decisio[serve]==${version()}"\npython -m decisio.serve.vllm_engine --adapter ${ADAPTER}=/models/${ADAPTER} \\\n  --adapter-temperatures ${ADAPTER}=decisio_adapter.json`;
const adapterAsk = () => `curl -s http://127.0.0.1:8000/v1/systemone -H 'Content-Type: application/json' -d '{
  "state": "I was charged twice for the same order.",
  "adapter": "${ADAPTER}",
  "questions": {"refund": {"type": "noul", "instructions": "Does the customer want a refund?"}}
}' -D - -o answer.json | grep -i '^x-decisio-adapter'`;
const adapterHealth = () => `curl -s http://127.0.0.1:8000/health \\\n  | python3 -c 'import json, sys; h = json.load(sys.stdin); print(json.dumps({k: h.get(k) for k in ("adapter_temperatures", "adapter_identity")}, indent=1))'`;
// decisio's fit line, broken before its flags so it fits the page.
const adapterFit = () => lineOf(adapterBlocks().find((b) => b.includes(' fit --reads')) ?? '', ' fit --reads').replace(/ (--out|--data) /g, ' \\\n  $1 ');

// Think when unsure: the start with thinking on, a request that asks for it, and the server's setting in /health.
const thinkStart = () => `pip install "decisio[serve]==${version()}"\npython -m decisio.serve.vllm_engine --think`;
const thinkAsk = () => `curl -s http://127.0.0.1:8000/v1/systemone -H 'Content-Type: application/json' -d '{
  "state": "Our invoice shows two seats, but we removed the second user last month.",
  "think": true,
  "questions": {"queue": {"type": "choice", "instructions": "Which team should handle this ticket?",
    "criteria": {"billing": "Invoices and charges", "access": "Logins and seats", "bug": "The product misbehaves"}}}
}' | python3 -c 'import json, sys; r = json.load(sys.stdin); print(json.dumps({"thinking": r.get("thinking"), "thinking_tokens": r["usage"].get("thinking_tokens")}, indent=1))'`;
const thinkHealth = () => `curl -s http://127.0.0.1:8000/health \\\n  | python3 -c 'import json, sys; print(json.dumps(json.load(sys.stdin)["systemone"]["think"], indent=1))'`;

// Batch concurrent requests: the start in batched mode, and the server's mode in /health.
const concurrencyStart = () => `pip install "decisio[serve]==${version()}"\npython -m decisio.serve.vllm_engine --concurrency batched`;
const concurrencyHealth = () => `curl -s http://127.0.0.1:8000/health \\\n  | python3 -c 'import json, sys; print(json.dumps(json.load(sys.stdin)["concurrency"], indent=1))'`;

// The recorded answers as the comment lines a client prints: one per question, its likeliest option and probability.
const printed = () => Object.entries(recordedResponse().answers).map(([name, a]) => {
	if (a.type === 'noul') return `${name} ${a.noul}`;
	const top = Object.entries(a.probabilities).sort((x, y) => y[1] - x[1])[0];
	return `${name} ${top[0]} ${top[1]}`;
});
const comments = (prefix) => printed().map((l) => `${prefix} ${l}`).join('\n');
const SERVED = 'decisio-gemma-4-31b-it-letters';

// docs/tasks.md's worked certificate, recorded on the pinned release on the 31B (src/lib/recorded.mjs): the registration's
// certificate, abridged to the fields decisio's own example shows (and its warnings), and two answers after it.
const certificateResponse = () => {
	const { certificate: c, status } = certificate();
	const r4 = (x) => Number(x.toFixed(4));
	const { method, holdout, fit_examples, certify_examples, disjoint } = c.split;
	return JSON.stringify({ certificate: { id: c.id, alpha: c.alpha, delta: c.delta, n: c.n, accuracy: c.accuracy, threshold: r4(c.threshold), certified: c.certified, certified_share: c.certified_share, certified_n: c.certified_n, errors_at_threshold: c.errors_at_threshold, split: { method, holdout, fit_examples, certify_examples, disjoint }, warnings: c.warnings, summary: c.summary }, status }, null, 1);
};
const certificateAnswers = () => JSON.stringify(certificate().samples.map((x) => {
	const a = x.answer;
	const r3 = (p) => Number(p.toFixed(3));
	return { ticket: x.ticket, choice: a.choice, probabilities: Object.fromEntries(Object.entries(a.probabilities).map(([k, p]) => [k, r3(p)])), certified: a.certified, certificate: a.certificate, ...(a.certified_reason ? { certified_reason: a.certified_reason } : {}) };
}), null, 1);

// The same loop in each language: the likeliest option of each answer, and its probability.
const pythonBody = () => JSON.stringify(recordedRequest(), null, 4).replace(/\n/g, '\n');
const pythonUrllib = () => `import json
import urllib.request

body = ${pythonBody()}

request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/systemone",
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request) as response:
    answers = json.load(response)["answers"]

for name, answer in answers.items():
    if answer["type"] == "noul":
        print(name, round(answer["noul"], 3))
    else:
        top = max(answer["probabilities"], key=answer["probabilities"].get)
        print(name, top, round(answer["probabilities"][top], 3))
${comments('#')}`;
const pythonSdk = () => `from typesafe_sdk import TypeSafeClient

client = TypeSafeClient(
    base_url="http://127.0.0.1:8000",
    api_key="unused",  # the SDK requires one; the server ignores it
    model="${SERVED}",  # the name GET /v1/models lists
)
body = ${pythonBody()}

response = client.system_one(state=body["state"], questions=body["questions"])

for name, answer in response.nouls.items():
    print(name, round(answer.noul, 3))
for name, answer in response.choices.items():
    print(name, answer.choice, round(answer.probabilities[answer.choice], 3))
for name, answer in response.scores.items():
    top = max(answer.probabilities, key=answer.probabilities.get)
    print(name, top, round(answer.probabilities[top], 3))
# The server's name for the model, and the tokens it counted:
print(response.model, response.usage.input_tokens)`;
const jsBody = () => JSON.stringify(recordedRequest(), null, 2);
const jsFetch = (ts) => `const body${ts ? ': { state: string; questions: Record<string, unknown> }' : ''} = ${jsBody()};

const response = await fetch("http://127.0.0.1:8000/v1/systemone", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!response.ok) throw new Error(\`\${response.status} \${await response.text()}\`);
${ts
	? 'type Answer = { type: string; noul?: number; probabilities?: Record<string, number> };\nconst { answers } = (await response.json()) as { answers: Record<string, Answer> };'
	: 'const { answers } = await response.json();'}

for (const [name, answer] of Object.entries(answers)) {
  if (answer.type === "noul") {
    console.log(name, Number(answer.noul${ts ? '!' : ''}.toFixed(3)));
  } else {
    const [top, p] = Object.entries(answer.probabilities${ts ? '!' : ''}).sort((a, b) => b[1] - a[1])[0];
    console.log(name, top, Number(p.toFixed(3)));
  }
}
${comments('//')}`;

export const siteBlocks = {
	get 'python-urllib'() { return { lang: 'python', text: pythonUrllib() }; },
	get 'python-sdk'() { return { lang: 'python', text: pythonSdk() }; },
	get 'js-fetch'() { return { lang: 'js', text: jsFetch(false) }; },
	get 'ts-fetch'() { return { lang: 'ts', text: jsFetch(true) }; },
	// The deploy guides.
	get 'gpu-pip'() { return { lang: 'bash', text: gpuPip() }; },
	get 'gpu-clone'() { return { lang: 'bash', text: `${clone()}\nuv sync --extra serve --frozen\nuv run python -m decisio.serve.vllm_engine` }; },
	get 'docker-run'() { return { lang: 'bash', text: dockerRun() }; },
	get 'docker-compose'() { return { lang: 'yaml', text: dockerCompose() }; },
	get 'docker-build'() { return { lang: 'bash', text: `${clone()}\nuv build --wheel\ndocker compose up --build` }; },
	get 'kubernetes'() { return { lang: 'yaml', text: kubernetes() }; },
	get 'adapter-check'() { return { lang: 'bash', text: adapterCheck() }; },
	get 'adapter-start'() { return { lang: 'bash', text: adapterStart() }; },
	get 'adapter-ask'() { return { lang: 'bash', text: adapterAsk() }; },
	get 'adapter-health'() { return { lang: 'bash', text: adapterHealth() }; },
	get 'adapter-fit'() { return { lang: 'bash', text: adapterFit() }; },
	get 'think-start'() { return { lang: 'bash', text: thinkStart() }; },
	get 'think-ask'() { return { lang: 'bash', text: thinkAsk() }; },
	get 'think-health'() { return { lang: 'bash', text: thinkHealth() }; },
	get 'concurrency-start'() { return { lang: 'bash', text: concurrencyStart() }; },
	get 'concurrency-health'() { return { lang: 'bash', text: concurrencyHealth() }; },
	get 'images-start'() { return { lang: 'bash', text: `pip install "decisio[serve]==${version()}"\npython -m decisio.serve.vllm_engine --base qwen3.6-35b-a3b --image-model Qwen/Qwen3.6-35B-A3B-FP8` }; },
	get 'mac-install'() { return { lang: 'bash', text: `${clone()}\nuv sync --extra mlx` }; },
	get 'mac-31b-6bit'() { return { lang: 'bash', text: macStart('gemma-4-31b-it-6bit') }; },
	get 'mac-31b-4bit'() { return { lang: 'bash', text: macStart('decisio-gemma-4-31b-mlx-4bit') }; },
	get 'mac-12b'() { return { lang: 'bash', text: macStart('gemma-4-12B-it-6bit') }; },
	// Get started: the CPU stand-in, from a clone of the pinned release.
	get 'stand-in-start'() { return { lang: 'bash', text: standInStart() }; },
	// The first pages: the recorded support ticket as a request, and its recorded answer, abridged and rounded.
	get 'first-decision-request'() { return { lang: 'sh', text: curl(firstRequest()) }; },
	get 'first-decision-response'() { return { lang: 'json', text: JSON.stringify(recordedResponse(), null, 2) }; },
	// Certify answers: the worked certificate on the pinned release, and two answers after it.
	get 'certificate-response'() { return { lang: 'json', text: certificateResponse() }; },
	// On a cloud GPU: the 31B's /health on the pinned release, trimmed to what a reader checks (src/lib/recorded.mjs).
	get 'health-31b'() { return { lang: 'json', text: JSON.stringify(health(), null, 1) }; },
	get 'certificate-answers'() { return { lang: 'json', text: certificateAnswers() }; },
	// The Qwen listing: the docs page, whose pull (at the pinned release) is this listing's alone.
	'ollama-request': { lang: 'sh', text: ollamaRequest('aminroudaki/decisio') },
	// The Gemma listing, the 16 GB laptop's: the home page's.
	'ollama-request-gemma': { lang: 'sh', text: ollamaRequest('aminroudaki/decisio-gemma') },
};

/** A site-written block by name, or an error naming the unknown one. */
export function siteBlock(name) {
	const b = siteBlocks[name];
	if (!b) throw new Error(`site-blocks: no block named "${name}"`);
	return b;
}

// The use-case recipes: each one's routing script and its registration (src/lib/use-cases.mjs).
for (const id of recipeIds) {
	Object.defineProperty(siteBlocks, `route-${id}`, { get: () => ({ lang: 'python', text: routeScript(id) }), enumerable: true });
	Object.defineProperty(siteBlocks, `teach-${id}`, { get: () => ({ lang: 'text', text: teachBody(id) }), enumerable: true });
}
