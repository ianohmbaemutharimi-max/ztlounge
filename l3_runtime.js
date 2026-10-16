// Loop 3 runtime baseline: what do the grids actually render?
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
function startServer(port) {
    return new Promise(res => {
        const s = http.createServer((req, r2) => {
            let fp = req.url === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
            if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) { r2.writeHead(404); r2.end('404'); return; }
            const ext = path.extname(fp).toLowerCase();
            const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
            r2.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
            fs.createReadStream(fp).pipe(r2);
        });
        s.listen(port, () => res(s));
    });
}
(async () => {
    const out = [];
    const flush = () => fs.writeFileSync(ROOT + '/l3_rt1.txt', out.join('\n'), 'utf8');
    const server = await startServer(18792);
    const ALL = [
        ['restaurant', '/pages/experiences/restaurant.html'],
        ['lounge', '/pages/experiences/lounge.html'],
        ['vip', '/pages/experiences/vip.html'],
        ['events', '/pages/business/events.html'],
        ['conference', '/pages/business/conference.html'],
        ['grooming', '/pages/business/grooming-care.html'],
        ['homepage(regression)', '/index.html']
    ];
    const filter = (process.argv[2] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const OUTFILE = process.argv[3] || 'l3_rt1.txt';
    const flush = () => fs.writeFileSync(ROOT + '/' + OUTFILE, out.join('\n'), 'utf8');
    const PAGES = filter.length ? ALL.filter(p => filter.some(f => p[0].toLowerCase().includes(f) || (f === 'homepage' && p[0].includes('homepage')))) : ALL;
    for (let pi = 0; pi < PAGES.length; pi++) {
        const [name, url] = PAGES[pi];
        if (pi > 0) await new Promise(r => setTimeout(r, 4000));

        out.push('\n===== ' + name + ' ' + url + ' =====');
        try {
            const browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox'] });
            const page = await browser.newPage();
            const errs = [];
            page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
            page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
            const resp = await page.goto('http://localhost:18792' + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            out.push('http=' + (resp ? resp.status() : 0));
            await page.waitForSelector('.service-cards-grid, .service-cards-grid-conference, [data-category-grid]', { timeout: 15000 }).catch(() => out.push('  (no grid selector found)'));
            await page.waitForTimeout(5000);
            const grid = await page.$('.service-cards-grid');
            if (grid) {
                const inner = await grid.innerHTML();
                const cards = await grid.$$('.service-card');
                out.push('  .service-cards-grid: ' + cards.length + ' cards; static-marker=' + inner.includes('DB-driven: populated by content-loader.js'));
                for (const c of cards) {
                    const h3 = await c.$eval('h3', el => el.textContent.trim()).catch(() => '?');
                    const src = await c.$eval('img', el => el.src).catch(() => '(no img)');
                    out.push('    - "' + h3 + '" | ' + src.slice(0, 110));
                }
            } else {
                out.push('  .service-cards-grid: NOT PRESENT');
            }
            const cgrid = await page.$('.service-cards-grid-conference');
            if (cgrid) {
                const cards = await cgrid.$$('.service-card');
                out.push('  .service-cards-grid-conference: ' + cards.length + ' cards');
                for (const c of cards) {
                    const h3 = await c.$eval('h3', el => el.textContent.trim()).catch(() => '?');
                    const src = await c.$eval('img', el => el.src).catch(() => '(no img)');
                    out.push('    - "' + h3 + '" | ' + src.slice(0, 110));
                }
            }
            const catGrids = await page.$$('[data-category-grid]');
            for (const g of catGrids) {
                const cid = await g.getAttribute('data-category-id');
                const cards = await g.$$('.service-card');
                out.push('  [data-category-grid=' + (cid || '?').slice(0, 8) + '...]: ' + cards.length + ' cards');
                for (const c of cards.slice(0, 4)) {
                    const h3 = await c.$eval('h3, h4', el => el.textContent.trim()).catch(() => '?');
                    const src = await c.$eval('img', el => el.src).catch(() => '(no img)');
                    out.push('    - "' + h3 + '" | ' + src.slice(0, 110));
                }
            }
            const exp = await page.$('.experience-highlights-grid, .experience-grid');
            if (exp) {
                const imgs = await exp.$$eval('img', els => els.map(e => e.src));
                out.push('  experience grid imgs: ' + imgs.length);
                imgs.forEach(s => out.push('    - ' + s.slice(0, 110)));
            }
            out.push('  console errors: ' + errs.length);
            errs.slice(0, 3).forEach(e => out.push('    ERR: ' + e.slice(0, 120)));
        } catch (e) {
            out.push('  PAGE FAILED (isolated): ' + e.message.slice(0, 150));
        }
        try { await browser.close(); } catch (e) {}
        flush();
    }
    server.close();
    flush();
    process.exit(0);
})().catch(e => {
    try { fs.appendFileSync(ROOT + '/l3_rt1.txt', '\nFATAL: ' + (e && e.stack || e), 'utf8'); } catch (e2) {}
    process.exit(1);
});
