// A page marked `legacy: true` has not yet been rewritten to the docs' page pattern (scripts/checks/docs-pattern.mjs); every
// other page must follow it: a figure at the top, a TL;DR with its commands, a "What next" list, reading time and date.
// A page with a `shape` (`guide` or `reference`) follows the rewrite's page shapes in docs/STYLE_GUIDE.md instead.
// The docs' groups, in the order of the sidebar, the llms.txt index and the group pages' links, as the rewrite's
// structure has them (docs/STYLE_GUIDE.md): Get started, How-to guides, Reference, How it works; Use cases joins when
// its first page does.
export const docsGroups = [
	{
		label: 'Get started',
		items: [
			{ slug: 'docs', label: 'Get started', shape: 'guide' },
			{ slug: 'docs/use-from', label: 'Call it from your code', shape: 'guide' },
			{ slug: 'docs/migrating', label: 'Move from System One', shape: 'guide' },
		],
	},
	{
		label: 'How-to guides',
		items: [
			{ slug: 'docs/quickstart/gpu-server' },
			{ slug: 'docs/quickstart/docker' },
			{ slug: 'docs/quickstart/mac-mlx' },
			{ slug: 'docs/quickstart/ollama' },
			{ slug: 'docs/quickstart/cpu-stand-in' },
			{ slug: 'docs/tasks', label: 'Teach it your question' },
			{ slug: 'docs/guides/probability', label: 'Use the probability' },
			{ slug: 'docs/guides/many-questions', label: 'Many questions about one text' },
			{ slug: 'docs/guides/latency', label: 'Make it fast' },
			{ slug: 'docs/guides/long-and-wide', label: 'Long documents and many options' },
			{ slug: 'docs/guides/images', label: 'Images' },
			{ slug: 'docs/operating' },
			{ slug: 'docs/health', label: 'Health and monitoring' },
			{ slug: 'docs/upgrading' },
			{ slug: 'docs/troubleshooting' },
		],
	},
	{
		label: 'Reference',
		items: [
			{ slug: 'docs/api', label: 'HTTP API' },
			{ slug: 'docs/flags' },
			{ slug: 'docs/bases' },
			{ slug: 'docs/limits' },
			{ slug: 'docs/glossary', shape: 'reference' },
			{ slug: 'docs/releases' },
			{ slug: 'docs/evaluation-card' },
			{ slug: 'docs/comparison' },
			{ slug: 'docs/faq', label: 'Questions' },
		],
	},
	{
		label: 'How it works',
		items: [
			{ slug: 'docs/how-it-works' },
			{ slug: 'docs/probability', label: 'What the probability means' },
			{ slug: 'docs/repeatability' },
			{ slug: 'docs/demos', legacy: true },
		],
	},
];

/** The group a docs page (by slug, "docs/api") belongs to, and the pages around it in sidebar order. */
export const docsOrder = docsGroups.flatMap((g) => g.items.map((i) => ({ group: g.label, slug: i.slug })));
export const groupOf = (slug) => docsOrder.find((p) => p.slug === slug.replace(/^\/|\/$/g, ''))?.group;
