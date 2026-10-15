import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Articles and news posts: Markdown files with front matter (docs/POSTS.md, templates in docs/templates/).
const dated = { title: z.string().min(8).max(110), date: z.coerce.date(), tags: z.array(z.string()).default([]) };

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Longer pieces. A piece first published elsewhere (Medium) names its original in `canonical`, and the page's
	// canonical link points there so search engines see one copy; a piece first published here has no `canonical`.
	articles: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
		schema: z.object({
			...dated,
			description: z.string().min(40).max(200),
			author: z.string().default('Amin Roudaki'),
			canonical: z.string().url().optional(),
			originalSite: z.string().optional(),
		}).refine((d) => !d.canonical || d.originalSite, { message: 'a republished piece names where it first appeared in originalSite', path: ['originalSite'] }),
	}),
	// Short announcements, in the template docs/templates/news-post.md.
	news: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
		schema: z.object({ ...dated, summary: z.string().min(40).max(200) }),
	}),
};
