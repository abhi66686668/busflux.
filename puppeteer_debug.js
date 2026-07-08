const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  await page.goto('http://localhost:5000/history.html', {waitUntil: 'networkidle0'});
  try {
    await page.evaluate(() => {
      printRechargeReceipt('TEST1234', 'Card', '2026-07-05', '500', '50');
    });
    console.log("Called printRechargeReceipt successfully.");
  } catch(e) {
    console.error("EVAL ERROR:", e.message);
  }
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
