// READ-ONLY runtime verification for the page-ID-only menu architecture.
// Asserts: a menu surface renders ONLY menu_items belonging to its own
// menu page_id. Mutates nothing; submits nothing.
const { chromium } = require('playwright');

const BASE = 'http://localhost:8000';
const PAGES = [
  { key: 'restaurant-menu', expect: 11, path: '/pages/experiences/restaurant-menu.html' },
  { key: 'lounge',          expect: 2,  path: '/pages/experiences/lounge.html' },
  { key: 'restaurant',      expect: 0,  path: '/pages/experiences/restaurant.html' },
  { key: 'home',            expect: 0,  path: '/index.html' },
];

const FORBIDDEN = ['Cocktail Selection', 'Signature Cocktail', 'Half-Day Package'];

(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const p of PAGES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    let connRefused = 0;
    const errors = [];
    page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 140)));
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (t.indexOf('ERR_CONNECTION_REFUSED') !== -1) connRefused++;
      else errors.push(t.slice(0, 140));
    });
    let status = 0;
    try {
      const r = await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 45000 });
      status = r ? r.status() : 0;
      await page.waitForTimeout(3500);
    } catch (e) {
      errors.push('nav: ' + String(e.message || e).slice(0, 120));
    }

    const data = await page.evaluate((forbidden) => {
      const t = el => (el.textContent || '').trim();
      const cards = Array.from(document.querySelectorAll('#menu-container .menu-item-card'));
      const names = cards.map(c => t(c.querySelector('h3')));
      const catTitles = Array.from(document.querySelectorAll('#menu-container .menu-category-title'))
        .map(el => t(el));
      const leaked = forbidden.filter(f => names.indexOf(f) !== -1);
      return {
        pageKey: document.body.getAttribute('data-page'),
        categories: catTitles,
        itemCount: cards.length,
        itemNames: names,
        prices: cards.map(c => t(c.querySelector('.price-tag'))),
        images: cards.map(c => (c.querySelector('img') || { src: '' }).getAttribute('src')),
        leakedFromOtherVenues: leaked,
        emptyCategoryBlocks: document.querySelectorAll('#menu-container .text-muted').length,
        menuPriceSpans: Array.from(document.querySelectorAll('[data-menu-name]'))
          .map(s => ({ wanted: s.getAttribute('data-menu-name'), rendered: t(s) }))
      };
    }, FORBIDDEN).catch(e => ({ evalError: String(e.message || e).slice(0, 120) }));

    out.push({
      page: p.key, status, connRefused, errors, expected: p.expect,
      countMatches: data.itemCount === p.expect, ...data
    });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();