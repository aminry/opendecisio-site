// Full-page screenshots of the given pages at phone, tablet and desktop widths,
// in light and dark, in a real Chrome. Usage:
//   node scripts/shoot.mjs <base-url> <out-dir> <path> [<path> ...]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const [base, out, ...paths] = process.argv.slice(2);
const widths = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };
const themes = (process.env.THEMES ?? 'light,dark').split(',');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
for (const path of paths) {
	for (const [label, [width, height]] of Object.entries(widths)) {
		for (const theme of themes) {
			const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: theme });
			await context.addInitScript((t) => localStorage.setItem('starlight-theme', t), theme);
			const page = await context.newPage();
			await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
			await page.evaluate(() => document.fonts.ready);
			// Scroll through, as a reader would, so lazily loaded images are in the picture.
			const pageHeight = await page.evaluate(async () => {
				for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
					window.scrollTo(0, y);
					await new Promise((r) => setTimeout(r, 80));
				}
				window.scrollTo(0, 0);
				return document.body.scrollHeight;
			});
			await page.waitForLoadState('networkidle');
			const name = `${path.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home'}-${label}-${theme}.png`;
			// Chrome cannot capture a full page much over 16,000 device pixels; tall pages go at 1x.
			await page.screenshot({ path: join(out, name), fullPage: true, scale: pageHeight * 2 > 16000 ? 'css' : 'device' });
			await context.close();
			console.log(name);
		}
	}
}
await browser.close();
