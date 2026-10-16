/**
 * PHASE J — PUBLIC WEBSITE BLACK-BOX AUDIT (audit-only, no app code modified)
 * Part 1: server + page runner
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/zt lounge/zt-lounge-demo/zt-lounge';
const PORT = 8899;
const PW = 'd:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/node_modules/playwright';

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.ttf': 'font/ttf' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (fs.existsSync(path.join(file, 'index.html'))) file = path.join(file, 'index.html');
    else {
      if (fs.existsSync(file + '.html')) file = file + '.html';
      else { res.writeHead(404); res.end('Not found: ' + p); return; }
    }
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const PAGES = [
  'index.html',
  'pages/experiences/restaurant.html',
  'pages/experiences/restaurant-menu.html',
  'pages/experiences/lounge.html',
  'pages/experiences/vip.html',
  'pages/business/events.html',
  'pages/business/conference.html',
  'pages/business/grooming-care.html',
  'pages/contact/contact.html',
  'pages/contact/gallery.html',
];

async function main() {
  await new Promise(r => server.listen(PORT, r));
  console.log('Static server on http://localhost:' + PORT);

  const { chromium } = require(PW);
  const browser = await chromium.launch({ headless: true });
  const report = {};

  for (const pagePath of PAGES) {
    report[pagePath] = await auditPage(browser, pagePath);
  }

  await browser.close();
  server.close();
  fs.writeFileSync(path.join(__dirname, 'phasej-browser-report.json'), JSON.stringify(report, null, 2));
  summarize(report);
}

async function auditPage(browser, pagePath) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const rec = { url: pagePath, consoleErrors: [], consoleWarnings: [], failedRequests: [], supabaseRequests: [], storageRequests: [], otherRequests: 0, dom: {} };

  page.on('console', msg => {
    if (msg.type() === 'error') rec.consoleErrors.push(msg.text());
    else if (msg.type() === 'warning') rec.consoleWarnings.push(msg.text());
  });
  page.on('requestfailed', req => {
    rec.failedRequests.push({ url: req.url().substring(0, 160), failure: req.failure() ? req.failure().errorText : 'unknown' });
  });
  page.on('response', res => {
    const u = res.url();
    if (u.includes('supabase.co')) {
      const entry = { status: res.status(), url: u.substring(0, 200) };
      if (u.includes('/storage/v1/')) rec.storageRequests.push(entry);
      else rec.supabaseRequests.push(entry);
    } else if (u.startsWith('http://localhost:' + PORT)) {
      rec.otherRequests++;
    }
  });

  try {
    const resp = await page.goto('http://localhost:' + PORT + '/' + pagePath, { waitUntil: 'load', timeout: 30000 });
    rec.httpStatus = resp ? resp.status() : null;
    await page.waitForTimeout(4000);
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch (e) { rec.networkIdleTimeout = true; }
    rec.dom = await page.evaluate(extractDom);
  } catch (e) {
    rec.error = e.message;
  }

  await context.close();
  return rec;
}

/* DOM extraction (runs inside browser) */
function extractDom() {
  const txt = el => (el ? el.textContent.trim() : null);
  const out = {};
  out.title = document.title;
  out.phoneLinks = Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }));
  out.whatsappLinks = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')).map(a => a.getAttribute('href'));
  out.emailLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }));
  out.addressText = txt(document.querySelector('.address, [class*="address"], footer .location'));
  out.hoursText = Array.from(document.querySelectorAll('.hours, [class*="hours"], [class*="time"]')).slice(0, 4).map(e => e.textContent.trim().substring(0, 80));
  out.heroSlides = Array.from(document.querySelectorAll('.hero-slide, .slide')).slice(0, 6).map(s => ({
    bg: s.style.backgroundImage ? s.style.backgroundImage.substring(0, 160) : null,
    h1: txt(s.querySelector('h1, .hero-title, h2')),
    sub: txt(s.querySelector('.hero-subtitle, p')),
  }));
  const hero = document.querySelector('.hero, .hero-section');
  if (hero) out.heroStyle = (hero.style.backgroundImage || getComputedStyle(hero).backgroundImage || '').substring(0, 160);
  out.serviceCards = Array.from(document.querySelectorAll('.service-card')).slice(0, 10).map(c => ({
    href: c.getAttribute('href'),
    h3: txt(c.querySelector('h3')),
    p: txt(c.querySelector('p')),
    img: (c.querySelector('img') || {}).src || null,
  }));
  out.menuCategories = Array.from(document.querySelectorAll('.menu-category')).slice(0, 16).map(sec => ({
    id: sec.id,
    title: txt(sec.querySelector('.menu-category-title')),
    items: Array.from(sec.querySelectorAll('.menu-item-card')).slice(0, 12).map(c => ({
      h3: txt(c.querySelector('h3')),
      p: txt(c.querySelector('p')),
      price: txt(c.querySelector('.price-tag')),
      img: (c.querySelector('img') || {}).src || null,
      imgLoaded: (() => { const i = c.querySelector('img'); return i ? (i.complete && i.naturalWidth > 0) : null; })(),
    })),
  }));
  out.galleryItems = Array.from(document.querySelectorAll('.gallery-item, .gallery-grid img, .gallery-grid .gallery-card')).slice(0, 20).map(g => {
    const img = g.tagName === 'IMG' ? g : g.querySelector('img');
    return { title: txt(g.querySelector('h3, .gallery-title, .caption')), img: img ? img.src.substring(0, 160) : null, alt: img ? img.alt : null };
  });
  out.testimonials = Array.from(document.querySelectorAll('.testimonial, .testimonial-item, .testimonial-card')).slice(0, 6).map(t => ({
    text: txt(t.querySelector('blockquote, p')),
    author: txt(t.querySelector('cite, .author')),
  }));
  out.membership = Array.from(document.querySelectorAll('.membership-card, .pricing-card, .plan-card, [class*="membership"] .card')).slice(0, 8).map(m => ({
    h3: txt(m.querySelector('h3, h2')),
    price: txt(m.querySelector('.price, .price-tag, [class*="price"]')),
  }));
  out.experienceHighlights = Array.from(document.querySelectorAll('.experience-card, .highlight-card, .feature-card')).slice(0, 12).map(c => ({
    h3: txt(c.querySelector('h3, h2')),
    p: txt(c.querySelector('p')),
    img: (c.querySelector('img') || {}).src ? c.querySelector('img').src.substring(0, 160) : (c.style.backgroundImage || '').substring(0, 140),
  }));
  out.groomingPackages = Array.from(document.querySelectorAll('.package-card, .pricing-table .card, .service-package')).slice(0, 12).map(c => ({
    h3: txt(c.querySelector('h3, h2, .package-title')),
    price: txt(c.querySelector('.price, .price-tag')),
    p: txt(c.querySelector('p')),
  }));
  out.contactForm = !!document.querySelector('form');
  out.imgStats = (() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return { total: imgs.length, broken: imgs.filter(i => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).length, external: imgs.filter(i => i.src.includes('supabase.co')).length, local: imgs.filter(i => i.src.includes('localhost') || i.src.startsWith('/') || i.src.includes('assets/')).length };
  })();
  const cmsReport = document.querySelector('[data-cms-report], #cms-report, .cms-report');
  out.cmsReportPresent = !!cmsReport;
  out.cmsReportText = cmsReport ? cmsReport.textContent.trim().substring(0, 500) : null;
  out.windowFlags = { hasSupabase: typeof window.supabase !== 'undefined', pageId: (window.PageIdentity && window.PageIdentity.pageId) || (window.pageIdentity && window.pageIdentity.pageId) || null };
  return out;
}

function summarize(report) {
  for (const [pg, rec] of Object.entries(report)) {
    console.log('\n=== ' + pg + ' ===');
    console.log('HTTP:', rec.httpStatus, 'Errors:', rec.consoleErrors.length, 'FailedReq:', rec.failedRequests.length, 'SupabaseREST:', rec.supabaseRequests.length, 'Storage:', rec.storageRequests.length);
    if (rec.error) console.log('NAV ERROR:', rec.error);
    rec.consoleErrors.slice(0, 5).forEach(e => console.log('  CONSOLE-ERR:', e.substring(0, 160)));
    rec.failedRequests.slice(0, 5).forEach(f => console.log('  FAILED-REQ:', f.url));
    if (rec.dom) {
      console.log('  heroSlides:', (rec.dom.heroSlides || []).length, 'serviceCards:', (rec.dom.serviceCards || []).length, 'menuCats:', (rec.dom.menuCategories || []).length, 'gallery:', (rec.dom.galleryItems || []).length, 'testimonials:', (rec.dom.testimonials || []).length);
      console.log('  images:', JSON.stringify(rec.dom.imgStats));
      const sup = rec.supabaseRequests.map(r => r.status + ' ' + r.url.replace('https://jczwilrysvnhcjzjztbi.supabase.co', ''));
      sup.slice(0, 8).forEach(s => console.log('  REST:', s));
    }
  }
  console.log('\nFull JSON written to phasej-audit/phasej-browser-report.json');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
