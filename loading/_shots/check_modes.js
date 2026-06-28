const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

  for (const mode of ['progress', 'spinner']) {
    const page = await browser.newPage({ viewport: { width: 600, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate((m) => {
      document.querySelector(`button[data-mode="${m}"]`).click();
    }, mode);
    await page.waitForTimeout(300);

    const state = await page.evaluate(() => {
      const wrap = document.querySelector('[data-loader="logo"] .ld-wrap');
      const fill = document.querySelector('[data-loader="logo"] .ld-fill');
      const cs = getComputedStyle(wrap);
      return {
        riseAnim: cs.getPropertyValue('--ld-rise-anim').trim(),
        direction: cs.getPropertyValue('--ld-direction').trim(),
        animName: getComputedStyle(fill).animationName,
        animDir: getComputedStyle(fill).animationDirection,
      };
    });

    // Sample Y positions over time
    const samples = [];
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(600);
      const y = await page.evaluate(() => {
        const fill = document.querySelector('[data-loader="logo"] .ld-fill');
        const mp = (getComputedStyle(fill).maskPosition || '').split(' ');
        return mp[mp.length - 1]; // Y component
      });
      samples.push(y);
    }

    console.log(`=== mode=${mode} ===`);
    console.log(`  rise-anim: ${state.riseAnim}`);
    console.log(`  direction: ${state.direction}`);
    console.log(`  animation-name: ${state.animName}`);
    console.log(`  animation-direction: ${state.animDir}`);
    console.log(`  Y samples (every 600ms): ${samples.join(', ')}`);
    console.log('');

    await page.screenshot({ path: path.join(__dirname, `mode_${mode}.png`) });
    await page.close();
  }

  // Verify preview code includes mode
  const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  const preview = await page.evaluate(() => document.getElementById('cfg-code').textContent);
  console.log('=== Preview (progress) ===');
  console.log(preview);

  await page.evaluate(() => document.querySelector('button[data-mode="spinner"]').click());
  const preview2 = await page.evaluate(() => document.getElementById('cfg-code').textContent);
  console.log('\n=== Preview (spinner) ===');
  console.log(preview2);

  await browser.close();
})();
