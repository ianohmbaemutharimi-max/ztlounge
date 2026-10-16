// READ-ONLY probe: record which script URLs actually fail to load, to
// distinguish dev-server asset flakiness from application defects.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const failed = [];
  const ok = [];
  page.on('requestfailed', r => failed.push(r.url() + ' :: ' + (r.failure() || {}).errorText));
  page.on('response', r => { if (/\.js(\?|$)/.test(r.url())) ok.push(r.status() + ' ' + r.url()); });
  await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const globals = await page.evaluate(() => ({
    supabaseClient: typeof window.supabaseClient,
    Supabase: typeof window.Supabase,
    create: !!(window.supabaseClient && window.supabaseClient.create),
    BusinessService: typeof window.BusinessService,
    BusinessRepository: typeof window.BusinessRepository,
    BaseRepository: typeof window.BaseRepository,
    BusinessConfig: typeof window.BusinessConfig
  }));
  console.log(JSON.stringify({ failed, globals, okSample: ok.slice(0, 40) }, null, 2));
  await browser.close();
})();