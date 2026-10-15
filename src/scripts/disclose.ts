// A link to something inside a closed disclosure opens the disclosure, so the reader lands on it: on load with a
// fragment, and on every in-page link followed after.
const open = (id: string) => {
	const target = id ? document.getElementById(decodeURIComponent(id)) : null;
	for (let d = target?.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
};
open(location.hash.slice(1));
window.addEventListener('hashchange', () => open(location.hash.slice(1)));
document.addEventListener('click', (e) => {
	const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
	if (a) open(a.getAttribute('href')!.slice(1));
});
