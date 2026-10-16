const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [name, route] of [['home','/index.html'],['lounge','/pages/experiences/lounge.html'],['restaurant-menu','/pages/experiences/restaurant-menu.html']]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8123' + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const hdr = await page.$('#header');
    if (hdr) await hdr.screenshot({ path: `_audit_tmp/shot_${name}_dark.png` });
    await page.click('#themeToggle');
    await page.waitForTimeout(1500);
    const hdr1 = await page.$('#header');
    if (hdr1) await hdr1.screenshot({ path: `_audit_tmp/shot_${name}_light.png` });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const hdr2 = await page.$('#header');
    if (hdr2) await hdr2.screenshot({ path: `_audit_tmp/shot_${name}_lightreload.png` });
    await ctx.close();
  }
  await browser.close();
  console.log('screenshots done');
})();
