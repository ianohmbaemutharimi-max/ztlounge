const fs = require('fs');

const files = [
  'index.html',
  'pages/experiences/vip.html',
  'pages/experiences/lounge.html',
  'pages/experiences/restaurant.html',
  'pages/experiences/restaurant-menu.html',
  'pages/business/events.html',
  'pages/business/conference.html',
  'pages/business/autospa.html',
  'pages/contact/gallery.html',
  'pages/contact/contact.html',
  '404.html'
];

let totalIssues = 0;

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log(f + ': FILE MISSING (skipped)');
    continue;
  }
  const s = fs.readFileSync(f, 'utf8');
  let issues = [];

  // 1. All external scripts should have defer
  const externalScripts = s.match(/<script src="[^"]*"[^>]*><\/script>/g) || [];
  for (const tag of externalScripts) {
    if (!/\bdefer\b/.test(tag)) {
      issues.push('MISSING DEFER: ' + tag.slice(0, 100));
    }
    const deferCount = (tag.match(/\bdefer\b/g) || []).length;
    if (deferCount > 1) {
      issues.push('DOUBLE DEFER: ' + tag.slice(0, 100));
    }
  }

  // 2. No corrupted escaped newline
  if (s.includes('</script>`n')) {
    issues.push('CORRUPTED `n REMAINS');
  }

  // 3. No remaining literal `n
  if (s.includes('`n')) {
    issues.push('LITERAL `n FOUND');
  }

  if (issues.length > 0) {
    totalIssues += issues.length;
    console.log('\n' + f + ': ' + issues.length + ' ISSUE(S)');
    issues.forEach(i => console.log('  - ' + i));
  } else {
    console.log(f + ': CLEAN (' + externalScripts.length + ' external scripts, all deferred)');
  }
}

console.log('\nTOTAL ISSUES: ' + totalIssues);