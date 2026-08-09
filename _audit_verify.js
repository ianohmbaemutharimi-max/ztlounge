const fs = require('fs');
const path = require('path');

const pages = [
  'index.html',
  '404.html',
  'pages/experiences/restaurant.html',
  'pages/experiences/restaurant-menu.html',
  'pages/experiences/lounge.html',
  'pages/experiences/vip.html',
  'pages/business/events.html',
  'pages/business/conference.html',
  'pages/business/autospa.html',
  'pages/contact/gallery.html',
  'pages/contact/contact.html'
];

const problems = [];
const allLocalRefs = new Set();

for (const p of pages) {
  if (!fs.existsSync(p)) {
    problems.push({ page: p, type: 'MISSING PAGE', detail: 'File not found' });
    continue;
  }
  const html = fs.readFileSync(p, 'utf8');
  const pageDir = path.dirname(p);

  const isLocal = (a) =>
    !a.startsWith('http') && !a.startsWith('//') && !a.startsWith('data:') &&
    !a.startsWith('mailto:') && !a.startsWith('tel:') && !a.startsWith('#') &&
    !a.startsWith('javascript:') && !a.includes('cdn.jsdelivr.net') &&
    !a.includes('supabase.co') && !a.startsWith('whatsapp');

  const resolveRef = (ref) => {
    const clean = ref.split('?')[0].split('#')[0];
    if (!clean || clean === '/') return null;
    const rel = path.resolve(pageDir, clean);
    return rel;
  };

  // 1. Local asset refs (src/href/poster)
  const assetRe = /(?:src|href|poster)="([^"]+)"/g;
  const assets = [...html.matchAll(assetRe)].map(m => m[1]);
  const local = assets.filter(isLocal);
  for (const a of local) {
    allLocalRefs.add(a);
    const resolved = resolveRef(a);
    if (resolved && !fs.existsSync(resolved)) {
      problems.push({ page: p, type: 'BROKEN LOCAL ASSET', detail: a, resolved });
    }
  }

  // 2. Local img tags
  const imgRe = /<img[^>]+src="([^"]+)"/g;
  const imgs = [...html.matchAll(imgRe)].map(m => m[1]);
  for (const i of imgs) {
    if (!isLocal(i)) continue;
    const resolved = resolveRef(i);
    if (resolved && !fs.existsSync(resolved)) {
      problems.push({ page: p, type: 'BROKEN IMG', detail: i });
    }
  }

  // 3. Internal links
  const aRe = /<a[^>]+href="([^"]+)"/g;
  const links = [...html.matchAll(aRe)].map(m => m[1]);
  for (const h of links) {
    if (!isLocal(h)) continue;
    const resolved = resolveRef(h);
    if (resolved && !fs.existsSync(resolved)) {
      problems.push({ page: p, type: 'BROKEN LINK', detail: h });
    }
  }

  // 4. Duplicate images within page
  const dup = {};
  for (const i of imgs) dup[i] = (dup[i] || 0) + 1;
  for (const i in dup) {
    if (dup[i] > 1) problems.push({ page: p, type: 'DUPLICATE IMG', detail: i + ' x' + dup[i] });
  }

  // 5. http:// mixed content check
  const httpRe = /(?:src|href)="(http:\/\/[^"]+)"/g;
  const httpRefs = [...html.matchAll(httpRe)].map(m => m[1]);
  for (const h of httpRefs) {
    problems.push({ page: p, type: 'MIXED CONTENT (http://)', detail: h });
  }
}

console.log('=== PROBLEMS ===');
console.log(JSON.stringify(problems, null, 2));

console.log('\n=== SUMMARY ===');
console.log('Total problems: ' + problems.length);
const byType = {};
for (const pr of problems) byType[pr.type] = (byType[pr.type] || 0) + 1;
console.log(JSON.stringify(byType, null, 2));

console.log('\n=== UNIQUE LOCAL ASSET REFS (' + allLocalRefs.size + ') ===');
console.log([...allLocalRefs].sort().join('\n'));