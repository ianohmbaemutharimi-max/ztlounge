/**
 * Phase 9 - Public Branding Playwright Verification
 * Validates: DARK -> logo.webp -> .logo-dark -> dark header
 *           LIGHT -> logo-white.webp -> .logo-light -> light header
 * Run: node scripts/phase9_public_verify.js
 */
const { chromium } = require('playwright');

async function main() {
  console.log('=== Phase 9: Public Branding Verification ===\n');
  console.log('Target: http://localhost:8000\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('[console.error]', msg.text());
    }
  });
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  const results = {};

    // --- DARK THEME (default, no light-mode class) ---
  console.log('--- Dark Theme ---');
  await page.addInitScript(() => localStorage.removeItem('zt-theme'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const darkLogoDark = await page.$('.logo-dark.site-logo');
  const darkLogoLight = await page.$('.logo-light.site-logo');

  if (darkLogoDark) {
    const src = await darkLogoDark.getAttribute('src') || '';
    const display = await darkLogoDark.evaluate(el => window.getComputedStyle(el).display);
    results.darkTheme = { logoDarkSrc: src, logoDarkDisplay: display };
    console.log('.logo-dark  src:', src.slice(-80));
    console.log('.logo-dark  display:', display);
  }
  if (darkLogoLight) {
    const src = await darkLogoLight.getAttribute('src') || '';
    const display = await darkLogoLight.evaluate(el => window.getComputedStyle(el).display);
    results.darkTheme.logoLightSrc = src;
    results.darkTheme.logoLightDisplay = display;
    console.log('.logo-light src:', src.slice(-80));
    console.log('.logo-light display:', display);
  }

    // --- LIGHT THEME (zt-theme=light triggers .light-mode class via theme-init.js) ---
  console.log('\n--- Light Theme ---');
    await page.addInitScript(() => localStorage.setItem('zt-theme', 'light'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const lightLogoDark = await page.$('.logo-dark.site-logo');
  const lightLogoLight = await page.$('.logo-light.site-logo');

  if (lightLogoDark) {
    const src = await lightLogoDark.getAttribute('src') || '';
    const display = await lightLogoDark.evaluate(el => window.getComputedStyle(el).display);
    results.lightTheme = { logoDarkSrc: src, logoDarkDisplay: display };
    console.log('.logo-dark  src:', src.slice(-80));
    console.log('.logo-dark  display:', display);
  }
  if (lightLogoLight) {
    const src = await lightLogoLight.getAttribute('src') || '';
    const display = await lightLogoLight.evaluate(el => window.getComputedStyle(el).display);
    results.lightTheme.logoLightSrc = src;
    results.lightTheme.logoLightDisplay = display;
    console.log('.logo-light src:', src.slice(-80));
    console.log('.logo-light display:', display);
  }

  // --- FAVICON ---
  console.log('\n--- Favicon ---');
  const faviconLink = await page.$('link[rel="icon"]');
  if (faviconLink) {
    const href = await faviconLink.getAttribute('href') || '';
    console.log('link[rel=icon] href:', href);
    results.favicon = href;
  } else { console.log('No favicon link found'); }

  // --- SUMMARY ---
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));

  let allPass = true;
  const brandingErrors = consoleErrors.filter(e => e.includes('logo') || e.includes('BrandingInit') || e.includes('media'));
  if (brandingErrors.length > 0) { console.log('FAIL: Branding console errors found'); allPass = false; }
  else { console.log('No branding-related console errors'); }

  if (results.darkTheme && results.darkTheme.logoDarkSrc.includes('logo.webp')) {
    console.log('PASS: Dark theme .logo-dark has dark colorway (logo.webp)');
  } else { console.log('FAIL: Dark theme .logo-dark missing logo.webp'); allPass = false; }

  if (results.lightTheme && results.lightTheme.logoLightSrc.includes('logo-white')) {
    console.log('PASS: Light theme .logo-light has light colorway (logo-white.webp)');
  } else { console.log('FAIL: Light theme .logo-light missing logo-white.webp'); allPass = false; }

  if (allPass) { console.log('\n=== Phase 9: ALL CHECKS PASSED ==='); }
  else { console.log('\n=== Phase 9: SOME CHECKS FAILED ==='); }

  await browser.close();
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error('PHASE 9 ERROR:', e.message); process.exit(1); });
