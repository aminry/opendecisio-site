// The rule of the recorded-output check (scripts/checks/recorded.mjs), apart from the pages so its self-test can run it
// (scripts/checks/recorded-selftest.mjs). docs/STYLE_GUIDE.md, "Numbers"; Amin, 2026-10-19: no GPU is rented to verify
// the site, so a recorded output stays when the pin moves past the release that recorded it, as long as
//   - every page that shows it labels it with that release, the card and the date, in one label, in that order; and
//   - the release notes of every release since were read and the behaviour it shows did not change (`reviews`).
// Re-recording happens only when a training box is already up.

const minor = (v) => v.replace(/^v/, '').split('.').slice(0, 2).map(Number);
const older = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The label a page must carry for a recording made on `version` on `card` on `date`: all three, in one label. */
export const labelPattern = ({ version, card, date }) => new RegExp(`decisio\\s+v?${esc(version)}\\b[^;.]{0,80}?${esc(card)}[^;]{0,60}?${esc(date)}`);

/**
 * Judges one recorded output against the pinned release and the pages that show it. `recording` is { name, version, card,
 * date, reviews }, where reviews maps a later release tag to { changed, why } from its release notes; `pages` are
 * { route, text } of the pages that show it. Returns { problems, notes }.
 */
export function judge(recording, pinnedTag, pages) {
	const problems = [];
	const notes = [];
	const { name, version, reviews = {} } = recording;
	if (!older(minor(version), minor(pinnedTag))) return { problems, notes: [`${name}: decisio ${version}, the pinned minor`] };
	const label = labelPattern(recording);
	for (const p of pages) {
		if (!label.test(p.text)) problems.push(`${p.route}: shows ${name}, recorded on decisio ${version}, without one label naming that release, ${recording.card} and ${recording.date}`);
	}
	const review = reviews[pinnedTag];
	if (!review) problems.push(`${name}: recorded on decisio ${version}; read ${pinnedTag}'s release notes and add whether they change what it shows (src/config/recorded-outputs.mjs, reviews)`);
	for (const [tag, r] of Object.entries(reviews)) {
		if (older(minor(pinnedTag), minor(tag)) && tag !== pinnedTag) continue;
		if (r.changed) problems.push(`${name}: ${tag} changed what it shows (${r.why}); record it again, or take it off the pages`);
	}
	if (review && !review.changed) notes.push(`${name}: decisio ${version} (${recording.card}, ${recording.date}), labelled; ${pinnedTag} leaves it as shown: ${review.why}`);
	return { problems, notes };
}
