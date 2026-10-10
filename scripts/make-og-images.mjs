// Draws the link preview images: public/og-image.png (English) and public/og-image-es.png (Spanish), 1200x630.
// They are what WhatsApp, X, LinkedIn or Slack show when someone shares the address of the app. The files are
// committed; run this again only if the logo or the texts below change:
//
//   cd e2e && npm ci && cd ..          playwright-core, the same one the end-to-end test uses
//   node scripts/make-og-images.mjs    TEFI_BROWSER_CHANNEL = chrome (default) | msedge | chromium
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { chromium } = createRequire(path.join(root, 'e2e', 'package.json'))('playwright-core');
const sharp = createRequire(path.join(root, 'package.json'))('sharp');

// Same wording as the page titles (src/site/language.ts) and the role-choice screen of the app
const CARDS = [
  {
    file: 'og-image.png',
    language: 'en',
    tagline: 'The corner store credit notebook, co-signed on Solana',
    detail: 'Store and neighbor each sign from their own phone',
    chips: ['Solana devnet', 'Open source', 'English · Español']
  },
  {
    file: 'og-image-es.png',
    language: 'es',
    tagline: 'La libreta del fiado del almacén, co-firmada en Solana',
    detail: 'Almacenero y vecino firman cada uno desde su teléfono',
    chips: ['Solana devnet', 'Código abierto', 'Español · English']
  }
];
// WhatsApp does not show a preview image heavier than this
const MAX_BYTES = 300_000;

const logo = `data:image/png;base64,${readFileSync(path.join(root, 'public', 'pwa-512x512.png')).toString('base64')}`;

const html = card => `<!doctype html>
<html lang="${card.language}">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=block" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #fff;
         background: linear-gradient(135deg, #00A650 0%, #008740 100%); position: relative; }
  .glow { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.07); }
  .card { position: absolute; inset: 0; display: flex; align-items: center; gap: 64px; padding: 0 84px; }
  .logo { width: 300px; height: 300px; border-radius: 68px; flex: none; box-shadow: 0 30px 60px -18px rgba(0, 0, 0, 0.45); }
  .name { font-size: 86px; font-weight: 800; letter-spacing: -2.5px; line-height: 1; }
  .tagline { font-size: 47px; font-weight: 800; line-height: 1.16; letter-spacing: -1px; margin-top: 22px; text-wrap: balance; }
  .detail { font-size: 28px; font-weight: 500; line-height: 1.3; margin-top: 20px; color: rgba(255, 255, 255, 0.92); text-wrap: balance; }
  .whole { white-space: nowrap; }
  .chips { display: flex; gap: 12px; margin-top: 34px; }
  .chip { font-size: 22px; font-weight: 700; padding: 9px 20px; border-radius: 999px; background: rgba(255, 255, 255, 0.18);
          border: 1.5px solid rgba(255, 255, 255, 0.35); white-space: nowrap; }
</style>
</head>
<body>
  <div class="glow" style="width: 560px; height: 560px; right: -170px; top: -250px;"></div>
  <div class="glow" style="width: 420px; height: 420px; left: -150px; bottom: -230px;"></div>
  <div class="card">
    <img class="logo" src="${logo}" alt="" />
    <div>
      <div class="name">Tefi.app</div>
      <div class="tagline">${card.tagline.replace(/co-\S+/, word => `<span class="whole">${word}</span>`)}</div>
      <div class="detail">${card.detail}</div>
      <div class="chips">${card.chips.map(chip => `<span class="chip">${chip}</span>`).join('')}</div>
    </div>
  </div>
</body>
</html>`;

const browser = await chromium.launch({ channel: process.env.TEFI_BROWSER_CHANNEL || 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const card of CARDS) {
    await page.setContent(html(card), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const overflows = await page.evaluate(() => document.querySelector('.card').scrollWidth > 1200 || document.querySelector('.card > div').scrollHeight > 600);
    if (overflows) throw new Error(`${card.file}: the text does not fit in the card`);

    // An indexed palette keeps the gradient and brings the file well under the WhatsApp limit
    const png = await sharp(await page.screenshot({ type: 'png' })).png({ palette: true, colours: 256, dither: 1, compressionLevel: 9 }).toBuffer();
    if (png.length > MAX_BYTES) throw new Error(`${card.file}: ${png.length} bytes, over the ${MAX_BYTES} bytes WhatsApp accepts`);
    writeFileSync(path.join(root, 'public', card.file), png);
    console.log(`${card.file}: 1200x630, ${png.length} bytes`);
  }
} finally {
  await browser.close();
}
