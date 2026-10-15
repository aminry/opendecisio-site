// @ts-check
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeTables from './src/lib/rehype-tables.mjs';
import rehypeThemedImages from './src/lib/rehype-themed-images.mjs';
import remarkUpstream from './src/lib/remark-upstream.mjs';
import { docsGroups } from './src/config/docs-groups.mjs';
import { socialImage } from './src/lib/social.mjs';
import { site } from './src/config/site.ts';

const social = socialImage();
const socialTags = social
	? [
			{ tag: 'meta', attrs: { property: 'og:image', content: social.url } },
			{ tag: 'meta', attrs: { property: 'og:image:width', content: String(social.width) } },
			{ tag: 'meta', attrs: { property: 'og:image:height', content: String(social.height) } },
			{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
		]
	: [];

export default defineConfig({
	site: site.url,
	trailingSlash: 'always',
	markdown: { remarkPlugins: [remarkUpstream], rehypePlugins: [rehypeTables, rehypeThemedImages] },
	// Self-hosted from the fontsource packages, preloaded, each with a fallback
	// adjusted to its metrics, so text does not move when the font arrives. The
	// fallbacks are Arial and Courier New because every system has them or a
	// metric-compatible twin (Liberation on Linux), so the adjustment holds.
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Geist',
			cssVariable: '--font-geist',
			fallbacks: ['Arial', 'sans-serif'],
			options: { variants: [{ weight: '100 900', style: 'normal', src: ['./node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'] }] },
		},
		{
			provider: fontProviders.local(),
			name: 'Geist Mono',
			cssVariable: '--font-geist-mono',
			fallbacks: ['Courier New', 'monospace'],
			options: { variants: [{ weight: '100 900', style: 'normal', src: ['./node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'] }] },
		},
	],
	integrations: [
		starlight({
			title: site.name,
			description: 'Typed one-pass decisions from a frozen open model, in the System One wire format.',
			logo: { light: './src/assets/mark-light.svg', dark: './src/assets/mark-dark.svg', alt: '' },
			favicon: '/favicon.svg',
			// Each page shows the date it last changed (from git), beside its reading time.
			lastUpdated: true,
			// The 404 is the site's own page (src/pages/404.astro), not the docs' frame with a search bar.
			disable404Route: true,
			customCss: ['./src/styles/tokens.css', './src/styles/docs.css'],
			components: {
				Head: './src/components/starlight/Head.astro',
				Header: './src/components/starlight/Header.astro',
				PageTitle: './src/components/starlight/PageTitle.astro',
				Footer: './src/components/starlight/Footer.astro',
				MobileMenuFooter: './src/components/starlight/MobileMenuFooter.astro',
			},
			head: socialTags,
			// One frame for every code block: a plain panel with its copy button.
			// A code block scrolls its long lines sideways and never breaks one inside a word or a path.
			expressiveCode: { defaultProps: { frame: 'code', wrap: false, preserveIndent: true } },
			sidebar: docsGroups.map((g) => ({ ...g, items: g.items.map(({ legacy, ...item }) => item) })),
		}),
		sitemap(),
	],
});
