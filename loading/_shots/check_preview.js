const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const page = await browser.newPage({
    viewport: { width: 600, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Initial state
  let code = await page.evaluate(() => document.getElementById('cfg-code').textContent);
  console.log('=== Initial preview ===');
  console.log(code);

  // Change amplitude
  await page.evaluate(() => {
    const input = document.getElementById('cfg-amplitude');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '18');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  code = await page.evaluate(() => document.getElementById('cfg-code').textContent);
  console.log('\n=== After amplitude=18 ===');
  console.log(code);

  // Change stops and sway
  await page.evaluate(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const stops = document.getElementById('cfg-stops');
    setter.call(stops, '4');
    stops.dispatchEvent(new Event('input', { bubbles: true }));
    const sway = document.getElementById('cfg-sway');
    setter.call(sway, '20');
    sway.dispatchEvent(new Event('input', { bubbles: true }));
    const dur = document.getElementById('cfg-duration');
    setter.call(dur, '3');
    dur.dispatchEvent(new Event('input', { bubbles: true }));
  });
  code = await page.evaluate(() => document.getElementById('cfg-code').textContent);
  console.log('\n=== After stops=4, sway=20, duration=3 ===');
  console.log(code);

  // Switch to sm
  await page.evaluate(() => {
    document.querySelector('button[data-size="sm"]').click();
  });
  code = await page.evaluate(() => document.getElementById('cfg-code').textContent);
  console.log('\n=== After size=sm ===');
  console.log(code);

  await page.screenshot({ path: path.join(__dirname, 'preview.png') });
  await browser.close();
})();
