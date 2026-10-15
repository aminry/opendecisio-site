// Wording the content rules require wherever upstream text is shown.

// "say 'on JevBench's 231 published questions' where those counts appear"
const jevbench = [
	[/^JevBench, 231 published items/, "On JevBench's 231 published questions"],
	[/^JevBench, 231 published questions/, "On JevBench's 231 published questions"],
	[/JevBench, 231 published items/g, "on JevBench's 231 published questions"],
	[/JevBench's 231 published items/g, "JevBench's 231 published questions"],
	[/JevBench's 231 items/g, "JevBench's 231 published questions"],
	[/JevBench's 231 (?!published)/g, "JevBench's 231 published questions "],
	[/JevBench 231\b/g, "JevBench's 231 published questions"],
	[/JevBench's v1\.5 reading covers 231 of the board's 904 open items/g, "JevBench's v1.5 reading is taken on JevBench's 231 published questions, of the board's 904 open items"],
];

export function jevbenchCounts(text) {
	return jevbench.reduce((s, [re, to]) => s.replace(re, to), text);
}

/**
 * A block whose lines end in a comment ("command    # what it is", two spaces or more before the #) with each
 * comment on its own line above its command, so no line is long and no comment
 * wraps on its own at a phone's width. The commands are unchanged.
 */
export function commentsAbove(text) {
	return text
		.split('\n')
		.flatMap((line) => {
			const m = line.match(/^(\s*)(\S.*?\S)\s{2,}(#\s.*)$/);
			return m ? [m[1] + m[3], m[1] + m[2]] : [line];
		})
		.join('\n');
}
