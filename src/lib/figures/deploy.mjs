// The figures of the deploy guides: where the server sits on one card and in a container, and how much of a Mac's
// memory each build takes. All three are still drawings; the Mac's numbers are read from docs/running.md at the pinned
// release, so a release that changes them changes the drawing or fails the build.
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

// A box with a title and up to two lines under it.
const box = (x, y, w, h, title, lines = [], on = false) => `<rect class="f-node${on ? ' f-node--on' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>
<text class="ft ft-b" x="${x + 14}" y="${y + 24}">${esc(title)}</text>
${lines.map((l, i) => `<text class="ft ft-d" x="${x + 14}" y="${y + 44 + i * 18}">${esc(l)}</text>`).join('')}`;
const arrow = (x1, y1, x2, y2, label = '') => `<path class="f-line" d="M${x1} ${y1}L${x2} ${y2}" pathLength="1" marker-end="url(#fa)"/>${label ? `<text class="ft ft-d" x="${(x1 + x2) / 2}" y="${Math.min(y1, y2) - 8}" text-anchor="middle">${esc(label)}</text>` : ''}`;
const frame = (x, y, w, h, label) => `<rect class="f-frame" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/>
<text class="ft ft-k" x="${x + 14}" y="${y + 20}">${esc(label)}</text>`;
const defs = '<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="f-head" d="M0 0L10 5L0 10z"/></marker></defs>';
const svg = (h, inner, top = 0) => `<svg class="fig__svg" viewBox="0 ${top} 720 ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${inner}</svg>`;

/** One card: your backend, a proxy that authenticates, the server on the loopback under a restart policy, the card, the weights on disk. */
function layoutGpu() {
	const body = svg(244, `${box(12, 100, 150, 70, 'Your backend', ['your own code'])}
${arrow(162, 135, 190, 135)}
${box(190, 100, 170, 70, 'Reverse proxy', ['authenticates callers'])}
${arrow(360, 124, 400, 124)}
${frame(388, 44, 212, 142, 'Restart policy')}
${box(400, 76, 188, 96, 'decisio server', ['127.0.0.1:8000', 'exits with code 70', 'when its engine dies'], true)}
${arrow(494, 186, 494, 210)}
${box(400, 210, 188, 64, 'One NVIDIA card', ['runs the engine'])}
${box(190, 210, 170, 64, 'Disk', ['the weights, fetched once'])}
${arrow(360, 242, 400, 242)}`, 36);
	return panel({
		name: 'layout-gpu', label: 'On one card', title: 'The server listens on the machine itself; a proxy in front lets your backend in.',
		desc: 'Your backend calls a reverse proxy that authenticates callers, since decisio has no authentication. The proxy passes requests to the decisio server on 127.0.0.1:8000, which runs under a restart policy and exits with code 70 when its engine dies. Its engine runs on one NVIDIA card, from weights on disk, fetched once.',
		body, legend: 'The proxy and the restart policy are yours; the steps below have a systemd unit and a Kubernetes Deployment.',
	});
}

/** A container: the published port on the loopback, the server inside, the weights in a volume, the card through the toolkit. */
function layoutDocker() {
	const body = svg(244, `${box(12, 100, 150, 70, 'Your backend', ['through your proxy'])}
${arrow(162, 124, 400, 124, 'port 8000, on 127.0.0.1')}
${frame(388, 44, 212, 142, 'Container')}
${box(400, 76, 188, 96, 'decisio server', ['the release image,', 'pinned by digest,', 'as a non-root user'], true)}
${arrow(494, 186, 494, 210)}
${box(400, 210, 188, 64, 'One NVIDIA card', ['seen through the toolkit'])}
${box(190, 210, 170, 64, 'Volume decisio-data', ['at /data: the weights'])}
${arrow(360, 228, 400, 170)}`, 36);
	return panel({
		name: 'layout-docker', label: 'In a container', title: 'The image holds the server; the weights live in a volume.',
		desc: 'Your backend reaches the container on port 8000, published on 127.0.0.1 only. Inside, the decisio server runs from the release image, pinned by digest, as a non-root user, and sees one NVIDIA card through the NVIDIA Container Toolkit. The weights live in the decisio-data volume at /data, never in the image, so a restart fetches nothing again.',
		body, legend: 'Docker restarts the container when the server exits; the weights stay in the volume.',
	});
}

// The number after a phrase in docs/running.md, or the build fails naming the phrase.
const read = (text, re, what) => {
	const m = re.exec(text);
	if (!m) throw new Error(`docs-figures: docs/running.md no longer says ${what}`);
	return m.slice(1);
};

/** Each Mac build's weights and peak against the memory of the Mac it is for, from docs/running.md. */
export function macBuilds() {
	const run = readUpstream('docs/running.md');
	const [w31] = read(run, /\(26\.1 GB to download, ([\d.]+) GB of weights in memory\)/, "the 31B 6-bit build's weights");
	const [, , p31] = read(run, /It peaks at ([\d.]+), ([\d.]+) and ([\d.]+) GB at about 8k, 16k and 32k tokens of state, against/, "the 31B 6-bit build's peaks");
	const [w31q] = read(run, /group size 32, ([\d.]+) GB of weights/, "the 31B 4-bit build's weights");
	const [, , p31q] = read(run, /The 4-bit conversion peaks at ([\d.]+), ([\d.]+) and ([\d.]+) GB/, "the 31B 4-bit build's peaks");
	const [w12, p12] = read(run, /holds ([\d.]+) GB of weights and peaks at ([\d.]+) GB at 32,687 tokens/, "the 12B 6-bit build's weights and peak");
	const [pOl] = read(run, /a [\d.]+ GB download and takes ([\d.]+) GB in Ollama/, "the Ollama listing's memory");
	return [
		{ mac: 64, build: 'Gemma 4 31B, 6-bit', weights: w31, peak: p31, at: 'at about 32k tokens' },
		{ mac: 48, build: 'Gemma 4 31B, 4-bit', weights: w31q, peak: p31q, at: 'at about 32k tokens, read on 64 GB' },
		{ mac: 32, build: 'Gemma 4 12B, 6-bit', weights: w12, peak: p12, at: 'at 32,687 tokens' },
		{ mac: 16, build: 'Gemma 4 12B on Ollama', weights: null, peak: pOl, at: 'in Ollama, at 8,192 tokens' },
	];
}

function macMemory() {
	const rows = macBuilds();
	const x0 = 200;
	const scale = 470 / 64;
	const body = svg(56 + rows.length * 62, rows.map((r, i) => {
		const y = 36 + i * 62;
		const track = r.mac * scale;
		return `<text class="ft ft-b" x="12" y="${y + 14}">${r.mac} GB Mac</text>
<text class="ft ft-d" x="12" y="${y + 32}">${esc(r.build)}</text>
<rect class="f-rail" x="${x0}" y="${y}" width="${track}" height="22" rx="4"/>
<rect class="f-bar f-bar--grey" x="${x0}" y="${y}" width="${Number(r.peak) * scale}" height="22" rx="4"/>
${r.weights ? `<rect class="f-bar" x="${x0}" y="${y}" width="${Number(r.weights) * scale}" height="22" rx="4"/>` : ''}
<text class="ft ft-s" x="${x0}" y="${y + 40}">${r.weights ? `${r.weights} GB of weights; ` : ''}${r.peak} GB at its peak, ${esc(r.at)}</text>`;
	}).join('\n') + `\n<text class="ft ft-d" x="${x0}" y="20">The Mac's memory, to scale</text>`);
	return panel({
		name: 'mac-memory', label: 'Memory on a Mac', title: 'Each build fits the Mac it is for, with room left for the system.',
		desc: rows.map((r) => `${r.mac} GB Mac, ${r.build}: ${r.weights ? `${r.weights} GB of weights, ` : ''}${r.peak} GB at its peak ${r.at}.`).join(' '),
		body, legend: 'The accent part is the weights, the grey part the rest of the peak while reading a long text, and the track the Mac\'s whole memory. Measured on one Apple M5 Pro with 64 GB.',
		source: 'Source: docs/running.md of the pinned release.',
	});
}


/** The same server everywhere, on four engines: each panel names its engine and links its guide. */
function layouts() {
	const panels = [
		{ title: 'One NVIDIA card', engine: 'stock vLLM with decisio\'s plugin', href: '/docs/deploy/cloud-gpu/', guide: 'On a cloud GPU' },
		{ title: 'Docker', engine: 'vLLM\'s release image with decisio inside', href: '/docs/deploy/docker/', guide: 'With Docker' },
		{ title: 'A Mac', engine: 'MLX, from an MLX build of the model', href: '/docs/deploy/mac/', guide: 'On a Mac or a laptop' },
		{ title: 'Any machine, for development', engine: 'a small model on the CPU', href: '/docs/deploy/development/', guide: 'For development' },
	];
	const body = `<ul class="fig__cards fig__cards--wide">${panels.map((p) => `<li><a class="fig__card" href="${p.href}"><b>${esc(p.title)}</b><span>${esc(p.engine)}</span><span class="fig__go">${esc(p.guide)}</span></a></li>`).join('')}</ul>`;
	return panel({
		name: 'layouts', label: 'Where it runs', title: 'The same server and the same routes everywhere; only the engine under it changes.',
		desc: `The same decisio server and routes on four engines: ${panels.map((p) => `${p.title}, ${p.engine}`).join('; ')}. Each links to its deploy guide.`,
		body, interactive: true, legend: 'Each panel links to its guide.',
	});
}

export const deployFigures = {
	'layout-gpu': layoutGpu,
	'layout-docker': layoutDocker,
	'mac-memory': macMemory,
	layouts,
};
