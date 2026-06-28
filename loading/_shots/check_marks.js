const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

  async function snapshot(label, fn) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2,
    });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await fn(page);
    await page.waitForTimeout(800);

    const samples = [];
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(400);
      const s = await page.evaluate(() => {
        const wrap = document.querySelector('[data-loader="logo"] .ld-wrap');
        const fill = document.querySelector('[data-loader="logo"] .ld-fill');
        const cs = getComputedStyle(fill);
        const wcs = getComputedStyle(wrap);
        return {
          y: cs.getPropertyValue('--ld-rise-y').trim(),
          x: cs.getPropertyValue('--ld-sway-x').trim(),
          maskPos: cs.maskPosition,
          anim: wcs.getPropertyValue('--ld-rise-anim').trim(),
          dir: wcs.getPropertyValue('--ld-direction').trim(),
        };
      });
      samples.push(s);
    }

    console.log(`\n=== ${label} ===`);
    samples.forEach((s, i) => console.log(`  t${i}: y=${s.y.padEnd(6)} x=${s.x.padEnd(8)} dir=${s.dir} anim=${s.anim}`));

    await page.screenshot({ path: path.join(__dirname, `marks_${label}.png`) });
    await page.close();
    return samples;
  }

  // 1. Spinner, default marks 25–75: should oscillate Y between 25% and 75%
  await snapshot('spinner_25_75', async (page) => {
    await page.click('#mode-toggle button[data-mode="spinner"]');
  });

  // 2. Spinner, marks 40–60: smaller Y range
  await snapshot('spinner_40_60', async (page) => {
    await page.click('#mode-toggle button[data-mode="spinner"]');
    await page.fill('#cfg-low', '40');
    await page.fill('#cfg-high', '60');
    await page.dispatchEvent('#cfg-low', 'input');
    await page.dispatchEvent('#cfg-high', 'input');
  });

  // 3. Spinner, low===high (50/50): Y should be pinned, only X sways
  await snapshot('spinner_50_50', async (page) => {
    await page.click('#mode-toggle button[data-mode="spinner"]');
    await page.fill('#cfg-low', '50');
    await page.fill('#cfg-high', '50');
    await page.dispatchEvent('#cfg-low', 'input');
    await page.dispatchEvent('#cfg-high', 'input');
  });

  // 4. Progress with marks 10–90: Y should now go 10→90 (one-way), not 0→100
  await snapshot('progress_10_90', async (page) => {
    await page.fill('#cfg-low', '10');
    await page.fill('#cfg-high', '90');
    await page.dispatchEvent('#cfg-low', 'input');
    await page.dispatchEvent('#cfg-high', 'input');
  });

  // 5. Progress with default 0/100: full-range rise
  await snapshot('progress_0_100', async (page) => {
    // defaults — no slider interaction needed
  });

  await browser.close();
})();
