const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const results = [];
    
    for (const vp of [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
    ]) {
        for (const file of ['index.html', 'membership.html']) {
            const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
            const page = await ctx.newPage();
            
            const consoleMsgs = [];
            page.on('console', msg => {
                if (['error', 'warning'].includes(msg.type())) {
                    consoleMsgs.push({ type: msg.type(), text: msg.text() });
                }
            });
            page.on('pageerror', err => {
                consoleMsgs.push({ type: 'pageerror', text: err.message });
            });

            await page.goto('http://127.0.0.1:8000/' + file, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(1500);

            const audit = await page.evaluate(() => {
                const getBox = el => {
                    if (!el) return null;
                    const r = el.getBoundingClientRect();
                    const s = window.getComputedStyle(el);
                    return {
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
                        display: s.display,
                        visibility: s.visibility,
                        opacity: s.opacity,
                        position: s.position,
                        top: s.top,
                        zIndex: s.zIndex
                    };
                };

                const getImg = img => {
                    if (!img) return null;
                    const b = getBox(img);
                    return Object.assign(b, {
                        src: img.src,
                        currentSrc: img.currentSrc,
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        alt: img.alt
                    });
                };

                const header = document.querySelector('header#header');
                const siteHeaderDiv = document.querySelector('div#site-header');
                const logoAnchor = document.querySelector('#header .logo');
                const darkLogo = document.querySelector('#header img.logo-dark');
                const lightLogo = document.querySelector('#header img.logo-light');
                const navMenu = document.querySelector('#header #navMenu');
                const hamburger = document.querySelector('#header #hamburger');
                const themeToggle = document.querySelector('#header #themeToggle');
                const phoneCta = document.querySelector('#header .header-phone');

                return {
                    header: getBox(header),
                    siteHeaderDiv: getBox(siteHeaderDiv),
                    logoAnchor: getBox(logoAnchor),
                    darkLogo: getImg(darkLogo),
                    lightLogo: getImg(lightLogo),
                    navMenu: getBox(navMenu),
                    hamburger: getBox(hamburger),
                    themeToggle: getBox(themeToggle),
                    phoneCta: getBox(phoneCta)
                };
            });

            const ssPath = 	emp_audit__.png;
            await page.screenshot({ path: ssPath, fullPage: false });

            results.push({
                file: file,
                viewport: vp.name,
                audit: audit,
                screenshot: ssPath,
                errors: consoleMsgs.filter(m => m.type === 'error' || m.type === 'pageerror'),
                warnings: consoleMsgs.filter(m => m.type === 'warning')
            });

            await ctx.close();
        }
    }

    fs.writeFileSync('temp_browser_audit.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('AUDIT COMPLETED SUCCESSFULLY. Wrote temp_browser_audit.json');
    await browser.close();
})();
