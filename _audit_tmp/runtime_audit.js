/* READ-ONLY branding/shell audit. No writes to the site. */
const { chromium } = require('playwright');
const fs = require('fs');

const ROUTES = [
  ['home', '/index.html'],
  ['lounge', '/pages/experiences/lounge.html'],
  ['restaurant-menu', '/pages/experiences/restaurant-menu.html'],
  ['contact', '/pages/contact/contact.html'],
  ['restaurant', '/pages/experiences/restaurant.html'],
  ['vip', '/pages/experiences/vip.html'],
  ['events', '/pages/business/events.html'],
  ['conference', '/pages/business/conference.html'],
  ['grooming-care', '/pages/business/grooming-care.html'],
  ['gallery', '/pages/contact/gallery.html']
];

const BASE = 'http://localhost:8123';

async function probe(page, label) {
  return await page.evaluate((label) => {
    const q = (s) => document.querySelector(s);
    const info = (img) => {
      if (!img) return { present: false };
      const cs = getComputedStyle(img);
      const r = img.getBoundingClientRect();
      return {
        present: true,
        src: img.getAttribute('src'),
        srcCurrent: img.currentSrc,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        complete: img.complete,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        filter: cs.filter,
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
        currentSrcResolved: img.currentSrc || null
      };
    };
    const hd = q('#header .logo-dark');
    const hl = q('#header .logo-light');
    const fd = q('.site-footer .logo-dark');
    const fl = q('.site-footer .logo-light');
    const icon = document.querySelector('link[rel="icon"]');
    const apple = document.querySelector('link[rel="apple-touch-icon"]');
    const hdr = q('#header');
    const ftr = q('.site-footer') || q('footer.footer');
    const tt = q('#themeToggle');
    return {
      label,
      htmlClass: document.documentElement.className,
      colorScheme: document.documentElement.style.colorScheme,
      ztThemeLS: (() => { try { return localStorage.getItem('zt-theme'); } catch (e) { return 'ERR'; } })(),
      shellVersion: window.ZTPublicShell ? window.ZTPublicShell.version : null,
      headerCount: document.querySelectorAll('#header').length,
      footerCount: document.querySelectorAll('.site-footer').length,
      headerBg: hdr ? getComputedStyle(hdr).backgroundColor : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headerLogoDark: info(hd),
      headerLogoLight: info(hl),
      footerLogoDark: info(fd),
      footerLogoLight: info(fl),
      favicon: icon ? icon.getAttribute('href') : null,
      appleTouch: apple ? apple.getAttribute('href') : null,
      themeTogglePresent: !!tt
    };
  }, label);
}

(async () => {
  const browser = await chromium.launch();
  const out = {};
  const consoleErrs = [];
  const failedReqs = [];

  for (const [name, route] of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error' || /Branding/i.test(m.text())) {
        consoleErrs.push({ route: name, type: m.type(), text: m.text().slice(0, 300) });
      }
    });
    page.on('requestfailed', (r) => {
      failedReqs.push({ route: name, url: r.url(), failure: r.failure() && r.failure().errorText });
    });

    const rec = { route };
    // 1. fresh load, dark (no LS)
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    rec.initialDark = await probe(page, name + '/dark-fresh');

    // 2. toggle to light
    await page.click('#themeToggle');
    await page.waitForTimeout(800);
    rec.afterToggleLight = await probe(page, name + '/light-toggled');

    // 3. reload while light persisted
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    rec.reloadLight = await probe(page, name + '/light-reload');

    // 4. toggle back to dark
    await page.click('#themeToggle');
    await page.waitForTimeout(800);
    rec.backToDark = await probe(page, name + '/dark-again');

    out[name] = rec;
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync('_audit_tmp/runtime_results.json', JSON.stringify({ out, consoleErrs, failedReqs }, null, 2));
  console.log('WROTE _audit_tmp/runtime_results.json');
  console.log('consoleErrs', consoleErrs.length, 'failedReqs', failedReqs.length);
})();
