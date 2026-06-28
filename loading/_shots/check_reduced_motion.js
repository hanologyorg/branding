const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const state = await page.evaluate(() => {
    const panel = document.querySelector('[data-loader="logo"]');
    const fill = panel?.querySelector('.ld-fill');
    const track = panel?.querySelector('.ld-wave-track');
    const summarize = (el) => (el?.getAnimations() || []).map((a) =>
      `${a.animationName}/${a.playState}@${Math.round(a.currentTime ?? -1)}ms`);
    return {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      fillClip: fill ? getComputedStyle(fill).clipPath : null,
      fillAnims: summarize(fill),
      trackAnims: summarize(track),
    };
  });

  console.log('prefers-reduced-motion:', state.reduceMotion);
  console.log('fill clip:', state.fillClip);
  console.log('fill anims:', state.fillAnims.join(' | ') || 'none');
  console.log('track anims:', state.trackAnims.join(' | ') || 'none');

  await page.screenshot({ path: path.join(__dirname, 'reduced_motion_overridden.png') });
  await browser.close();
})();
