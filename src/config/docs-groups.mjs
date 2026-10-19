// A page marked `legacy: true` has not yet been rewritten to the docs' page pattern (scripts/checks/docs-pattern.mjs); every
// other page must follow it: a figure at the top, a TL;DR with its commands, a "What next" list, reading time and date.
// A page with a `shape` (`guide` or `reference`) follows the rewrite's page shapes in docs/STYLE_GUIDE.md instead.
// The docs' groups, in the order of the sidebar, the llms.txt index and the group pages' links, as the rewrite's
// structure has them (docs/STYLE_GUIDE.md): Get started, Use cases, How-to guides, Reference, How it works.
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
		label: 'Use cases',
		items: [
			{ slug: 'docs/use-cases', label: 'Use cases', shape: 'guide' },
			{ slug: 'docs/use-cases/support-routing', label: 'Support routing', shape: 'guide' },
			{ slug: 'docs/use-cases/gatekeeper', label: 'Coding-agent gatekeeper', shape: 'guide' },
			{ slug: 'docs/use-cases/issue-triage', label: 'Issue triage', shape: 'guide' },
			{ slug: 'docs/use-cases/guardrails', label: 'Guardrails', shape: 'guide' },
			{ slug: 'docs/use-cases/rag-gate', label: 'RAG: answer or abstain', shape: 'guide' },
			{ slug: 'docs/use-cases/document-classification', label: 'Document classification', shape: 'guide' },
		],
	},
	{
		label: 'How-to guides',
		items: [
			{ slug: 'docs/deploy/cloud-gpu', label: 'On a cloud GPU', shape: 'guide' },
			{ slug: 'docs/deploy/docker', label: 'With Docker', shape: 'guide' },
			{ slug: 'docs/deploy/mac', label: 'On a Mac or a laptop', shape: 'guide' },
			{ slug: 'docs/deploy/development', label: 'For development (CPU)', shape: 'guide' },
			{ slug: 'docs/tasks', label: 'Teach a task', shape: 'guide' },
			{ slug: 'docs/tasks/certify', label: 'Certify answers', shape: 'guide' },
			{ slug: 'docs/tasks/drift', label: 'Watch for drift', shape: 'guide' },
			{ slug: 'docs/scale', label: 'Scale', shape: 'guide' },
			{ slug: 'docs/operating', label: 'Operate', shape: 'guide' },
			{ slug: 'docs/upgrading', label: 'Upgrade', shape: 'guide' },
			{ slug: 'docs/troubleshooting', label: 'Troubleshoot', shape: 'guide' },
			{ slug: 'docs/images', label: 'Ask about images', shape: 'guide' },
		],
	},
	{
		label: 'Reference',
		items: [
			{ slug: 'docs/api', label: 'HTTP API', shape: 'reference' },
			{ slug: 'docs/flags', label: 'Server flags', shape: 'reference' },
			{ slug: 'docs/bases', label: 'Choosing a model', shape: 'reference' },
			{ slug: 'docs/limits', label: 'Requirements and limits', shape: 'reference' },
			{ slug: 'docs/glossary', shape: 'reference' },
			{ slug: 'docs/releases', label: 'Release notes', shape: 'reference' },
			{ slug: 'docs/upgrade-notes', label: 'Upgrade notes', shape: 'reference' },
			{ slug: 'docs/evaluation-card', label: 'Evaluation card', shape: 'reference' },
			{ slug: 'docs/faq', label: 'Questions' },
		],
	},
	{
		label: 'How it works',
		items: [
			{ slug: 'docs/how-it-works', label: 'How it works', shape: 'guide' },
		],
	},
];

/** The group a docs page (by slug, "docs/api") belongs to, and the pages around it in sidebar order. */
export const docsOrder = docsGroups.flatMap((g) => g.items.map((i) => ({ group: g.label, slug: i.slug })));
export const groupOf = (slug) => docsOrder.find((p) => p.slug === slug.replace(/^\/|\/$/g, ''))?.group;
