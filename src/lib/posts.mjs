// Articles and news: the posts in date order, with the dates, URLs and feed text the pages and the feeds share.
import { getCollection } from 'astro:content';
import { site } from '../config/site.ts';

export const dateText = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
export const isoDay = (d) => d.toISOString().slice(0, 10);
export const url = (kind, id) => new URL(`/${kind}/${id}/`, site.url).href;

/** A piece first published elsewhere (it names its original in `canonical`) has no page here: it is a card that links to the original. */
export const isExternal = (entry) => Boolean(entry.data.canonical);
/** Where a post lives: its page (a path, so a link on the site is internal), or for a piece first published elsewhere, the original. */
export const where = (kind, entry) => (isExternal(entry) ? entry.data.canonical : `/${kind}/${entry.id}/`);
/** The same as an absolute address, for the feeds. */
export const whereAbsolute = (kind, entry) => (isExternal(entry) ? entry.data.canonical : url(kind, entry.id));

const esc0 = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/**
 * The note on a piece that links out, as HTML: the body's paragraphs except the first (which restates the card's own
 * summary) and the one that links to the original; text is escaped, and a [text](address) link becomes a link.
 */
export function externalNote(entry) {
	const paras = (entry.body ?? '').trim().split(/\n\s*\n/).slice(1).filter((p) => !p.includes(entry.data.canonical));
	return paras.map((p) => esc0(p.trim().replace(/\s+/g, ' ')).replace(/\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')).join(' ');
}

/** Minutes to read a post, at 200 words a minute (at least one). */
export const readingMinutes = (entry) => Math.max(1, Math.round((entry.body ?? '').split(/\s+/).filter(Boolean).length / 200));

/** Newest first. */
export async function posts(kind) {
	return (await getCollection(kind)).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** An RSS 2.0 feed of a kind of post: the title, our URL, the date and the summary of each. */
export async function feed(kind, title, blurb) {
	const items = (await posts(kind)).map((p) => `<item><title>${esc(p.data.title)}</title><link>${whereAbsolute(kind, p)}</link><guid isPermaLink="true">${whereAbsolute(kind, p)}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><description>${esc(p.data.description ?? p.data.summary)}</description></item>`);
	const self = new URL(`/${kind}/rss.xml`, site.url).href;
	return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(title)}</title><link>${new URL(`/${kind}/`, site.url).href}</link><description>${esc(blurb)}</description><language>en</language><atom:link href="${self}" rel="self" type="application/rss+xml"/>${items.join('')}</channel></rss>\n`;
}
