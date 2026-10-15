// Attaches each clip's source when it nears the viewport and plays it while it
// is in view, unless the reader prefers reduced motion; the button plays and
// pauses it, and a clip paused by the reader stays paused.
const still = window.matchMedia('(prefers-reduced-motion: reduce)');

function sync(video: HTMLVideoElement, button: HTMLButtonElement) {
	const playing = !video.paused;
	button.setAttribute('aria-pressed', String(playing));
	button.setAttribute('aria-label', playing ? button.dataset.labelPause! : button.dataset.labelPlay!);
}

function load(video: HTMLVideoElement) {
	if (!video.getAttribute('src')) video.src = video.dataset.src!;
}

const observer = new IntersectionObserver(
	(entries) => {
		for (const { target, isIntersecting } of entries) {
			const video = target as HTMLVideoElement;
			if (isIntersecting) {
				load(video);
				if (!still.matches && video.dataset.userPaused !== '1') void video.play().catch(() => {});
			} else {
				video.pause();
			}
		}
	},
	{ rootMargin: '150px 0px', threshold: 0.25 },
);

for (const frame of document.querySelectorAll<HTMLElement>('.clip')) {
	const video = frame.querySelector('video')!;
	const button = frame.querySelector<HTMLButtonElement>('.clip__toggle')!;
	// The poster image covers the video until it first plays.
	video.addEventListener('playing', () => frame.classList.add('is-started'), { once: true });
	video.addEventListener('play', () => sync(video, button));
	video.addEventListener('pause', () => sync(video, button));
	button.addEventListener('click', () => {
		load(video);
		if (video.paused) {
			video.dataset.userPaused = '0';
			void video.play();
		} else {
			video.dataset.userPaused = '1';
			video.pause();
		}
	});
	observer.observe(video);
}
