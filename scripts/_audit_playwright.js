/**
 * READ-ONLY AUDIT: ZT Lounge Logo Asset & Rendering Inspection
 * Phase 5-7: Browser-loaded image inspection, screenshot capture, DOM comparison
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

    // Ensure output dirs exist
    fs.mkdirSync(path.join(__dirname, '../_audit_screenshots'), { recursive: true });
    fs.mkdirSync(path.join(__dirname, '../_audit_temp'), { recursive: true });

    // Helper: inspect all logo elements on a page
    async function inspectLogos(page) {
        return await page.evaluate(() => {
            const results = {};
            const logos = document.querySelectorAll('.site-logo');
            const header = document.querySelector('.header');
            const footer = document.querySelector('.footer');
            const headerStyle = header ? window.getComputedStyle(header) : {};
            const footerStyle = footer ? window.getComputedStyle(footer) : {};
            const bodyStyle = window.getComputedStyle(document.body);
            const htmlStyle = window.getComputedStyle(document.documentElement);

            logos.forEach((img, i) => {
                const rect = img.getBoundingClientRect();
                const style = window.getComputedStyle(img);
                const parent = img.closest('.logo');
                const parentStyle = parent ? window.getComputedStyle(parent) : {};

                results[`logo_${i}`] = {
                    selector: img.tagName + '.' + img.className,
                    src: img.src,
                    currentSrc: img.currentSrc,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    filter: style.filter,
                    mixBlendMode: style.mixBlendMode,
                    backgroundColor: style.backgroundColor,
                    backgroundImage: style.backgroundImage,
                    objectFit: style.objectFit,
                    objectPosition: style.objectPosition,
                    rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
                    dataCanonicalLogo: img.getAttribute('data-canonical-logo'),
                    parentBg: parentStyle ? parentStyle.backgroundColor : null,
                    headerBg: headerStyle ? headerStyle.backgroundColor : null,
                    footerBg: footerStyle ? footerStyle.backgroundColor : null,
                    bodyBg: bodyStyle.backgroundColor,
                    htmlLightMode: document.documentElement.classList.contains('light-mode'),
                };
            });
            return results;
        });
    }

    // Helper: download an image via page context and return buffer
    async function downloadImage(page, url) {
        if (!url) return null;
        const response = await page.request.get(url);
        const buffer = Buffer.from(await response.body());
        const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
        return { url, size: buffer.length, sha256: hash, buffer };
    }

        // Helper: capture screenshot of an element
    async function screenshotElement(page, selector, outPath) {
        const el = await page.$(selector);
        if (el) {
            await el.screenshot({ path: outPath });
            return true;
        }
        return false;
    }

    // Helper: get bounding rect of an element
    async function getRect(page, selector) {
        return await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
        }, selector);
    }

    // ===== TEST 1: LIGHT MODE (white header — the reported bug) =====
    await context.addInitScript(() => {
        localStorage.setItem('zt-theme', 'light');
    });

    const page1 = await context.newPage();
    await page1.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page1.waitForTimeout(3000);

    await page1.screenshot({ path: path.join(__dirname, '../_audit_screenshots/light_full.png'), fullPage: true });

    const lightLogos = await inspectLogos(page1);
    console.log('=== LIGHT MODE (white header) — Logo Inspection ===');
    console.log(JSON.stringify(lightLogos, null, 2));

    // Download the visible logo (in light mode, .logo-light is visible)
    const lightVisibleSrc = lightLogos.logo_1 ? lightLogos.logo_1.currentSrc : null;
    const lightHiddenSrc = lightLogos.logo_0 ? lightLogos.logo_0.currentSrc : null;

    console.log('\n--- Light mode visible logo (logo-light) download ---');
    if (lightVisibleSrc) {
        const dl = await downloadImage(page1, lightVisibleSrc);
        console.log(`URL: ${dl.url}`);
        console.log(`Size: ${dl.size} bytes`);
        console.log(`SHA256: ${dl.sha256}`);
        fs.writeFileSync(path.join(__dirname, '../_audit_temp/loaded-light-logo.webp'), dl.buffer);
        console.log(`Saved to _audit_temp/loaded-light-logo.webp`);
    } else {
        console.log('No visible logo found!');
    }

    console.log('\n--- Light mode hidden logo (logo-dark) src ---');
    console.log(`URL: ${lightHiddenSrc || '(not found)'}`);

    // Element screenshots
    await screenshotElement(page1, '.logo-light.site-logo', path.join(__dirname, '../_audit_screenshots/light_logo_element.png'));
        await screenshotElement(page1, '.logo-dark.site-logo', path.join(__dirname, '../_audit_screenshots/light_logo_dark_element.png'));

    // ===== TEST 2: DARK MODE (dark header) =====
    await context.clearCookies();
    const page2 = await context.newPage();
    await page2.addInitScript(() => {
        localStorage.removeItem('zt-theme'); // default = dark mode
    });

    await page2.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page2.waitForTimeout(3000);

    await page2.screenshot({ path: path.join(__dirname, '../_audit_screenshots/dark_full.png'), fullPage: true });

    const darkLogos = await inspectLogos(page2);
    console.log('\n=== DARK MODE (dark header) — Logo Inspection ===');
    console.log(JSON.stringify(darkLogos, null, 2));

    // In dark mode, .logo-dark is visible
    const darkVisibleSrc = darkLogos.logo_0 ? darkLogos.logo_0.currentSrc : null;
    console.log('\n--- Dark mode visible logo (logo-dark) download ---');
    if (darkVisibleSrc) {
        const dl = await downloadImage(page2, darkVisibleSrc);
        console.log(`URL: ${dl.url}`);
        console.log(`Size: ${dl.size} bytes`);
        console.log(`SHA256: ${dl.sha256}`);
        fs.writeFileSync(path.join(__dirname, '../_audit_temp/loaded-dark-logo.webp'), dl.buffer);
    }

    await screenshotElement(page2, '.logo-dark.site-logo', path.join(__dirname, '../_audit_screenshots/dark_logo_element.png'));

    await browser.close();
    console.log('\n=== Audit complete. Screenshots in _audit_screenshots/ ===');
})().catch(e => {
    console.error('PLAYWRIGHT ERROR:', e.message);
    process.exit(1);
});

