// The site build: fetch the pinned release, build with Astro, and stop on any
// error Astro logs. Astro reports a docs page that fails to render and goes on,
// leaving the page empty, so a build that logged an error must not pass.
import { spawn } from 'node:child_process';

const run = (cmd, args) =>
	new Promise((resolve) => {
		let errors = 0;
		const child = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'] });
		for (const stream of [child.stdout, child.stderr]) {
			stream.on('data', (chunk) => {
				const text = chunk.toString();
				if (/\[ERROR\]/.test(text)) errors++;
				(stream === child.stdout ? process.stdout : process.stderr).write(chunk);
			});
		}
		child.on('close', (code) => resolve({ code, errors }));
	});

for (const [cmd, args] of [
	['node', ['scripts/fetch-upstream.mjs']],
	['npx', ['astro', 'build', '--force']],
	['node', ['scripts/charts.mjs']],
	['node', ['scripts/checks/pages.mjs']],
	['node', ['scripts/llms.mjs']],
	['node', ['scripts/inline-styles.mjs']],
	['node', ['scripts/headers.mjs']],
]) {
	const { code, errors } = await run(cmd, args);
	if (code !== 0 || errors) {
		console.error(`build: ${[cmd, ...args].join(' ')} ${code !== 0 ? `exited ${code}` : `logged ${errors} error${errors > 1 ? 's' : ''}`}; the build fails`);
		process.exit(1);
	}
}
