// The external-link retry rules, against a local server that answers as scripted: 5xx then fine passes and is logged
// as a retry, a persistent 5xx fails, a 4xx fails on the first try, a HEAD-refusing server is asked with GET, a
// timeout is retried, a persistent 429 is a warning.
//   node scripts/checks/external-selftest.mjs
import { createServer } from 'node:http';
import { checkExternal } from './external.mjs';

const script = {
	'/flaky': [502, 500, 200],
	'/down': [500, 502, 503],
	'/gone': [404],
	'/forbidden': [403],
	'/nohead': ['no-head', 200],
	'/slow': ['hang', 200],
	'/limited': [429],
	'/fine': [200],
};
const seen = {};
const server = createServer((req, res) => {
	const steps = script[req.url];
	const n = (seen[req.url] ??= { calls: 0, heads: 0 });
	if (req.method === 'HEAD') n.heads++;
	const i = Math.min(n.calls, steps.length - 1);
	if (req.url === '/nohead' && req.method === 'HEAD') { res.writeHead(405).end(); return; }
	n.calls++;
	const step = steps[i];
	if (step === 'hang') return; // never answers: the client times out
	if (step === 'no-head') { res.writeHead(200).end(); return; }
	res.writeHead(step).end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const opts = { delays: [20, 40], timeoutMs: 300 };
const problems = [];
const expect = (name, cond, got) => { if (!cond) problems.push(`${name}: ${JSON.stringify(got)}`); };

let r = await checkExternal(`${base}/fine`, opts);
expect('fine passes on the first try', r.ok && r.tries.length === 1, r);
r = await checkExternal(`${base}/flaky`, opts);
expect('502, 500, 200 passes after retries', r.ok && r.tries.join() === '502,500,200', r);
r = await checkExternal(`${base}/down`, opts);
expect('a persistent 5xx fails after 3 tries', !r.ok && r.tries.length === 3 && /on all 3 tries/.test(r.message), r);
r = await checkExternal(`${base}/gone`, opts);
expect('a 404 fails on the first try', !r.ok && r.tries.length === 1 && /answered 404/.test(r.message), r);
r = await checkExternal(`${base}/forbidden`, opts);
expect('a 403 on HEAD and GET fails without a retry', !r.ok && r.tries.length === 1, r);
r = await checkExternal(`${base}/slow`, opts);
expect('a timeout is retried', r.ok && r.tries[0] === 'timed out' && r.tries.length === 2, r);
r = await checkExternal(`${base}/limited`, opts);
expect('a persistent 429 is a warning', r.ok && !!r.warning && r.tries.length === 3, r);
r = await checkExternal(`${base}/nohead`, opts);
expect('a server that refuses HEAD is asked with GET', r.ok && r.tries.length === 1, r);
r = await checkExternal('http://127.0.0.1:1/never', opts);
expect('a refused connection is retried then fails', !r.ok && r.tries.length === 3, r);

server.closeAllConnections?.();
server.close();
if (problems.length) {
	console.error(`external-selftest: ${problems.length} failures\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log('external-selftest: retries on 5xx, 429 and timeouts, none on a 4xx, a warning for a persistent 429');
