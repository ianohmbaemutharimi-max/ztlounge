const fs = require('fs');
const path = require('path');

const pages = [
  ['index.html', 'Home'],
  ['404.html', '404'],
  ['pages/experiences/restaurant.html', 'Restaurant'],
  ['pages/experiences/restaurant-menu.html', 'Restaurant Menu'],
  ['pages/experiences/lounge.html', 'Lounge'],
  ['pages/experiences/vip.html', 'VIP'],
  ['pages/business/events.html', 'Events'],
  ['pages/business/conference.html', 'Conference'],
  ['pages/business/autospa.html', 'Auto Spa'],
  ['pages/contact/gallery.html', 'Gallery'],
  ['pages/contact/contact.html', 'Contact']
];

console.log('=== SEO / META / A11Y ===');
for (const [p, label] of pages) {
  if (!fs.existsSync(p)) { console.log(label + ': MISSING'); continue; }
  const html = fs.readFileSync(p, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'NONE';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || 'NONE';
  const ogTitle = (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || 'NONE';
  const ogDesc = (html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1] || 'NONE';
  const ogImage = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || 'NONE';
  const ogUrl = (html.match(/<meta property="og:url" content="([^"]*)"/) || [])[1] || 'NONE';
  const twCard = (html.match(/<meta name="twitter:card" content="([^"]*)"/) || [])[1] || 'NONE';
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || 'NONE';
  const hasJsonLd = html.includes('application/ld+json');
  const hasBreadcrumb = html.includes('BreadcrumbList');
  const imgs = [...html.matchAll(/<img/g)].length;
  const imgsNoAlt = [...html.matchAll(/<img(?![^>]*alt=)[^>]*>/g)].length;
  const h1s = [...html.matchAll(/<h1[^>]*>/g)].length;
  const formsNoLabel = [...html.matchAll(/<input(?![^>]*(?:aria-label|aria-labelledby|id))[^>]*>/g)].length;
  const hasNav = html.includes('<nav');
  const hasMain = html.includes('<main');
  const hasLang = /<html[^>]*lang=/.test(html);
  const viewport = html.includes('viewport');
  const locale = (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1] || 'NONE';
  console.log(JSON.stringify({ page: label, title, desc: desc.slice(0,60), ogTitle, ogDesc: (ogDesc||'').slice(0,40), ogImage: !!ogImage, ogUrl, twCard, canonical, jsonLd: hasJsonLd, breadcrumb: hasBreadcrumb, imgs, imgsNoAlt, h1s, formsNoLabel, nav: hasNav, main: hasMain, lang: hasLang ? locale : 'NO', viewport }));
}

console.log('\n=== CODE QUALITY SCAN (JS/TS files) ===');
const scanDirs = ['.', '../zt-lounge-admin/src'];
const patterns = {
  'TODO': /TODO/i,
  'FIXME': /FIXME/i,
  'console.log': /console\.log\(/,
  'console.warn': /console\.warn\(/,
  'console.error': /console\.error\(/,
  'debugger': /debugger\s*;/,
  'MERGE MARKER': /^<<<<<<< |^=======$|^>>>>>>> /m,
};
const counts = {};
const examples = {};
const files = [];
function walk(d, base) {
  if (d.includes('node_modules') || d.includes('.next') || d.includes('dist')) return;
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp, base);
    else if (/\.(js|ts|tsx)$/.test(f)) files.push(fp);
  }
}
for (const d of scanDirs) {
  if (fs.existsSync(d)) walk(d, d);
}
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const [name, re] of Object.entries(patterns)) {
    const m = src.match(re);
    if (m) {
      counts[name] = (counts[name] || 0) + 1;
      if (!examples[name]) {
        const lines = src.split('\n');
        const idx = lines.findIndex(l => re.test(l));
        examples[name] = f + ':' + (idx + 1) + ' | ' + (lines[idx] || '').trim().slice(0, 100);
      }
    }
  }
}
console.log(JSON.stringify({ fileCount: files.length, counts, examples }, null, 2));

console.log('\n=== ROOT FILES CHECK ===');
for (const f of ['robots.txt', 'sitemap.xml', 'site.webmanifest', 'browserconfig.xml', '.env.example', '.gitignore']) {
  console.log(f + ': ' + (fs.existsSync(f) ? fs.statSync(f).size + ' bytes' : 'MISSING'));
}
if (fs.existsSync('sitemap.xml')) {
  const s = fs.readFileSync('sitemap.xml', 'utf8');
  const urls = [...s.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);
  console.log('sitemap URLs: ' + urls.length);
  console.log(urls.join('\n'));
}
console.log('\nrobots.txt:');
if (fs.existsSync('robots.txt')) console.log(fs.readFileSync('robots.txt', 'utf8'));