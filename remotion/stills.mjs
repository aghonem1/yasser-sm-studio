import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'path';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: '/usr/bin/google-chrome'});
const composition = await selectComposition({serveUrl, id: process.env.COMP || 'kufr', puppeteerInstance: browser});
for (const f of frames) {
  await renderStill({composition, serveUrl, frame: f, output: `out/s_${String(f).padStart(4, '0')}.png`, puppeteerInstance: browser, browserExecutable: '/usr/bin/google-chrome'});
}
await browser.close({silent: true});
console.log('ok', frames.length);
