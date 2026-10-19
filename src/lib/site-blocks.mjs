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

// The recorded answers as the comment lines a client prints: one per question, its likeliest option and probability.
const printed = () => Object.entries(recordedResponse().answers).map(([name, a]) => {
	if (a.type === 'noul') return `${name} ${a.noul}`;
	const top = Object.entries(a.probabilities).sort((x, y) => y[1] - x[1])[0];
	return `${name} ${top[0]} ${top[1]}`;
});
const comments = (prefix) => printed().map((l) => `${prefix} ${l}`).join('\n');
const SERVED = 'decisio-gemma-4-31b-it-letters';

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
	get 'images-start'() { return { lang: 'bash', text: `pip install "decisio[serve]==${version()}"\npython -m decisio.serve.vllm_engine --base qwen3.6-35b-a3b --image-model Qwen/Qwen3.6-35B-A3B-FP8 \\\n  --gpu-memory-utilization 0.47 --image-gpu-memory-utilization 0.49` }; },
	get 'mac-install'() { return { lang: 'bash', text: `${clone()}\nuv sync --extra mlx` }; },
	get 'mac-31b-6bit'() { return { lang: 'bash', text: macStart('gemma-4-31b-it-6bit') }; },
	get 'mac-31b-4bit'() { return { lang: 'bash', text: macStart('decisio-gemma-4-31b-mlx-4bit') }; },
	get 'mac-12b'() { return { lang: 'bash', text: macStart('gemma-4-12B-it-6bit') }; },
	// Get started: the CPU stand-in, from a clone of the pinned release.
	get 'stand-in-start'() { return { lang: 'bash', text: standInStart() }; },
	// The first pages: the recorded support ticket as a request, and its recorded answer, abridged and rounded.
	get 'first-decision-request'() { return { lang: 'sh', text: curl(firstRequest()) }; },
	get 'first-decision-response'() { return { lang: 'json', text: JSON.stringify(recordedResponse(), null, 2) }; },
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
