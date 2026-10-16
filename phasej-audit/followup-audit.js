/**
 * PHASE J follow-up — targeted DOM checks (audit-only)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = 'd:/zt lounge/zt-lounge-demo/zt-lounge';
const PORT = 8898;
const PW = 'd:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/node_modules/playwright';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = fs.existsSync(file + '.html') ? file + '.html' : null;
  if (!file) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
async function main() {
  await new Promise(r => server.listen(PORT, r));
  const { chromium } = require(PW);
  const browser = await chromium.launch({ headless: true });
  const out = {};

  async function visit(pagePath, evaluator) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const supa = [];
    page.on('response', r2 => { if (r2.url().includes('/rest/v1/')) supa.push(r2.status() + ' ' + r2.url().replace('https://jczwilrysvnhcjzjztbi.supabase.co', '').substring(0, 120)); });
    await page.goto('http://localhost:' + PORT + '/' + pagePath, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4500);
    try { await page.waitForLoadState('networkidle', { timeout: 6000 }); } catch (e) {}
    const dom = await page.evaluate(evaluator);
    await ctx.close();
    return { dom, errs, supa };
  }

  // 1. Homepage: gallery preview + membership + JSON-LD
  out.index = await visit('index.html', () => {
    const o = {};
    o.galleryPreview = Array.from(document.querySelectorAll('.gallery-preview-item, .gallery-preview-grid .grid-item')).map(g => {
      const img = g.querySelector('img');
      return { src: img ? img.src.substring(0, 140) : null, display: getComputedStyle(g).display, hidden: g.hasAttribute('hidden') || g.style.display === 'none' };
    });
    o.membershipSection = (() => {
      const sec = document.querySelector('#membership, .membership, [id*="membership"], [class*="membership"]');
      if (!sec) return null;
      return sec.textContent.replace(/\s+/g, ' ').trim().substring(0, 600);
    })();
    o.jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => { try { return JSON.parse(s.textContent); } catch (e) { return { parseError: true }; } });
    o.footerHours = (() => { const f = document.querySelector('footer'); if (!f) return null; const m = f.textContent.match(/10:00[^0-9]*0?2:00/i); return m ? m[0] : null; })();
    return o;
  });

  // 2. Gallery page
  out.gallery = await visit('pages/contact/gallery.html', () => {
    const o = {};
    o.allImages = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src.substring(0, 150), alt: i.alt, complete: i.complete, w: i.naturalWidth }));
    return o;
  });

  // 3. Restaurant page
  out.restaurant = await visit('pages/experiences/restaurant.html', () => {
    const o = {};
    o.galleryPreviewItems = Array.from(document.querySelectorAll('.gallery-preview-item, .culinary-gallery img, .gallery-preview img')).map(i => ({ src: i.src ? i.src.substring(0, 140) : null }));
    o.menuTeaserText = (() => { const m = document.querySelector('#menu, .menu-teaser, [class*="menu"]'); return m ? m.textContent.replace(/\s+/g, ' ').trim().substring(0, 400) : null; })();
    o.infoSection = (() => { const s = document.querySelector('.info-section, [class*="restaurant-info"], .visit-us'); return s ? s.textContent.replace(/\s+/g, ' ').trim().substring(0, 500) : null; })();
    return o;
  });

  await browser.close();
  server.close();
  fs.writeFileSync(path.join(__dirname, 'phasej-followup-report.json'), JSON.stringify(out, null, 2));
  console.log('=== INDEX galleryPreview ===');
  out.index.dom.galleryPreview.forEach(g => console.log('  src:', (g.src || 'NONE').substring(0, 110), '| display:', g.display, '| hidden:', g.hidden));
  console.log('=== INDEX membership ===');
  console.log(out.index.dom.membershipSection);
  console.log('=== INDEX jsonLd phone/hours ===');
  out.index.dom.jsonLd.forEach(j => { const s = JSON.stringify(j); if (s.indexOf('telephone') >= 0 || s.indexOf('openingHours') >= 0) console.log(s.substring(0, 400)); });
  console.log('=== INDEX footerHours ===', out.index.dom.footerHours);
  console.log('=== GALLERY page images ===');
  out.gallery.dom.allImages.forEach(i => console.log('  complete:' + i.complete + ' w:' + i.w + ' | ' + i.src.substring(0, 110)));
  console.log('=== RESTAURANT galleryPreviewItems ===');
  out.restaurant.dom.galleryPreviewItems.forEach(g => console.log('  ', (g.src || 'none').substring(0, 110)));
  console.log('=== RESTAURANT menuTeaser ===');
  console.log(out.restaurant.dom.menuTeaserText);
  console.log('=== RESTAURANT infoSection ===');
  console.log(out.restaurant.dom.infoSection);
  console.log('=== ERRORS === index:', out.index.errs.length, 'gallery:', out.gallery.errs.length, 'restaurant:', out.restaurant.errs.length);
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
