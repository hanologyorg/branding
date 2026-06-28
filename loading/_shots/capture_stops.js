const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

  for (const stops of [0, 1, 2, 3, 4]) {
    const page = await browser.newPage({
      viewport: { width: 600, height: 800 },
      deviceScaleFactor: 2,
    });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate((n) => {
      const input = document.getElementById('cfg-stops');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(n));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, stops);
    // Capture at mid-animation (halt zone for stops>=2)
    await page.waitForTimeout(1500);

    // Also verify the correct keyframes element exists
    const kfInfo = await page.evaluate((n) => {
      const el = document.getElementById(`hanology-loader-kf-${n}-12`);
      return el ? `found (${el.textContent.split('\n').length} lines)` : 'MISSING';
    }, stops);

    console.log(`stops=${stops}: keyframes ${kfInfo}`);
    await page.screenshot({ path: path.join(__dirname, `stops_${stops}.png`) });
    await page.close();
  }

  // Also capture sway variations
  for (const amp of [0, 6, 12, 20]) {
    const page = await browser.newPage({
      viewport: { width: 600, height: 800 },
      deviceScaleFactor: 2,
    });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate((a) => {
      const input = document.getElementById('cfg-sway');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(a));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, amp);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, `sway_${amp}.png`) });
    await page.close();
  }

  await browser.close();
  console.log('Done.');
})();
