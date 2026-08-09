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
const urlRe = new RegExp(
  'https?:\\/\\/[^"\'\\s>]+\\.' + EXT + '[^"\'\\s>]*',
  'gi'
);

for (const f of html) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const counts = {};
  const occ = {};
  lines.forEach((line, i) => {
    const urls = [...line.matchAll(urlRe)].map((m) => m[0]);
    for (const u of urls) {
      counts[u] = (counts[u] || 0) + 1;
      (occ[u] = occ[u] || []).push({ line: i + 1, text: line.trim().slice(0, 160) });
    }
  });
  const dups = Object.entries(counts).filter(([, n]) => n > 1);
  if (dups.length) {
    console.log('\n========== ' + f + ' ==========');
    for (const [u, n] of dups) {
      console.log('[' + n + 'x] ' + u);
      for (const o of occ[u]) console.log('   L' + o.line + ': ' + o.text);
    }
  }
}
console.log('\n---DETAIL-COMPLETE---');