// Structured data for every page: a breadcrumb trail from the home page, and
// for docs pages a TechArticle naming the release it documents.
import { site } from '../config/site.ts';
import { pin } from './upstream.mjs';

const abs = (path) => new URL(path, site.url).href;

export function breadcrumbs(trail) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [{ name: site.name, path: '/' }, ...trail].map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path) })),
	};
}

export function techArticle({ title, description, path }) {
	return {
		'@context': 'https://schema.org',
		'@type': 'TechArticle',
		headline: title,
		description,
		url: abs(path),
		inLanguage: 'en',
		isPartOf: { '@type': 'WebSite', name: site.name, url: site.url },
		about: { '@type': 'SoftwareSourceCode', name: site.name, codeRepository: site.repository, version: pin.tag.replace(/^v/, '') },
	};
}
