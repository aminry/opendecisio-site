// Stopping a server the verification runner started (scripts/verify-commands.mjs), shared with its self-test
// (scripts/checks/verify-stop-selftest.mjs). The server runs in its own process group (spawned detached), so a signal to
// the group reaches the shell and everything it started.

/** Whether something answers at `url` (2 s per try). */
export async function answers(url) {
	try {
		return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
	} catch {
		return false;
	}
}

/**
 * Stops `child` and waits until it has exited: SIGTERM to its process group, then SIGKILL to the group if it is still
 * running `graceSeconds` later. A server that took longer than the runner's old 30 s to stop gracefully left port 8000
 * answering, and the next block failed with "something else answers" (2026-10-18). Returns how it ended.
 */
export async function stopAndWait(child, { graceSeconds = 20, log = () => {} } = {}) {
	if (!child || child.exitCode !== null || child.signalCode !== null) return 'not running';
	const exited = new Promise((r) => child.once('exit', r));
	const within = (ms) => Promise.race([exited.then(() => true), new Promise((r) => setTimeout(() => r(false), ms))]);
	try {
		process.kill(-child.pid, 'SIGTERM');
	} catch {}
	if (await within(graceSeconds * 1000)) return 'stopped';
	log(`the server did not stop within ${graceSeconds} s of SIGTERM; sending SIGKILL`);
	try {
		process.kill(-child.pid, 'SIGKILL');
	} catch {}
	return (await within(10000)) ? 'killed' : 'still running';
}
