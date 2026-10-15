// Writes dist/llms.txt (an index of the docs by group, for language models: llmstxt.org) and dist/llms-full.txt (the
// docs pages' text as Markdown), from the built pages, so they carry exactly what a reader sees.
// Run by scripts/build.mjs after the build; checked by scripts/checks/llms.mjs.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { docsGroups } from '../src/config/docs-groups.mjs';
import { site } from '../src/config/site.ts';
import { pin } from '../src/lib/upstream.mjs';

const abs = (p) => new URL(p, site.url).href;
const decode = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&');
const strip = (t) => decode(t.replace(/<[^>]+>/g, ''));
// node-html-parser keeps a <pre>'s content raw and drops an SVG's <title> and <desc>, so both are turned into plain
// text in the page's HTML first: a code frame into its lines in a fenced block, a diagram into a bracketed description.
function prep(html) {
	const lines = (inner) => inner.split('<div class="ec-line">').slice(1).map(strip).join('\n') || strip(inner);
	return html
		.replace(/<figure class="dg-fig">.*?<title[^>]*>(.*?)<\/title><desc[^>]*>(.*?)<\/desc>.*?<\/figure>/gs, (_, t, d) => `<p>[Diagram: ${strip(t)}. ${strip(d)}]</p>`)
		.replace(/<figure class="fig [^"]*"[^>]*>.*?<\/figure>/gs, (all) => `<p>[Figure: ${strip(/class="fig__title">(.*?)<\/p>/s.exec(all)?.[1] ?? '')} ${strip(/aria-label="([^"]*)"/.exec(all)?.[1] ?? '')}]</p>`)
		.replace(/<pre\b[^>]*>(.*?)<\/pre>/gs, (_, inner) => `<p>\u0000FENCE${Buffer.from(lines(inner)).toString('base64')}\u0000</p>`);
}
const pageFile = (slug) => `dist/${slug}/index.html`;

// A built page's content as Markdown: headings, paragraphs, lists, code, tables, links and the diagrams' descriptions.
function md(node, ctx = { list: 0 }) {
	if (node.nodeType === 3) return node.rawText.replace(/\s+/g, ' ');
	const tag = node.tagName?.toLowerCase();
	if (!tag) return [...node.childNodes].map((c) => md(c, ctx)).join('');
	if (['script', 'style', 'button', 'nav'].includes(tag) || node.classList?.contains('sr-only') && tag !== 'caption' || node.classList?.contains('copy') || node.classList?.contains('header-link-label')) return '';
	const kids = () => [...node.childNodes].map((c) => md(c, ctx)).join('');
	const h = /^h([1-6])$/.exec(tag);
	if (h) return `\n\n${'#'.repeat(Number(h[1]))} ${kids().trim()}\n\n`;
	switch (tag) {
		case 'p': return `\n\n${kids().trim()}\n\n`;
		case 'br': return '\n';
		case 'strong': case 'b': return `**${kids().trim()}**`;
		case 'em': case 'i': return `*${kids().trim()}*`;
		case 'code': return node.parentNode?.tagName?.toLowerCase() === 'pre' ? node.text : `\`${node.text}\``;
		case 'a': { const href = node.getAttribute('href'); return href && !href.startsWith('#') ? `[${kids().trim()}](${href.startsWith('/') ? abs(href) : href})` : kids(); }
		case 'pre': return `\n\n\`\`\`\n${[...node.querySelectorAll('.ec-line')].map((l) => l.text).join('\n') || node.text}\n\`\`\`\n\n`;
		case 'ul': case 'ol': return `\n\n${[...node.childNodes].filter((c) => c.tagName?.toLowerCase() === 'li').map((li, i) => `${tag === 'ol' ? `${i + 1}.` : '-'} ${md(li, ctx).trim().replace(/\n\n+/g, '\n  ')}`).join('\n')}\n\n`;
		case 'table': {
			const rows = node.querySelectorAll('tr').map((tr) => tr.querySelectorAll('th, td').map((c) => md(c, ctx).trim().replace(/\|/g, '\\|').replace(/\n+/g, ' ')));
			if (!rows.length) return '';
			return `\n\n| ${rows[0].join(' | ')} |\n| ${rows[0].map(() => '---').join(' | ')} |\n${rows.slice(1).map((r) => `| ${r.join(' | ')} |`).join('\n')}\n\n`;
		}
		case 'svg': return ''; // icons; the diagrams were turned into text by prep()
		case 'blockquote': return `\n\n${kids().trim().split('\n').map((l) => `> ${l}`).join('\n')}\n\n`;
		default: return kids();
	}
}

const pages = docsGroups.flatMap((g) => g.items.map((i) => ({ group: g.label, slug: i.slug })));
const index = [`# ${site.name}`, '', `> Typed one-pass decisions from a frozen open model, in the System One wire format. This index is of the docs for ${pin.tag}; ${abs('/llms-full.txt')} has their text.`, ''];
const full = [`# ${site.name} documentation, ${pin.tag}`, ''];
let current = '';
for (const { group, slug } of pages) {
	if (!existsSync(pageFile(slug))) throw new Error(`llms: the sidebar names ${slug}, which was not built`);
	const doc = parse(prep(readFileSync(pageFile(slug), 'utf8')));
	const title = doc.querySelector('h1')?.text.trim() ?? slug;
	const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
	if (group !== current) { if (current) index.push(''); index.push(`## ${group}`, ''); current = group; }
	index.push(`- [${title}](${abs(`/${slug}/`)}): ${description}`);
	const content = doc.querySelector('.sl-markdown-content');
	if (!content) throw new Error(`llms: ${slug} has no .sl-markdown-content`);
	const body = md(content).replace(/\u0000FENCE([A-Za-z0-9+/=]*)\u0000/g, (_, b) => `\n\n\`\`\`\n${Buffer.from(b, 'base64').toString()}\n\`\`\`\n\n`).replace(/\n{3,}/g, '\n\n').trim();
	full.push(`## ${title}`, '', `Source: ${abs(`/${slug}/`)}`, '', body, '');
	// The page on its own as Markdown, at its address with index.md: the footer's "View as Markdown".
	writeFileSync(`dist/${slug}/index.md`, `# ${title}\n\n${description ? `> ${description}\n\n` : ''}Source: ${abs(`/${slug}/`)}\n\n${body}\n`);
}
index.push('', '## Elsewhere', '', `- [Benchmarks](${abs('/benchmarks/')}): the measured figures behind the claims.`, `- [Source code](${site.repository}): ${site.licence}.`, '');
writeFileSync('dist/llms.txt', index.join('\n'));
writeFileSync('dist/llms-full.txt', `${full.join('\n').replace(/\n{3,}/g, '\n\n')}\n`);
console.log(`llms: ${pages.length} pages in llms.txt and llms-full.txt`);
