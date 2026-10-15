// The site's main navigation, shared by the site's pages and the docs header.
import { site } from './site.ts';

export const nav = [
	{ href: '/docs/', label: 'Docs' },
	{ href: '/benchmarks/', label: 'Benchmarks' },
	{ href: '/demos/', label: 'Demos' },
	{ href: '/articles/', label: 'Articles' },
	{ href: '/news/', label: 'News' },
	{ href: site.repository, label: 'GitHub' },
];
