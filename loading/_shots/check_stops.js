const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

  for (const stops of [0, 1, 2, 3, 4]) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2,
    });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate((n) => {
      const input = document.getElementById('cfg-stops');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(n));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, stops);
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => {
      const wrap = document.querySelector('[data-loader="logo"] .ld-wrap');
      const fill = document.querySelector('[data-loader="logo"] .ld-fill');
      return {
        animName: fill ? getComputedStyle(fill).animationName : null,
        riseAnim: wrap ? getComputedStyle(wrap).getPropertyValue('--ld-rise-anim').trim() : null,
      };
    });

    const kfCss = await page.evaluate((n) => {
      const el = document.getElementById(`hanology-loader-kf-${n}`);
      return el ? el.textContent : 'NOT FOUND';
    }, stops);

    console.log(`=== stops=${stops} ===`);
    console.log(`  rise-anim var: ${state.riseAnim}`);
    console.log(`  computed animation-name: ${state.animName}`);
    console.log(`  keyframes:\n${kfCss.split('\n').map(l => '    ' + l).join('\n')}`);

    await page.screenshot({ path: path.join(__dirname, `stops_${stops}.png`) });
    await page.close();
  }

  await browser.close();
})();
