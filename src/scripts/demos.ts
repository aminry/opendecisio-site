// The demos page's cards: a chip for each scene and each base picks the one clip shown, the default base first.
// Without scripts every clip of a card is shown, one under another, and the chips stay hidden. A clip that is
// hidden is not in view, so src/components/home/clips.ts pauses it and plays the one shown, as it does on scroll.
for (const card of document.querySelectorAll<HTMLElement>('[data-demo]')) {
	const takes = [...card.querySelectorAll<HTMLElement>('.demo-card__take')];
	const scenes = [...card.querySelectorAll<HTMLButtonElement>('[data-takes="scene"] button')];
	const bases = [...card.querySelectorAll<HTMLButtonElement>('[data-takes="base"] button')];
	const baseRow = card.querySelector<HTMLElement>('[data-takes="base"]');
	const sceneRow = card.querySelector<HTMLElement>('[data-takes="scene"]');
	let scene = '0';
	let base = bases.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.base ?? '';
	const show = () => {
		const here = takes.filter((t) => t.dataset.scene === scene);
		const perBase = here.some((t) => t.dataset.base);
		for (const t of takes) t.hidden = !(t.dataset.scene === scene && (!perBase || t.dataset.base === base));
		if (baseRow) baseRow.hidden = !perBase;
		scenes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scene === scene)));
		bases.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.base === base)));
	};
	scenes.forEach((b) => b.addEventListener('click', () => { scene = b.dataset.scene!; show(); }));
	bases.forEach((b) => b.addEventListener('click', () => { base = b.dataset.base!; show(); }));
	if (sceneRow) sceneRow.hidden = false;
	show();
}
