// Loop 3 surgical fix: remove DEAD static service cards from lounge/vip/events grids
// (runtime-proven replaced by populateServiceCards() with canonical DB cards)
const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const MARKER = '\n                    <!-- DB-driven: populated by content-loader.js populateServiceCards() -->\n                ';
const TARGETS = [
    'pages/experiences/lounge.html',
    'pages/experiences/vip.html',
    'pages/business/events.html'
];
for (const rel of TARGETS) {
    const p = root + '/' + rel;
    let html = fs.readFileSync(p, 'utf8');
    const openTag = '<div class="service-cards-grid">';
    const gi = html.indexOf(openTag);
    if (gi === -1) { console.log('SKIP (no grid): ' + rel); continue; }
    const innerStart = gi + openTag.length;
    // grid closes with the '</div>' that follows the last card '</a>'
    const lastA = html.indexOf('</a>', html.lastIndexOf('class="service-card ', gi) === -1 ? innerStart : gi);
    // find end of grid: the closing </div> immediately after the final </a> card
    let searchFrom = innerStart;
    let lastCardEnd = -1;
    let idx = innerStart;
    while (true) {
        const a = html.indexOf('</a>', idx);
        if (a === -1) break;
        const divAfter = html.indexOf('</div>', a);
        if (divAfter === -1) break;
        lastCardEnd = a + 4;
        idx = divAfter + 6;
        // if the next non-space after this </a> is the grid's </div>, stop
        const rest = html.slice(a + 4, a + 60);
        if (/^\s*<\/div>/.test(rest)) { lastCardEnd = a + 4; break; }
    }
    if (lastCardEnd === -1) { console.log('SKIP (no end): ' + rel); continue; }
    const inner = html.slice(innerStart, lastCardEnd);
    const cardCount = (inner.match(/class="service-card /g) || []).length;
    const before = html;
    html = html.slice(0, innerStart) + MARKER + html.slice(lastCardEnd);
    fs.writeFileSync(p, html, 'utf8');
    // verify
    const after = fs.readFileSync(p, 'utf8');
    const gridsAfter = (after.match(/class="service-card /g) || []).length;
    console.log(rel + ': removed ' + cardCount + ' static cards; remaining service-card occurrences in file: ' + gridsAfter +
        '; marker present: ' + after.includes('DB-driven: populated by content-loader.js populateServiceCards()') +
        '; size delta: ' + (after.length - before.length));
}
