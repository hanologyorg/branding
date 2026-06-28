const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const page = await browser.newPage({ viewport: { width: 600, height: 900 } });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Check if the preview element exists and has content
  const previewInfo = await page.evaluate(() => {
    const el = document.getElementById('cfg-code');
    return {
      exists: !!el,
      textLength: el ? el.textContent.length : 0,
      text: el ? el.textContent.substring(0, 80) : null,
    };
  });

  console.log('Preview element exists:', previewInfo.exists);
  console.log('Preview text length:', previewInfo.textLength);
  console.log('Preview text (first 80 chars):', previewInfo.text);
  console.log('Console errors:', errors.length ? errors : 'none');

  await browser.close();
})();
