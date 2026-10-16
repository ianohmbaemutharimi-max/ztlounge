// READ-ONLY runtime observation for the Lounge + Restaurant menu audit.
// Loads 3 pages, records HTTP status, console errors, and the rendered menu
// surfaces. Submits nothing; mutates nothing.
const { chromium } = require('playwright');

const BASE = 'http://localhost:8000';
const PAGES = [
  { key: 'restaurant-menu', path: '/pages/experiences/restaurant-menu.html' },
  { key: 'restaurant',      path: '/pages/experiences/restaurant.html' },
  { key: 'lounge',          path: '/pages/experiences/lounge.html' },
];

(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const p of PAGES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e.message || e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    let status = 0;
    try {
      const r = await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 45000 });
      status = r ? r.status() : 0;
      await page.waitForTimeout(3000);
    } catch (e) {
      errors.push('nav: ' + String(e.message || e).slice(0, 150));
    }

    const data = await page.evaluate(() => {
      const txt = el => (el.textContent || '').trim();
      const cats = Array.from(document.querySelectorAll('#menu-container .menu-category')).map(c => ({
        id: c.id,
        title: txt(c.querySelector('.menu-category-title')),
        cards: Array.from(c.querySelectorAll('.menu-item-card')).map(card => ({
          name: txt(card.querySelector('h3')),
          desc: txt(card.querySelector('p')),
          price: txt(card.querySelector('.price-tag')),
          img: (card.querySelector('img') || {}).getAttribute ? card.querySelector('img').getAttribute('src') : null
        }))
      }));
      return {
        menuContainerExists: !!document.getElementById('menu-container'),
        menuNavExists: !!document.getElementById('menu-nav-container'),
        renderedCategoryCount: cats.length,
        renderedItemCount: cats.reduce((n, c) => n + c.cards.length, 0),
        categories: cats,
        menuNavAnchors: Array.from(document.querySelectorAll('#menu-nav-container a')).map(a => a.textContent.trim()),
        dataMenuNameSpans: Array.from(document.querySelectorAll('[data-menu-name]')).map(s => ({
          wanted: s.getAttribute('data-menu-name'),
          rendered: txt(s)
        })),
        cocktailItems: Array.from(document.querySelectorAll('.cocktail-item')).map(c => ({
          name: txt(c.querySelector('h4')),
          desc: txt(c.querySelector('p')),
          price: txt(c.querySelector('.cocktail-price'))
        }))
      };
    }).catch(e => ({ evalError: String(e.message || e).slice(0, 150) }));

    out.push({ page: p.key, path: p.path, status, errors, ...data });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();