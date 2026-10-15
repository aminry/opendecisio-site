// Fails the build when a docs page did not render. Starlight logs a page that
// fails to render (a renamed upstream heading, an unchecked code block) and
// leaves it out, so without this a release could drop a page silently.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';

const content = 'src/content/docs';
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [join(dir, e.name)] : []));
const missing = walk(content)
	.map((file) => relative(content, file).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, ''))
	.filter((route) => {
		const page = join('dist', route, 'index.html');
		if (!existsSync(page)) return true;
		// A page that failed to render keeps its title and has an empty body.
		const body = parse(readFileSync(page, 'utf8')).querySelector('.sl-markdown-content')?.textContent ?? '';
		return body.trim().length < 40;
	});
if (missing.length) {
	console.error(`pages: these docs pages did not render; the build log above says why:\n${missing.map((r) => `  /${r}/`).join('\n')}`);
	process.exit(1);
}
console.log('pages: every docs page rendered');
