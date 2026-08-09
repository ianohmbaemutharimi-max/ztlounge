const fs = require('fs');
const path = require('path');

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'backup') continue;
      walk(full);
    } else if (entry.name.endsWith('.html')) {
      htmlFiles.push(full);
    }
  }
}
walk('.');

let issues = 0;

for (const f of htmlFiles) {
  const s = fs.readFileSync(f, 'utf8');
  const openScripts = (s.match(/<script[\s>]/g) || []).length;
  const closeScripts = (s.match(/<\/script>/g) || []).length;

  if (openScripts !== closeScripts) {
    issues++;
    console.log(`UNBALANCED SCRIPTS ${f}: open=${openScripts} close=${closeScripts}`);
  }
  if (s.includes('`n')) {
    issues++;
    console.log(`CORRUPTED BACKTICK-n ${f}`);
  }
  if (s.includes('assets/js/booking.js') && !s.includes('assets/js/legacy/booking.js')) {
    issues++;
    console.log(`STALE booking.js REF ${f}`);
  }
  if (s.includes('assets/images/') || s.includes("assets/images/")) {
    issues++;
    console.log(`LOCAL IMAGE REF ${f}`);
  }
}

console.log(`\nChecked ${htmlFiles.length} HTML files. Total issues: ${issues}`);