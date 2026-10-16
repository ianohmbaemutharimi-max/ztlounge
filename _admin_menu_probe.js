// READ-ONLY admin black-box probe. NO credentials are used, NO account is
// created, NO data is written. Purpose: verify that the menu UI/API are
// actually gated, and capture what an anonymous visitor can reach.
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch();
  const out = {};
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 140)); });

  for (const path of ['/login', '/dashboard', '/dashboard/menu', '/dashboard/services']) {
    try {
      const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200);
      out['GET ' + path] = {
        status: r ? r.status() : 0,
        finalUrl: page.url().replace(BASE, '') || '/',
        hasMenuTable: await page.locator('table').count(),
        h1: await page.locator('h1').first().textContent().catch(() => null),
        pageSelectCount: await page.locator('select').count(),
        toggleCount: await page.locator('button[role="switch"], input[type="checkbox"]').count()
      };
    } catch (e) {
      out['GET ' + path] = { error: String(e.message || e).slice(0, 120) };
    }
  }

  // Anonymous API probes (read-only GET only; no mutation verbs are issued).
  for (const api of ['/api/admin/menu-items', '/api/admin/menu-categories', '/api/admin/website-pages']) {
    try {
      const r = await page.evaluate(async (u) => {
        const res = await fetch(u, { method: 'GET', credentials: 'include' });
        const body = await res.text();
        return { status: res.status, body: body.slice(0, 160) };
      }, BASE + api);
      out['GET ' + api] = r;
    } catch (e) {
      out['GET ' + api] = { error: String(e.message || e).slice(0, 120) };
    }
  }

  out.consoleErrorSample = [...new Set(consoleErrors)].slice(0, 6);
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();