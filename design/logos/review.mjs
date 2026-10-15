// Builds the review page for the Decisio mark and takes a PNG of each
// context from it: the site header at desktop and phone width, the favicon at
// 16 and 32 px in a browser tab, the GitHub avatar at 40 px, the README header,
// the 1280x640 social preview and the Ollama avatar, in light and dark.
//   node review.mjs   writes review/index.html, review/raster/*.png, review/*.png
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { candidates, horizontal, mark, palettes, stacked, typefaces } from './build.mjs';

const out = 'review';
const raster = join(out, 'raster');
mkdirSync(raster, { recursive: true });
const themes = ['light', 'dark'];
const uri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const geist = readFileSync('node_modules/@fontsource/geist/files/geist-latin-400-normal.woff').toString('base64');
const geist600 = readFileSync('node_modules/@fontsource/geist/files/geist-latin-600-normal.woff').toString('base64');

// Rasters a reader's browser or a host would actually show.
const png = (svg, w, h) => sharp(Buffer.from(svg), { density: 600 }).resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const tagline = 'Typed questions in, a probability for every option out.';

for (const c of candidates) {
	for (const t of themes) {
		const pal = palettes[t];
		for (const s of [16, 32]) writeFileSync(join(raster, `${c.id}-favicon-${s}-${t}.png`), await png(mark(c, t), s, s));
		// Ollama: a square image; the mark on the theme background with room around it.
		const sq = await png(mark(c, t), 176, 176);
		await sharp({ create: { width: 256, height: 256, channels: 4, background: pal.bg } }).composite([{ input: sq, left: 40, top: 40 }]).png().toFile(join(raster, `${c.id}-ollama-${t}.png`));
		// Social preview: the horizontal lockup and one line about the project.
		const lock = await png(horizontal(c, t), 760, 156);
		const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640"><style>@font-face{font-family:G;src:url(data:font/woff;base64,${geist})}</style><text x="120" y="420" font-family="G" font-size="40" fill="${pal.muted}">${tagline}</text><text x="120" y="520" font-family="G" font-size="28" fill="${pal.muted}">github.com/aminry/decisio</text></svg>`);
		await sharp({ create: { width: 1280, height: 640, channels: 4, background: pal.bg } }).composite([{ input: lock, left: 120, top: 190 }, { input: text, left: 0, top: 0 }]).png().toFile(join(raster, `${c.id}-social-${t}.png`));
	}
}

const ui = {
	light: { bg: '#f3f5f9', surface: '#ffffff', ink: '#0e1a2b', muted: '#4b5870', line: '#dde3eb', gh: '#ffffff', ghLine: '#d1d9e0', ghInk: '#1f2328', tab: '#dee1e6', tabActive: '#ffffff' },
	dark: { bg: '#03050a', surface: '#0b1221', ink: '#e6e8ec', muted: '#9ba9bb', line: '#1a2236', gh: '#0d1117', ghLine: '#3d444d', ghInk: '#f0f6fc', tab: '#202124', tabActive: '#35363a' },
};

const header = (c, t, phone) => `
<div class="hdr ${phone ? 'hdr--phone' : ''}" style="background:${ui[t].bg};border-bottom:1px solid ${ui[t].line}">
	<img src="${uri(horizontal(c, t))}" style="height:${phone ? 22 : 24}px" alt="">
	${phone ? `<span style="color:${ui[t].ink};font-size:22px">&#9776;</span>` : `<nav style="color:${ui[t].muted}">Docs <span>Benchmarks</span> <span>Demos</span> <span>GitHub</span></nav>`}
</div>`;

const tab = (c, t) => `
<div class="tabs" style="background:${ui[t].tab}">
	<div class="tab" style="background:${ui[t].tabActive};color:${ui[t].ink}"><img src="raster/${c.id}-favicon-16-${t}.png" width="16" height="16" alt="">Decisio: typed decisions</div>
	<div class="tab tab--off" style="color:${ui[t].muted}"><span class="fav" style="background:${ui[t].muted}"></span>Another page</div>
	<div class="big" style="background:${ui[t].tabActive}"><img src="raster/${c.id}-favicon-32-${t}.png" width="32" height="32" alt=""><span style="color:${ui[t].muted}">32 px</span></div>
</div>`;

const avatar = (c, t) => `
<div class="gh" style="background:${ui[t].gh};color:${ui[t].ghInk};border:1px solid ${ui[t].ghLine}">
	<span class="ava" style="background:${ui[t].gh};border:1px solid ${ui[t].ghLine}"><img src="${uri(mark(c, t))}" width="26" height="26" alt=""></span>
	<b>aminry</b>&nbsp;/&nbsp;<b>decisio</b><span class="pill" style="border-color:${ui[t].ghLine}">Public</span>
</div>`;

const readme = (c, t) => `
<div class="readme" style="background:${ui[t].gh};color:${ui[t].ghInk};border:1px solid ${ui[t].ghLine}">
	<img src="${uri(horizontal(c, t))}" style="height:44px" alt="">
	<p>Decisio is a serving layer for decisions: typed questions about a piece of text go in, and a probability for every option comes out.</p>
</div>`;

const section = (title, note, cell, cols = 2) => `
<section>
	<h2>${title}</h2>${note ? `<p class="note">${note}</p>` : ''}
	<div class="grid" style="grid-template-columns:160px repeat(${cols}, auto)">
		<div></div>${themes.map((t) => `<div class="colh">${t}</div>`).join('')}
		${candidates.map((c) => `<div class="rowh">${c.title}<small>${typefaces[c.type].name}</small></div>${themes.map((t) => `<div>${cell(c, t)}</div>`).join('')}`).join('')}
	</div>
</section>`;

const assets = (c, t) => `
<div class="assets" style="background:${palettes[t].bg};color:${palettes[t].ink}">
	<img src="${uri(mark(c, t))}" width="64" height="64" alt="">
	<img src="${uri(horizontal(c, t))}" style="height:40px" alt="">
	<img src="${uri(stacked(c, t))}" style="height:96px" alt="">
	<span class="mono"><img src="${uri(mark(c, 'mono').replace(/currentColor/g, palettes[t].ink))}" width="40" height="40" alt=""><small>one colour</small></span>
</div>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Decisio mark</title><style>
@font-face{font-family:Geist;src:url(data:font/woff;base64,${geist})}
@font-face{font-family:Geist;font-weight:600;src:url(data:font/woff;base64,${geist600})}
body{margin:0;padding:24px 32px;font-family:Geist,system-ui,sans-serif;background:#c9ced6;color:#0e1a2b}
h1{font-size:28px;margin:0 0 6px} h2{font-size:20px;margin:0 0 4px} .note{margin:0 0 12px;color:#334155;font-size:14px}
section{background:#e8ebf0;border-radius:12px;padding:20px;margin:0 0 24px}
.grid{display:grid;gap:12px 16px;align-items:center}
.colh{font-weight:600;text-transform:none;color:#334155}
.rowh{font-weight:600}.rowh small{display:block;font-weight:400;color:#4e5b6d;font-size:12px}
.hdr{display:flex;align-items:center;justify-content:space-between;width:1040px;height:60px;padding:0 32px;box-sizing:border-box}
.hdr nav{display:flex;gap:28px;font-size:14px}.hdr--phone{width:390px;padding:0 16px;height:56px}
.tabs{display:flex;align-items:end;gap:2px;width:520px;height:46px;padding:0 8px;box-sizing:border-box}
.tab{display:flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:8px 8px 0 0;font-size:12px;font-family:system-ui;width:180px}
.tab--off{background:transparent}.fav{width:16px;height:16px;border-radius:3px;opacity:.5}
.big{display:flex;align-items:center;gap:8px;margin:0 0 6px auto;padding:4px 8px;border-radius:6px;font-size:11px;white-space:nowrap}
.gh{display:flex;align-items:center;gap:8px;width:420px;padding:14px 16px;font-size:18px;font-family:system-ui;border-radius:6px}
.ava{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:50%;box-sizing:border-box}
.pill{font-size:12px;border:1px solid;border-radius:999px;padding:0 8px;margin-left:6px;font-weight:500}
.readme{width:640px;padding:28px 32px;font-family:system-ui;border-radius:6px}.readme p{margin:14px 0 0;font-size:15px;line-height:1.5}
.social{width:640px;height:320px;border-radius:6px;display:block}
.ollama{width:64px;height:64px;border-radius:8px;display:block}
.assets{display:flex;align-items:center;gap:28px;padding:16px 20px;border-radius:8px}
.mono{display:grid;justify-items:center;gap:4px}.mono small{font-size:11px;opacity:.7}
</style></head><body>
<h1>The Decisio mark: Fork</h1>
<p class="note">A path reaches a fork and takes one branch. Vector, in the site's colour tokens; the word is outlined from Geist (SIL Open Font License 1.1).</p>
${section('The assets', 'Mark, horizontal lockup, stacked lockup and the single-colour mark, on each theme.', assets)}
${section('Site header, desktop', '1040 px of the header at its real height.', (c, t) => header(c, t, false))}
${section('Site header, phone', '390 px wide.', (c, t) => header(c, t, true))}
${section('Browser tab', 'The favicon as a real 16 px raster in the tab, and the 32 px raster beside it.', tab)}
${section('GitHub repository avatar, 40 px', null, avatar)}
${section('README header', null, readme)}
${section('Social preview, 1280 x 640', 'Shown at half size; the full PNGs are in raster/.', (c, t) => `<img class="social" src="raster/${c.id}-social-${t}.png" alt="">`)}
${section('Ollama avatar', 'The square model avatar at 64 px, from a 256 px image.', (c, t) => `<img class="ollama" src="raster/${c.id}-ollama-${t}.png" alt="">`)}
</body></html>`;
writeFileSync(join(out, 'index.html'), html);

// A PNG of each section, at one device pixel per CSS pixel so the favicons are the true rasters.
const { chromium } = await import('playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 2500, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(`file://${join(process.cwd(), out, 'index.html')}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const sections = await page.$$('section');
const names = ['assets', 'header-desktop', 'header-phone', 'favicon', 'github-avatar', 'readme', 'social-preview', 'ollama'];
for (const [i, s] of sections.entries()) await s.screenshot({ path: join(out, `${String(i + 1).padStart(2, '0')}-${names[i]}.png`) });
await page.screenshot({ path: join(out, 'all.png'), fullPage: true });
await browser.close();
console.log(`review: ${out}/index.html and ${sections.length} section PNGs`);
