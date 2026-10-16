const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const SCREENSHOT_DIR = path.join(__dirname, '_acceptance_screenshots');
const P = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Login
  await page.goto(P + '/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('#email', 'admin@salon.com');
  await page.fill('#password', 'nb#z!VU@W@JqZEJmZxHD');
  await page.click('button[type=submit]');
  await page.waitForURL(P + '/dashboard', { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  console.log('[OK] Logged in');

  await page.goto(P + '/dashboard/settings', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  const patchCount = { n: 0 };
  page.on('request', (req) => {
    if (req.method() === 'PATCH' && req.url().includes('branding')) {
      patchCount.n++;
      console.log('  PATCH request: ' + req.url() + ' body=' + req.postData());
    }
  });

  const pickers = [
    { name: 'Change Logo', label: 'logo', file: 'admin_dialog_logo.png' },
    { name: 'Change Light Logo', label: 'logo-light', file: 'admin_dialog_light.png' },
    { name: 'Change Favicon', label: 'favicon', file: 'admin_dialog_favicon.png' },
  ];

  for (const p of pickers) {
    console.log('\n--- ' + p.name + ' ---');
    // Use evaluate to find the button by text and click it directly
    const found = await page.evaluate((btnText) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes(btnText));
      if (btn) { btn.click(); return true; }
      return false;
    }, p.name);
    if (!found) {
      console.log('  Button not found: ' + p.name);
      // Try "Select X" variants
      const found2 = await page.evaluate((btnText) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.toLowerCase().includes(btnText.toLowerCase()));
        if (btn) { btn.click(); return true; }
        return false;
      }, p.name.replace('Change ', 'Select '));
      if (!found2) { console.log('  Also not found as Select variant.'); continue; }
    }
    await page.waitForTimeout(1500);

    const dialogCount = await page.locator('[role="dialog"]').count();
    let dialogTitle = '(no dialog)';
    if (dialogCount > 0) {
      dialogTitle = await page.locator('[role="dialog"] h2, [role="dialog"] h3').first().textContent().catch(() => '(no title)');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, p.file), fullPage: true });
      console.log('  Dialog: VISIBLE | title="' + (dialogTitle||'').trim() + '"');
      // Cancel - NO SAVE
      const cancelBtn = page.getByRole('button', { name: /Cancel/i });
      if (await cancelBtn.isVisible()) { await cancelBtn.click(); console.log('  Cancelled (no save)'); }
      else { await page.keyboard.press('Escape'); console.log('  Esc (no save)'); }
      await page.waitForTimeout(500);
    } else {
      console.log('  Dialog: NOT OPEN');
    }
  }

  console.log('\nTotal PATCH requests (should be 0): ' + patchCount.n);
  await browser.close();
  console.log('=== Done ===');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
