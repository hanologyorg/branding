const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

  const captures = [
    { theme: 'light', delay: 400,  name: 'light_early' },
    { theme: 'light', delay: 1500, name: 'light_mid' },
    { theme: 'light', delay: 2800, name: 'light_full' },
    { theme: 'dark',  delay: 1500, name: 'dark_mid' },
    { theme: 'oled',  delay: 1500, name: 'oled_mid' },
    { theme: 'warm',  delay: 1500, name: 'warm_mid' },
  ];

  for (const c of captures) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2,
    });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.click(`.themes button[data-set="${c.theme}"]`);
    await page.waitForTimeout(c.delay);

    const state = await page.evaluate(() => {
      const panel = document.querySelector('[data-loader="logo"]');
      const wrap = panel?.querySelector('.ld-wrap');
      const fill = panel?.querySelector('.ld-fill');
      const baseImg = panel?.querySelector('.ld-base');
      const fillImg = panel?.querySelector('img.ld-fill');

      const summarize = (el) => (el?.getAnimations() || []).map((a) =>
        `${a.animationName}/${a.playState}@${Math.round(a.currentTime ?? -1)}ms`);

      return {
        paper: getComputedStyle(document.body).getPropertyValue('--paper').trim(),
        vermillion: getComputedStyle(document.body).getPropertyValue('--vermillion').trim(),
        baseSrc: baseImg?.getAttribute('src') ?? null,
        fillSrc: fillImg?.getAttribute('src') ?? null,
        maskImage: fill ? getComputedStyle(fill).maskImage : null,
        maskSize: fill ? getComputedStyle(fill).maskSize : null,
        maskPos: fill ? getComputedStyle(fill).maskPosition : null,
        fillAnims: summarize(fill),
      };
    });

    const fmt = (arr) => arr.join(' | ') || 'none';
    console.log(
      `${c.name.padEnd(14)} theme=${c.theme} paper=${state.paper} verm=${state.vermillion}\n` +
      `  base=${state.baseSrc} fill=${state.fillSrc}\n` +
      `  mask=${state.maskSize} @ ${state.maskPos}\n` +
      `  fillAnims: ${fmt(state.fillAnims)}`
    );

    await page.screenshot({ path: path.join(__dirname, `${c.name}.png`) });
    await page.close();
  }

  await browser.close();
})();
