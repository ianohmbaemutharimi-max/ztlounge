/**
 * READ-ONLY AUDIT: Dark mode browser test
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
    });

    fs.mkdirSync(path.join(__dirname, '../_audit_screenshots'), { recursive: true });
    fs.mkdirSync(path.join(__dirname, '../_audit_temp'), { recursive: true });

    // Dark mode (no zt-theme stored = default dark)
    const page = await context.newPage();
    await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(__dirname, '../_audit_screenshots/dark_full.png'), fullPage: true });

    const logos = await page.evaluate(() => {
        const results = {};
        document.querySelectorAll('.site-logo').forEach((img, i) => {
            const r = img.getBoundingClientRect();
            const s = window.getComputedStyle(img);
            results[`logo_${i}`] = {
                selector: img.className,
                src: img.src,
                display: s.display,
                rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
                headerBg: window.getComputedStyle(document.querySelector('.header')).backgroundColor,
                htmlLightMode: document.documentElement.classList.contains('light-mode'),
            };
        });
        return results;
    });

    console.log('=== DARK MODE ===');
    console.log(JSON.stringify(logos, null, 2));

    // Download visible dark-mode logo
    const darkLogo = await page.evaluate(() => {
        const v = document.querySelector('.logo-dark.site-logo');
        return v && v.currentSrc;
    });
    if (darkLogo) {
        const resp = await page.request.get(darkLogo);
        const buf = Buffer.from(await resp.body());
        const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
        console.log(`\nDark mode visible logo: ${darkLogo}`);
        console.log(`Size: ${buf.length} bytes, SHA256: ${hash}`);
        fs.writeFileSync(path.join(__dirname, '../_audit_temp/loaded-dark-logo.webp'), buf);
    }

    await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });