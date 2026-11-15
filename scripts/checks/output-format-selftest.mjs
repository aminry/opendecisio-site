import { test } from 'node:test';
import assert from 'node:assert/strict';
import { outputHtml } from '../../src/lib/output-format.mjs';

const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

test('JSON is re-indented by two spaces and every token is kept as written', () => {
	const { html, json } = outputHtml('{"alpha": 0.05,"n":60,"x":1.0,"tags":["a","b"],"empty":{},"none":[],"ok":true,"v":null}');
	assert.equal(json, true);
	assert.equal(plain(html), '{\n  "alpha": 0.05,\n  "n": 60,\n  "x": 1.0,\n  "tags": [\n    "a",\n    "b"\n  ],\n  "empty": {},\n  "none": [],\n  "ok": true,\n  "v": null\n}');
	assert.match(html, /<span class="j-k">"alpha"<\/span>/);
	assert.match(html, /<span class="j-s">"a"<\/span>/);
});

test('a status line before the JSON stays plain and the JSON is formatted', () => {
	const { html, json } = outputHtml('200\n{"enabled":true}');
	assert.equal(json, true);
	assert.equal(plain(html), '200\n{\n  "enabled": true\n}');
});

test('text that is not JSON is only escaped', () => {
	const { html, json } = outputHtml('a < b && c\nsecond line');
	assert.equal(json, false);
	assert.equal(html, 'a &lt; b &amp;&amp; c\nsecond line');
});

test('output that starts like JSON but is not valid stays as printed', () => {
	assert.equal(outputHtml('{"a": ').json, false);
});
