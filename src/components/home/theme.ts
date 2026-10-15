// Keeps the site's theme select in step with Starlight's storage: '' means
// auto, 'light' and 'dark' are explicit choices.
type Theme = 'auto' | 'light' | 'dark';
const key = 'starlight-theme';
const system = () => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
const stored = (): Theme => {
	const v = localStorage.getItem(key);
	return v === 'light' || v === 'dark' ? v : 'auto';
};
function apply(theme: Theme) {
	document.documentElement.dataset.theme = theme === 'auto' ? system() : theme;
	localStorage.setItem(key, theme === 'auto' ? '' : theme);
	document.querySelectorAll<HTMLSelectElement>('[data-theme-select]').forEach((s) => (s.value = theme));
}
apply(stored());
document.querySelectorAll<HTMLSelectElement>('[data-theme-select]').forEach((s) =>
	s.addEventListener('change', () => apply(s.value as Theme)),
);
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
	if (stored() === 'auto') apply('auto');
});

// The menu button below 48rem: it opens and closes the navigation, which stays open without scripts.
const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
if (toggle) {
	toggle.hidden = false;
	const header = toggle.closest('.site-header');
	toggle.addEventListener('click', () => {
		const open = toggle.getAttribute('aria-expanded') !== 'true';
		toggle.setAttribute('aria-expanded', String(open));
		header?.classList.toggle('is-open', open);
	});
}
