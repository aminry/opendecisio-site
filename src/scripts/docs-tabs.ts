// The docs' tabs (:::tabs in a page, built by src/lib/remark-upstream.mjs): a click or the arrow keys pick a panel.
// The buttons and panels are in the page already, and the first panel shows from the first paint, so nothing moves.
for (const box of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
	const tabs = [...box.querySelectorAll<HTMLButtonElement>(':scope > .tabs__list > [role="tab"]')];
	const pick = (k: number, focus = false) => {
		tabs.forEach((t, i) => {
			t.setAttribute('aria-selected', String(i === k));
			t.tabIndex = i === k ? 0 : -1;
			const panel = document.getElementById(t.getAttribute('aria-controls')!);
			if (panel) panel.hidden = i !== k;
		});
		if (focus) tabs[k].focus();
	};
	tabs.forEach((t, i) => {
		t.addEventListener('click', () => pick(i));
		t.addEventListener('keydown', (e) => {
			const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
			if (to === undefined) return;
			e.preventDefault();
			pick((to + tabs.length) % tabs.length, true);
		});
	});
	pick(0);
	box.classList.add('tabs--ready');
}
