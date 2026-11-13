// Catch broken shell quoting, stale downloads and HTTP failures in the tutorial commands.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { siteBlock } from '../../src/lib/site-blocks.mjs';

async function send(text, status = 200) {
	let received;
	const server = createServer(async (req, res) => {
		let body = '';
		for await (const chunk of req) body += chunk;
		received = { method: req.method, path: req.url, contentType: req.headers['content-type'], body: JSON.parse(body) };
		res.writeHead(status, { 'Content-Type': 'application/json' });
		res.end(status === 200 ? '{"answers":{}}' : '{"detail":"invalid request"}');
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	try {
		const command = text.replace('http://127.0.0.1:8000', `http://127.0.0.1:${server.address().port}`);
		const child = spawn('bash', ['-e', '-c', command], { stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		child.stdout.on('data', (chunk) => { stdout += chunk; });
		child.stderr.resume();
		const code = await new Promise((resolve, reject) => { child.on('close', resolve); child.on('error', reject); });
		return { code, received, stdout };
	} finally {
		await new Promise((resolve) => server.close(resolve));
	}
}

for (const type of ['choice', 'noul', 'score']) {
	test(`${type} tutorial sends the downloadable request as JSON`, async () => {
		const { text } = siteBlock(`question-${type}`);
		const result = await send(text);
		assert.equal(result.code, 0);
		assert.equal(result.received.method, 'POST');
		assert.equal(result.received.path, '/v1/systemone');
		assert.equal(result.received.contentType, 'application/json');
		assert.deepEqual(result.received.body, JSON.parse(readFileSync(`public/examples/questions/${type}.json`, 'utf8')));
	});
}

test('tutorial command reports a failed HTTP request as a failed command', async () => {
	const result = await send(siteBlock('question-choice').text, 422);
	assert.equal(result.code, 22);
	assert.deepEqual(JSON.parse(result.stdout), { detail: 'invalid request' });
});
