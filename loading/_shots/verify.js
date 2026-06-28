const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

  // Test 1: Verify keyframes for different stops values
  console.log('=== Keyframe generation ===');
  for (const stops of [0, 1, 2, 3]) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate((n) => {
      const input = document.getElementById('cfg-stops');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(n));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, stops);
    await page.waitForTimeout(100);

    const result = await page.evaluate(() => {
      const el = document.querySelector('style[id^="hanology-loader-kf-"]');
      return el ? { id: el.id, css: el.textContent } : null;
    });
    console.log(`\nstops=${stops} (id: ${result?.id}):`);
    console.log(result?.css || 'NOT FOUND');
    await page.close();
  }

  // Test 2: Sample animation values over time to verify sway turns at halts
  console.log('\n=== Animation sampling (stops=2, duration=5s) ===');
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  const samples = await page.evaluate(async () => {
    const wrap = document.querySelector('[data-loader="logo"] .ld-wrap');
    const fill = document.querySelector('[data-loader="logo"] .ld-fill');
    const results = [];
    const duration = 5000;
    for (let t = 0; t <= duration; t += 250) {
      await new Promise(r => setTimeout(r, 250));
      const cs = getComputedStyle(fill);
      const mp = cs.maskPosition || cs.webkitMaskPosition;
      const anims = fill.getAnimations();
      const riseAnim = anims.find(a => a.animationName && a.animationName.includes('rise'));
      const ct = riseAnim ? riseAnim.currentTime : -1;
      results.push({ t, ct: Math.round(ct || 0), maskPos: mp });
    }
    return results;
  });

  console.log('time(ms) | mask-position');
  for (const s of samples) {
    console.log(`  ${String(s.t).padStart(5)} | ${s.maskPos}`);
  }

  // Test 3: Check wave mask SVG for continuity
  console.log('\n=== Wave mask SVG ===');
  const maskUrl = await page.evaluate(() => {
    const wrap = document.querySelector('[data-loader="logo"] .ld-wrap');
    return getComputedStyle(wrap).getPropertyValue('--ld-wave').trim();
  });
  console.log('Mask URL (first 200 chars):', maskUrl.substring(0, 200));

  await page.screenshot({ path: path.join(__dirname, 'verify_stops2.png') });
  await page.close();
  await browser.close();
})();
