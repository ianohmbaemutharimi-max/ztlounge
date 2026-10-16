const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const out = [];
for (const rel of ['pages/experiences/lounge.html', 'pages/experiences/vip.html', 'pages/business/events.html']) {
    const html = fs.readFileSync(root + '/' + rel, 'utf8');
    const gi = html.indexOf('<div class="service-cards-grid">');
    const marker = html.includes('DB-driven: populated by content-loader.js populateServiceCards()');
    // card occurrences anywhere in file
    const total = (html.match(/class="service-card /g) || []).length;
    // card occurrences between grid open and the section close
    const nextSec = html.indexOf('<section', gi + 10);
    const inGrid = (html.slice(gi, nextSec).match(/class="service-card /g) || []).length;
    // hardcoded public-assets URLs remaining in whole file
    const urls = (html.match(/public-assets\/images\//g) || []).length;
    // grid inner preview
    const preview = html.slice(gi, gi + 300).replace(/\s+/g, ' ');
    out.push(rel + ': grid@' + gi + ' marker=' + marker + ' cardsInFile=' + total + ' cardsInGridSection=' + inGrid + ' publicAssetsRefs=' + urls);
    out.push('   grid preview: ' + preview.slice(0, 260));
}
fs.writeFileSync(root + '/l3_fix_status.txt', out.join('\n'), 'utf8');
