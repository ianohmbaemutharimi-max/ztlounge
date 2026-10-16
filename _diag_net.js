// READ-ONLY Playwright verification: Restaurant + Lounge canonical menu rendering.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8021';
const PAGES = [
  { key: 'restaurant-menu', path: '/pages/experiences/restaurant-menu.html' },
  { key: 'lounge',          path: '/pages/experiences/lounge.html' },
];
const LOUNGE_ONLY = ['Signature Cocktail', 'Cocktail Selection'];
(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const p of PAGES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errs = [], failedReq = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 130)); });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e.message).slice(0, 130)));
    page.on('requestfailed', r => failedReq.push(r.url().slice(0, 90)));
    const resp = await page.goto(BASE + p.path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForFunction(() => document.querySelectorAll('#menu-container .menu-item-card').length > 0, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const d = await page.evaluate(() => {
      const t = e => (e && e.textContent || '').trim();
      const cards = Array.from(document.querySelectorAll('#menu-container .menu-item-card'));
      return {
        dataPage: document.body.getAttribute('data-page'),
        navChips: Array.from(document.querySelectorAll('#menu-nav-container a')).map(t),
        categories: Array.from(document.querySelectorAll('#menu-container .menu-category-title')).map(t),
        emptyCats: document.querySelectorAll('#menu-container .menu-empty').length,
        items: cards.map(c => ({
          name: t(c.querySelector('h3')),
          desc: t(c.querySelector('p')),
          price: t(c.querySelector('.price-tag')),
          img: (c.querySelector('img') || {}).getAttribute ? c.querySelector('img').getAttribute('src') : null
        }))
      };
    });
    const names = d.items.map(i => i.name);
    out.push({
      page: p.key, http: resp.status(), dataPage: d.dataPage,
      catCount: d.categories.length, cats: d.categories,
      itemCount: d.items.length, names,
      emptyCatBlocks: d.emptyCats, navChips: d.navChips,
      loungeOnlyLeak: names.filter(n => LOUNGE_ONLY.includes(n)),
      itemsMissingMedia: d.items.filter(i => !i.img).map(i => i.name),
      itemsNonStorage: d.items.filter(i => i.img && !i.img.includes('/storage/v1/object/')).map(i => i.name),
      items: d.items,
      consoleErrors: errs, failedRequests: failedReq
    });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();
