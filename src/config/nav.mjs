// The site's main navigation, shared by the site's pages and the docs header.
import { site } from './site.ts';

export const nav = [
	{ href: '/docs/', label: 'Docs' },
	{ href: '/demos/teach-and-certify/', label: 'Certified answers' },
	{ href: '/benchmarks/', label: 'Benchmarks' },
	{ href: '/demos/', label: 'Demos' },
	{ href: '/articles/', label: 'Articles' },
	{ href: '/news/', label: 'News' },
	{ href: site.repository, label: 'GitHub' },
];

/** The nav link for the page at `path`: the longest of the site's own links that the path starts with, so the
 * teach-and-certify page marks "Certified answers" and not "Demos" as well. */
export function currentHref(path) {
	return nav.filter((l) => l.href.startsWith('/') && path.startsWith(l.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
