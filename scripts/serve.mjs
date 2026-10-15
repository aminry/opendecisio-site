// Serves dist/ as Cloudflare's static assets would: the headers of
// dist/_headers, a trailing slash added to directory paths, 404.html for
// anything else, and text compressed with brotli or gzip. For the browser checks and for looking at a build locally.
//   node scripts/serve.mjs [port]
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { createServer as createHttp } from 'node:http';
import { createServer as createHttps } from 'node:https';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const root = 'dist';
const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
// HOST=0.0.0.0 to look at the build from another device on your network.
const host = process.env.HOST ?? '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.pf_meta': 'application/octet-stream', '.pf_index': 'application/octet-stream', '.pf_fragment': 'application/octet-stream' };

// _headers: a path pattern on its own line, then indented "Name: value" lines.
const rules = [];
const headersFile = join(root, '_headers');
if (existsSync(headersFile)) {
	let current;
	for (const line of readFileSync(headersFile, 'utf8').split('\n')) {
		if (!line.trim()) continue;
		if (!/^\s/.test(line)) {
			current = { pattern: new RegExp('^' + line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), headers: {} };
			rules.push(current);
		} else {
			const i = line.indexOf(':');
			current.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
		}
	}
}

function tls() {
	if (process.env.TLS_CERT && process.env.TLS_KEY) return { cert: readFileSync(process.env.TLS_CERT), key: readFileSync(process.env.TLS_KEY) };
	const dir = mkdtempSync(join(tmpdir(), 'serve-tls-'));
	execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem')], { stdio: 'ignore' });
	return { cert: readFileSync(join(dir, 'cert.pem')), key: readFileSync(join(dir, 'key.pem')) };
}

const plain = process.env.PLAIN_HTTP === '1';
// A request that fails (a file gone mid-rebuild) is answered 500; the server keeps running.
const handler = (req, res) => {
	try {
		serveOne(req, res);
	} catch (e) {
		if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end(`serve: ${e.message}\n`);
	}
};
const serveOne = (req, res) => {
	const url = new URL(req.url, 'https://localhost');
	let path = decodeURIComponent(url.pathname);
	const file = normalize(join(root, path));
	if (!file.startsWith(root)) return res.writeHead(400).end();
	let target = file;
	if (existsSync(file) && statSync(file).isDirectory()) {
		if (!path.endsWith('/')) return res.writeHead(307, { Location: `${path}/${url.search}` }).end();
		target = join(file, 'index.html');
	}
	let status = 200;
	if (!existsSync(target)) {
		status = 404;
		target = join(root, '404.html');
	}
	for (const rule of rules) if (rule.pattern.test(path)) for (const [k, v] of Object.entries(rule.headers)) res.setHeader(k, v);
	res.setHeader('Content-Type', types[extname(target)] ?? 'application/octet-stream');
	const size = statSync(target).size;
	// Ranges, so video seeks work as on the real host.
	const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
	if (range && status === 200) {
		const start = range[1] ? Number(range[1]) : 0;
		const end = range[2] ? Number(range[2]) : size - 1;
		res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
		return createReadStream(target, { start, end }).pipe(res);
	}
	// Text is compressed, as Cloudflare compresses it; media and fonts are sent as they are.
	const accept = req.headers['accept-encoding'] ?? '';
	if (/^(text\/|application\/(json|xml|wasm)|image\/svg)/.test(res.getHeader('Content-Type')) && /\b(br|gzip)\b/.test(accept)) {
		const body = readFileSync(target);
		const br = /\bbr\b/.test(accept);
		const out = br ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }) : gzipSync(body);
		res.writeHead(status, { 'Content-Encoding': br ? 'br' : 'gzip', 'Content-Length': out.length, Vary: 'Accept-Encoding' });
		return res.end(out);
	}
	res.writeHead(status, { 'Content-Length': size, 'Accept-Ranges': 'bytes' });
	createReadStream(target).pipe(res);
};
(plain ? createHttp(handler) : createHttps(tls(), handler)).listen(port, host, () => console.log(`serve: dist/ on ${plain ? 'http' : 'https'}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
