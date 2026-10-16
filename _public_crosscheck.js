// READ-ONLY public cross-check: confirm the page_id-scoped public menu still
// separates venues. Mutates nothing.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8000';
const PAGES = [
  { key: 'restaurant-menu', expect: 11, path: '/pages/experiences/restaurant-menu.html' },
  { key: 'lounge',          expect: 2,  path: '/pages/experiences/lounge.html' },
];
(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const p of PAGES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    let connRefused = 0;
    page.on('console', m => { if (m.type() === 'error' && m.text().includes('ERR_CONNECTION_REFUSED')) connRefused++; });
    let status = 0;
    try {
      const r = await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 45000 });
      status = r ? r.status() : 0;
      await page.waitForTimeout(3500);
    } catch (e) { /* recorded via connRefused */ }
    const d = await page.evaluate(() => {
      const t = el => (el.textContent || '').trim();
      const cards = Array.from(document.querySelectorAll('#menu-container .menu-item-card'));
      return {
        pageKey: document.body.getAttribute('data-page'),
        items: cards.map(c => t(c.querySelector('h3'))),
        prices: cards.map(c => t(c.querySelector('.price-tag')))
      };
    }).catch(e => ({ evalError: String(e.message || e).slice(0, 100) }));
    out.push({ page: p.key, status, connRefused, expect: p.expect,
               count: (d.items || []).length, ...d });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();