const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PUBLIC_URL = 'http://localhost:8000';
const ADMIN_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '_acceptance_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const E2E_EMAIL = 'admin@salon.com';
const E2E_PASSWORD = 'nb#z!VU@W@JqZEJmZxHD';

const EXPECTED = {
  logoDarkUrl: 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp',
  logoLightUrl: 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo-white.webp',
  faviconUrl: 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/favicons/favicon.ico',
};

function ts() { return new Date().toISOString().slice(11, 19); }
function log(msg) { console.log('[ ' + ts() + ' ] ' + msg); }

async function inspectLogos(page, label) {
  return await page.evaluate((lbl) => {
    const results = { phase: lbl, htmlClass: document.documentElement.className };
    const logos = document.querySelectorAll('.logo-dark.site-logo, .logo-light.site-logo');
    results.logos = [];
    logos.forEach((img) => {
      const style = window.getComputedStyle(img);
      const parent = img.closest('.logo');
      results.logos.push({
        className: img.className, src: img.getAttribute('src'), currentSrc: img.currentSrc,
        display: style.display, visibility: style.visibility, opacity: style.opacity,
        parentBg: parent ? window.getComputedStyle(parent).backgroundColor : null,
      });
    });
    const header = document.querySelector('.header');
    results.headerBg = header ? window.getComputedStyle(header).backgroundColor : null;
    return results;
  }, label);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    log('Browser launched.');

  // === PHASE 1: ADMIN UI ===
  log('=== PHASE 1: Admin UI - Business Settings Branding ===');
  const adminPage = await context.newPage();
  let adminLoginOk = false;
  try {
    await adminPage.goto(ADMIN_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await adminPage.fill('#email', E2E_EMAIL);
    await adminPage.fill('#password', E2E_PASSWORD);
    await adminPage.click('button[type=submit]');
    await adminPage.waitForURL(ADMIN_URL + '/dashboard', { timeout: 20000 });
    await adminPage.waitForLoadState('networkidle', { timeout: 10000 });
    adminLoginOk = true;
    log('  Admin login: SUCCESS');
  } catch(e) {
    log('  Admin login: FAILED - ' + e.message);
  }

  if (adminLoginOk) {
    await adminPage.goto(ADMIN_URL + '/dashboard/settings', { waitUntil: 'networkidle', timeout: 20000 });
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_settings_full.png'), fullPage: true });
    log('  Screenshot: admin_settings_full.png');

    const logoBtn = adminPage.locator('button', { name: /Select Logo|Change Logo/i }).first();
    const lightLogoBtn = adminPage.locator('button', { name: /Select Light Logo|Change Light Logo/i }).first();
    const faviconBtn = adminPage.locator('button', { name: /Select Favicon|Change Favicon/i }).first();

    log('  Logo picker (logo_media_id): ' + (await logoBtn.count() > 0 ? 'FOUND' : 'NOT FOUND'));
    log('  Light Logo picker (logo_light_media_id): ' + (await lightLogoBtn.count() > 0 ? 'FOUND' : 'NOT FOUND'));
    log('  Favicon picker (favicon_media_id): ' + (await faviconBtn.count() > 0 ? 'FOUND' : 'NOT FOUND'));

    const adminLogos = await adminPage.evaluate(() => {
      const imgs = document.querySelectorAll('img[src*="logo"], img[src*="favicon"]');
      return Array.from(imgs).map(img => ({ src: img.src, alt: img.alt }));
    });
    log('  Admin preview images: ' + JSON.stringify(adminLogos));

    // === PHASE 4: Editability (open + cancel, NO SAVE) ===
    log('=== PHASE 4: Editability without saving ===');
    const patchUrls = [];
    adminPage.on('request', (req) => {
      if (req.method() === 'PATCH' && req.url().includes('branding')) patchUrls.push(req.url());
    });
    const editTests = [['logo', logoBtn], ['logo-light', lightLogoBtn], ['favicon', faviconBtn]];
    for (const [name, btn] of editTests) {
      if (await btn.count() === 0) { log('  ' + name + ': picker not found'); continue; }
      await btn.click();
      await adminPage.waitForTimeout(1000);
      const dialogVisible = await adminPage.locator('[role="dialog"]').isVisible();
      let dialogTitle = 'no dialog';
      if (dialogVisible) {
        dialogTitle = await adminPage.locator('[role="dialog"] h2, [role="dialog"] h3').first().textContent().catch(() => '(no title)');
      }
      log('  ' + name + ': dialog=' + dialogVisible + ' title="' + (dialogTitle||'').trim() + '"');
      const cancelBtn = adminPage.getByRole('button', { name: /Cancel/i });
      if (await cancelBtn.isVisible()) { await cancelBtn.click(); log('  ' + name + ': cancelled (no save)'); }
      else { await adminPage.keyboard.press('Escape'); log('  ' + name + ': Esc (no save)'); }
      await adminPage.waitForTimeout(500);
    }
    log('  PATCH requests during test: ' + patchUrls.length + ' (expected 0)');

    // === PHASE 5: SVG review ===
    log('=== PHASE 5: Admin SVG review ===');
    await adminPage.goto(ADMIN_URL + '/login', { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.waitForTimeout(1000);
    const svgCount = await adminPage.evaluate(() => document.querySelectorAll('svg').length);
    log('  SVG elements on login page: ' + svgCount);
    const logoImgs = await adminPage.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src], img[alt]')).map(img => ({ src: img.src, alt: img.alt }));
    });
    log('  Image elements: ' + JSON.stringify(logoImgs));
    const monogram = await adminPage.evaluate(() => {
      const s = document.querySelector('span[aria-label*="ZT"]');
      return s ? 'found ZT monogram: ' + s.textContent.trim() : 'not found';
    });
    log('  BrandLogo renders: ' + (logoImgs.length > 0 ? 'IMG (canonical resolved URL)' : svgCount > 0 ? 'SVG' : monogram));
  } else {
        log('  Admin UI SKIPPED (login failed). Source + API verification applies.');
  }

  // === PHASE 6: PUBLIC DARK ===
  log('=== PHASE 6: Public DARK theme ===');
  const darkPage = await context.newPage();
  await darkPage.addInitScript(() => { localStorage.setItem('zt-theme', 'dark'); });
  await darkPage.goto(PUBLIC_URL + '/index.html', { waitUntil: 'networkidle', timeout: 20000 });
  await darkPage.waitForTimeout(3000);
  const darkLogos = await inspectLogos(darkPage, 'DARK');
  await darkPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'public_dark_full.png'), fullPage: true });
  log('  htmlClass: ' + darkLogos.htmlClass + ' | headerBg: ' + darkLogos.headerBg);
  for (const l of darkLogos.logos) {
    const visible = l.display !== 'none' && l.visibility !== 'hidden';
    log('  ' + l.className + ': visible=' + visible + ' display=' + l.display + ' src=' + (l.src || l.currentSrc));
  }

  // === PHASE 7: PUBLIC LIGHT ===
  log('=== PHASE 7: Public LIGHT theme ===');
  const lightPage = await context.newPage();
  await lightPage.addInitScript(() => { localStorage.setItem('zt-theme', 'light'); });
  await lightPage.goto(PUBLIC_URL + '/index.html', { waitUntil: 'networkidle', timeout: 20000 });
  await lightPage.waitForTimeout(3000);
  const lightLogos = await inspectLogos(lightPage, 'LIGHT');
  await lightPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'public_light_full.png'), fullPage: true });
  log('  htmlClass: ' + lightLogos.htmlClass + ' | headerBg: ' + lightLogos.headerBg);
  for (const l of lightLogos.logos) {
    const visible = l.display !== 'none' && l.visibility !== 'hidden';
    log('  ' + l.className + ': visible=' + visible + ' display=' + l.display + ' src=' + (l.src || l.currentSrc));
  }

  // === PHASE 8: TOGGLE ===
  log('=== PHASE 8: Toggle test ===');
  const togglePage = await context.newPage();
  await togglePage.addInitScript(() => { localStorage.setItem('zt-theme', 'light'); });
  await togglePage.goto(PUBLIC_URL + '/index.html', { waitUntil: 'networkidle', timeout: 20000 });
  await togglePage.waitForTimeout(3000);
  log('  [A] LIGHT -> toggle -> DARK');
  await togglePage.click('#themeToggle');
  await togglePage.waitForTimeout(2000);
  const afterDark = await inspectLogos(togglePage, 'DARK after toggle');
  for (const l of afterDark.logos) {
    const visible = l.display !== 'none' && l.visibility !== 'hidden';
    log('    ' + l.className + ': visible=' + visible + ' src=' + (l.src || l.currentSrc));
  }
  log('  [B] DARK -> toggle -> LIGHT');
  await togglePage.click('#themeToggle');
  await togglePage.waitForTimeout(2000);
  const afterLight = await inspectLogos(togglePage, 'LIGHT after toggle back');
  for (const l of afterLight.logos) {
    const visible = l.display !== 'none' && l.visibility !== 'hidden';
    log('    ' + l.className + ': visible=' + visible + ' src=' + (l.src || l.currentSrc));
  }
  await togglePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'toggle_test.png') });

  // === PHASE 9: RELOAD ===
  log('=== PHASE 9: Reload test ===');
  log('  DARK -> reload');
  const reloadDark = await context.newPage();
  await reloadDark.addInitScript(() => { localStorage.setItem('zt-theme', 'dark'); });
  await reloadDark.goto(PUBLIC_URL + '/index.html', { waitUntil: 'networkidle', timeout: 20000 });
  await reloadDark.waitForTimeout(1000);
  await reloadDark.reload({ waitUntil: 'networkidle', timeout: 20000 });
  await reloadDark.waitForTimeout(3000);
  const rd = await inspectLogos(reloadDark, 'DARK after reload');
  for (const l of rd.logos) {
    const visible = l.display !== 'none' && l.visibility !== 'hidden';
    log('    ' + l.className + ': visible=' + visible + ' src=' + (l.src || l.currentSrc));
  }
  log('  LIGHT -> reload');
  const reloadLight = await context.newPage();
  await reloadLight.addInitScript(() => { localStorage.setItem('zt-theme', 'light'); });
  await reloadLight.goto(PUBLIC_URL + '/index.html', { waitUntil: 'networkidle', timeout: 20000 });
  await reloadLight.waitForTimeout(1000);
  await reloadLight.reload({ waitUntil: 'networkidle', timeout: 20000 });
  await reloadLight.waitForTimeout(3000);
    const rl = await inspectLogos(reloadLight, 'LIGHT after reload');
  for (const l of rl.logos) {
    const visible = l.display !== 'none' && l.visibility !== 'hidden';
    log('    ' + l.className + ': visible=' + visible + ' src=' + (l.src || l.currentSrc));
  }

  // === PHASE 10: CROSS-LAYER via API ===
  log('=== PHASE 10: Cross-layer consistency ===');
  const apiRes = await fetch(ADMIN_URL + '/api/branding');
  const apiData = await apiRes.json();
  log('  /api/branding logoUrl=' + apiData.logoUrl);
  log('  /api/branding logoLightUrl=' + apiData.logoLightUrl);
  log('  /api/branding faviconUrl=' + apiData.faviconUrl);
  log('  logoUrl matches expected: ' + (apiData.logoUrl === EXPECTED.logoDarkUrl ? 'PASS' : 'FAIL'));
  log('  logoLightUrl matches expected: ' + (apiData.logoLightUrl === EXPECTED.logoLightUrl ? 'PASS' : 'FAIL'));
  log('  faviconUrl matches expected: ' + (apiData.faviconUrl === EXPECTED.faviconUrl ? 'PASS' : 'FAIL'));

  // === PHASE 11: Mobile/Responsive ===
  log('=== PHASE 11: Mobile/responsive check ===');
  const mobilePage = await context.newPage({ viewport: { width: 375, height: 812 } });
  await mobilePage.addInitScript(() => { localStorage.setItem('zt-theme', 'light'); });
  await mobilePage.goto(PUBLIC_URL + '/index.html', { waitUntil: 'networkidle', timeout: 20000 });
  await mobilePage.waitForTimeout(3000);
  const mobileLogos = await inspectLogos(mobilePage, 'LIGHT MOBILE');
  for (const l of mobileLogos.logos) {
    const visible = l.display !== 'none' && l.visibility !== 'hidden';
    log('    ' + l.className + ': visible=' + visible + ' src=' + (l.src || l.currentSrc));
  }
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_light.png') });

  await browser.close();
  log('=== Acceptance review complete. Screenshots: ' + SCREENSHOT_DIR + ' ===');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });



