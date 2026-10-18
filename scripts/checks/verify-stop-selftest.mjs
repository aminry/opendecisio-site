// How the verification runner stops a server (scripts/server-control.mjs), against two stand-ins on a local port: one
// that stops on SIGTERM, which must end at once with no SIGKILL, and one that ignores SIGTERM, which must be waited for
// the whole grace period, then killed with SIGKILL, after which the port no longer answers. Runs in CI (about 25 s).
//   node scripts/checks/verify-stop-selftest.mjs
import { spawn } from 'node:child_process';
import { answers, stopAndWait } from '../server-control.mjs';

const GRACE = 20;
const problems = [];
const check = (ok, what) => { if (!ok) problems.push(what); };

/** A stand-in server in its own process group, as the runner starts them, answering /health on `port`. */
async function standIn(port, ignoreTerm) {
	const code = `
		${ignoreTerm ? "process.on('SIGTERM', () => {});" : ''}
		require('node:http').createServer((q, s) => s.end('ok')).listen(${port}, '127.0.0.1');`;
	const child = spawn(process.execPath, ['-e', code], { detached: true, stdio: 'ignore' });
	const url = `http://127.0.0.1:${port}/health`;
	for (let i = 0; i < 50 && !(await answers(url)); i++) await new Promise((r) => setTimeout(r, 100));
	if (!(await answers(url))) throw new Error(`verify-stop-selftest: the stand-in on ${port} did not start`);
	return { child, url };
}

// 1. A server that stops on SIGTERM: stopped at once, no SIGKILL.
{
	const { child, url } = await standIn(18731, false);
	const logs = [];
	const t0 = Date.now();
	const how = await stopAndWait(child, { graceSeconds: GRACE, log: (m) => logs.push(m) });
	const s = (Date.now() - t0) / 1000;
	check(how === 'stopped', `a server that stops on SIGTERM ended "${how}", not "stopped"`);
	check(s < 5, `a server that stops on SIGTERM took ${s.toFixed(1)} s`);
	check(!logs.some((m) => /SIGKILL/.test(m)), 'a server that stops on SIGTERM was sent SIGKILL');
	check(!(await answers(url)), 'the port still answers after a server stopped on SIGTERM');
}

// 2. A server that ignores SIGTERM: waited for the whole grace period, then SIGKILL, then the port is free.
{
	const { child, url } = await standIn(18732, true);
	const logs = [];
	const t0 = Date.now();
	const how = await stopAndWait(child, { graceSeconds: GRACE, log: (m) => logs.push(m) });
	const s = (Date.now() - t0) / 1000;
	check(how === 'killed', `a server that ignores SIGTERM ended "${how}", not "killed"`);
	check(s >= GRACE && s < GRACE + 10, `a server that ignores SIGTERM was stopped after ${s.toFixed(1)} s, not after the ${GRACE} s grace`);
	check(child.signalCode === 'SIGKILL', `a server that ignores SIGTERM ended by ${child.signalCode}, not SIGKILL`);
	check(logs.some((m) => /did not stop within 20 s of SIGTERM; sending SIGKILL/.test(m)), 'the SIGKILL was not logged');
	check(!(await answers(url)), 'the port still answers after SIGKILL');
}

if (problems.length) {
	console.error(problems.map((p) => `verify-stop-selftest: ${p}`).join('\n'));
	process.exit(1);
}
console.log(`verify-stop-selftest: a server that stops on SIGTERM is stopped at once; one that ignores it is killed after the ${GRACE} s grace and frees its port`);
