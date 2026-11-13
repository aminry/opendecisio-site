import { visit } from 'unist-util-visit';

/** Make the rendered code panel scrollable from a keyboard, with or without JavaScript. */
export default function codeFocus() {
	return {
		name: 'keyboard-code-panels',
		hooks: {
			postprocessRenderedBlock: ({ renderData }) => {
				visit(renderData.blockAst, 'element', (node) => {
					if (node.tagName !== 'pre') return;
					node.properties.tabIndex ??= 0;
				});
			},
		},
	};
}
