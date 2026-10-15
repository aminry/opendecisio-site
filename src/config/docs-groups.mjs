// A page marked `legacy: true` has not yet been rewritten to the docs' page pattern (scripts/checks/docs-pattern.mjs); every
// other page must follow it: a figure at the top, a TL;DR with its commands, a "What next" list, reading time and date.
// The docs' four groups, in the order of the sidebar, the llms.txt index and the group pages' links:
// Start, Use it from, Run it, Understand.
export const docsGroups = [
	{ label: 'Start', items: [{ slug: 'docs', label: 'Overview' }, { slug: 'docs/quickstart', label: 'Choose your machine' }, { slug: 'docs/first-request' }] },
	{
		label: 'Use it from',
		items: [
			{ slug: 'docs/use-from', label: 'Ways in' },
			{ slug: 'docs/api', label: 'HTTP' },
			{ slug: 'docs/use-from/python', label: 'Python' },
			{ slug: 'docs/use-from/javascript', label: 'JavaScript and TypeScript' },
			{ slug: 'docs/migrating', label: 'System One clients' },
			{ slug: 'docs/use-from/frameworks', label: 'Frameworks' },
		],
	},
	{
		label: 'Guides',
		items: [
			{ slug: 'docs/guides/many-questions', label: 'Many questions about one text' },
			{ slug: 'docs/guides/latency', label: 'Make it fast' },
			{ slug: 'docs/tasks', label: 'Teach it your question' },
			{ slug: 'docs/guides/probability', label: 'Use the probability' },
			{ slug: 'docs/guides/long-and-wide', label: 'Long documents and many options' },
			{ slug: 'docs/guides/images', label: 'Images' },
		],
	},
	{
		label: 'Run it',
		items: [
			{ slug: 'docs/quickstart/gpu-server' },
			{ slug: 'docs/quickstart/docker' },
			{ slug: 'docs/quickstart/mac-mlx' },
			{ slug: 'docs/quickstart/ollama' },
			{ slug: 'docs/quickstart/cpu-stand-in' },
			{ slug: 'docs/flags' },
			{ slug: 'docs/operating' },
			{ slug: 'docs/health', label: 'Health and monitoring' },
			{ slug: 'docs/upgrading' },
			{ slug: 'docs/troubleshooting' },
		],
	},
	{
		label: 'Understand',
		items: [
			{ slug: 'docs/how-it-works' },
			{ slug: 'docs/bases' },
			{ slug: 'docs/probability', label: 'What the probability means' },
			{ slug: 'docs/repeatability' },
			{ slug: 'docs/evaluation-card' },
			{ slug: 'docs/comparison' },
			{ slug: 'docs/limits' },
			{ slug: 'docs/faq', label: 'Questions' },
			{ slug: 'docs/releases' },
			{ slug: 'docs/demos', legacy: true },
		],
	},
];

/** The group a docs page (by slug, "docs/api") belongs to, and the pages around it in sidebar order. */
export const docsOrder = docsGroups.flatMap((g) => g.items.map((i) => ({ group: g.label, slug: i.slug })));
export const groupOf = (slug) => docsOrder.find((p) => p.slug === slug.replace(/^\/|\/$/g, ''))?.group;
