/* Reproduction: logo render mismatch investigation */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:8000';
const PAGES = ['/', '/index_clean.html'];
const DIR = '_repro_screenshots';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

function snaps() {
  function ei(img) {
    const c = getComputedStyle(img);
    return { cls: img.className, src: img.getAttribute('src'), currentSrc: img.currentSrc,
      nw: img.naturalWidth, nh: img.naturalHeight, display: c.display,
      opacity: c.opacity, visibility: c.visibility, z: c.zIndex, rect: img.getBoundingClientRect() };
  }
  const imgs = Array.from(document.querySelectorAll('.logo-dark.site-logo, .logo-light.site-logo'));
  const header = document.querySelector('.header');
  return {
    htmlClass: document.documentElement.className, bodyClass: document.body.className,
    headerBg: header ? getComputedStyle(header).backgroundColor : null,
    headerBgImg: header ? getComputedStyle(header).backgroundImage : null,
    logos: imgs.map(ei),
    allLogoEls: Array.from(document.querySelectorAll('[class*="logo"]')).map(e => ({ t: e.tagName, cls: e.className, id: e.id })),
    allBrand: Array.from(document.querySelectorAll('[class*="brand"]')).map(e => ({ t: e.tagName, cls: e.className })),
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const pagePath of PAGES) {
    const pageName = pagePath === '/' ? 'index' : path.basename(pagePath, '.html');
    console.log('\n========== PAGE: ' + pagePath + ' ==========');
    const log = [];
    const page = await browser.newPage();
    page.on('console', m => log.push('[console] ' + m.type() + ': ' + m.text()));
    page.on('pageerror', e => log.push('[pageerror] ' + e.message));

    await page.addInitScript(() => {
      window.__IL = [];
      const snap = (tag) => {
        const imgs = Array.from(document.querySelectorAll('.logo-dark.site-logo, .logo-light.site-logo'));
        window.__IL.push({ tag, htmlClass: document.documentElement.className,
          logos: imgs.map(i => ({ cls: i.className, src: i.getAttribute('src'), nw: i.naturalWidth, nh: i.naturalHeight,
            display: getComputedStyle(i).display })) });
      };
      snap('PRE_JS');
      new MutationObserver(() => snap('SRC_MUT')).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','src'] });
      setTimeout(() => snap('POST_THEME'), 0);
    });

        let response;
    try {
      response = await page.goto(BASE + pagePath, { waitUntil: 'load', timeout: 15000 });
      console.log('HTTP status:', response.status());
    } catch (e) {
      console.log('goto note:', e.message.substring(0, 120));
    }
    await page.waitForTimeout(3000);
    const final = await page.evaluate(snaps);
    const init = await page.evaluate(() => window.__IL);
    await page.screenshot({ path: path.join(DIR, pageName + '-dark.png'), fullPage: true });
    console.log('\n--- INIT (pre-JS snapshots) ---'); console.log(JSON.stringify(init, null, 2));
    console.log('\n--- FINAL DOM ---'); console.log(JSON.stringify(final, null, 2));

    await page.evaluate(() => { const b = document.querySelector('.theme-toggle'); if (b) b.click(); else document.documentElement.classList.add('light-mode'); });
    await page.waitForTimeout(1500);
    const light = await page.evaluate(snaps);
    console.log('\n--- LIGHT MODE ---'); console.log(JSON.stringify(light, null, 2));
    await page.screenshot({ path: path.join(DIR, pageName + '-light.png'), fullPage: true });
    console.log('\n--- CONSOLE ---'); console.log(log.join('\n'));
    await page.close();
  }
  await browser.close();
  console.log('\n=== DONE ===');
})().catch(e => { console.error(e); process.exit(1); });
