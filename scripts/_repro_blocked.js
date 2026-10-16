const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = '_repro_screenshots2';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

const INIT = `
window.__IL = [];
window.__snap = function () {
  function ei(img){var c=getComputedStyle(img);return{cls:img.className,src:img.getAttribute('src'),currentSrc:img.currentSrc,nw:img.naturalWidth,nh:img.naturalHeight,display:c.display,opacity:c.opacity,visibility:c.visibility,rect:img.getBoundingClientRect()}}
  var imgs=Array.from(document.querySelectorAll('.logo-dark.site-logo,.logo-light.site-logo'));
  var header=document.querySelector('.header');
  return {htmlClass:document.documentElement.className,headerBg:header?getComputedStyle(header).backgroundColor:null,headerBgImg:header?getComputedStyle(header).backgroundImage:null,logos:imgs.map(ei)};
};
function s(tag){window.__IL.push({tag:tag,htmlClass:document.documentElement.className,logos:Array.from(document.querySelectorAll('.logo-dark.site-logo,.logo-light.site-logo')).map(function(i){var c=getComputedStyle(i);return{cls:i.className,src:i.getAttribute('src'),currentSrc:i.currentSrc,nw:i.naturalWidth,nh:i.naturalHeight,display:c.display}})})}
s('PRE_JS');
new MutationObserver(function(){s('SRC_MUT')}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']});
setTimeout(function(){s('POST_THEME')},0);
`;

(async () => {
  const tests = [
    { name: 'clean_blocked', url: 'http://localhost:8000/index_clean.html', block: true, theme: 'dark' },
    { name: 'clean_noBlock', url: 'http://localhost:8000/index_clean.html', block: false, theme: 'dark' },
    { name: 'index_blocked', url: 'http://localhost:8000/', block: true, theme: 'dark' },
    { name: 'index_noBlock', url: 'http://localhost:8000/', block: false, theme: 'dark' },
  ];
  const browser = await chromium.launch({ headless: true });
  for (const t of tests) {
    console.log('\n========== TEST: ' + t.name + ' ==========');
    const log = [];
    const page = await browser.newPage();
    page.on('console', m => log.push('[console] ' + m.type() + ': ' + m.text()));
    page.on('pageerror', e => log.push('[pageerror] ' + e.message));
    if (t.block) {
      await page.route('**/*.supabase.co/**', r => r.abort());
      await page.route('**/*.supabase.in/**', r => r.abort());
      console.log('  [Supabase requests BLOCKED]');
    }
    await page.addInitScript(INIT);
    await page.goto(t.url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(3500);
    const init = await page.evaluate(() => window.__IL);
    const fin = await page.evaluate(() => window.__snap());
    await page.screenshot({ path: path.join(DIR, t.name + '-dark.png'), fullPage: true });
    console.log('\n--- INIT SNAPSHOTS ---'); console.log(JSON.stringify(init, null, 2));
    console.log('\n--- FINAL DOM ---'); console.log(JSON.stringify(fin, null, 2));
    console.log('\n--- BRANDING CONSOLE ---');
    console.log(log.filter(l => /Branding|resolved_logo|updateLogo|fallback|supabase/i.test(l)).join('\n'));
    await page.evaluate(() => { var b = document.querySelector('.theme-toggle'); if (b) b.click(); else document.documentElement.classList.add('light-mode'); });
    await page.waitForTimeout(1500);
    const light = await page.evaluate(() => window.__snap());
    console.log('\n--- LIGHT MODE ---'); console.log(JSON.stringify(light, null, 2));
    await page.screenshot({ path: path.join(DIR, t.name + '-light.png'), fullPage: true });
    await page.close();
  }
  await browser.close();
  console.log('\n=== DONE ===');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
