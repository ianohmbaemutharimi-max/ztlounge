// READ-ONLY runtime verification for the F-2 fix (menu-price hydration).
// Confirms [data-menu-name] placeholders hydrate from menu_items on a page
// that has NO [data-charge-name] (restaurant.html), and that pages which only
// carry [data-charge-name] are unaffected. Mutates nothing.
const { chromium } = require('playwright');

const BASE = 'http://localhost:8000';
const PAGES = [
  { key: 'restaurant',  path: '/pages/experiences/restaurant.html' },     // F-2 target
  { key: 'restaurant-menu', path: '/pages/experiences/restaurant-menu.html' }, // regression
  { key: 'conference',  path: '/pages/business/conference.html' },        // charge-only
  { key: 'lounge',      path: '/pages/experiences/lounge.html' },         // untouched
];

(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const p of PAGES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    let connRefused = 0;
    page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 160)));
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (t.indexOf('ERR_CONNECTION_REFUSED') !== -1) connRefused++;
      else errors.push(t.slice(0, 160));
    });
    let status = 0;
    try {
      const r = await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 45000 });
      status = r ? r.status() : 0;
      await page.waitForTimeout(3000);
    } catch (e) {
      errors.push('nav: ' + String(e.message || e).slice(0, 120));
    }

    const data = await page.evaluate(() => {
      const t = el => (el.textContent || '').trim();
      return {
        menuPriceSpans: Array.from(document.querySelectorAll('[data-menu-name]')).map(s => ({
          wanted: s.getAttribute('data-menu-name'),
          rendered: t(s)
        })),
        chargeSpans: Array.from(document.querySelectorAll('[data-charge-name]')).map(s => ({
          wanted: s.getAttribute('data-charge-name'),
          rendered: t(s)
        })),
        menuCategoryCount: document.querySelectorAll('#menu-container .menu-category').length,
        menuCardCount: document.querySelectorAll('#menu-container .menu-item-card').length,
        cocktailBlocks: document.querySelectorAll('.cocktail-item').length
      };
    }).catch(e => ({ evalError: String(e.message || e).slice(0, 120) }));

    out.push({ page: p.key, status, connRefused, errors, ...data });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();