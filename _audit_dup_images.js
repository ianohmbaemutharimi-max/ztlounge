const fs = require('fs');
const path = require('path');

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
  );
}

const html = walk('pages').filter((f) => f.endsWith('.html'));
html.unshift('index.html', '404.html');

const EXT = '(jpg|jpeg|png|webp|avif|gif)';

for (const f of html) {
  const c = fs.readFileSync(f, 'utf8');
  const imgs = [...c.matchAll(new RegExp('src="([^"]+\\' + '.' + EXT + '[^"]*)"', 'gi'))].map((m) => m[1]);
  const pre = [...c.matchAll(new RegExp('rel="preload"[^>]*href="([^"]+)"', 'gi'))].map((m) => m[1]);
  const css = [...c.matchAll(new RegExp('url\\([\'"]?([^\'")]+\\' + '.' + EXT + '[^\'")]*)', 'gi'))].map((m) => m[1]);
  const bg = [...c.matchAll(new RegExp('background(?:-image)?\\s*:\\s*url\\([\'"]?([^\'")]+)', 'gi'))].map((m) => m[1]);
  const all = [...imgs, ...pre, ...css, ...bg];
  const counts = {};
  for (const u of all) counts[u] = (counts[u] || 0) + 1;
  const dups = Object.entries(counts).filter(([, n]) => n > 1);
  if (dups.length) {
    console.log('=== ' + f + ' ===');
    for (const [u, n] of dups) console.log('  [' + n + 'x] ' + u);
  }
}
console.log('---SCAN-COMPLETE---');