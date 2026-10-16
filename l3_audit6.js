const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const out = [];
for (const rel of ['pages/experiences/lounge.html', 'pages/experiences/vip.html', 'pages/business/events.html']) {
    const html = fs.readFileSync(root + '/' + rel, 'utf8');
    out.push('\n===== ' + rel + ' =====');
    const gi = html.indexOf('<div class="service-cards-grid">');
    const gridEnd = html.indexOf('</div>', html.indexOf('</a>', gi));
    // capture the full grid block: from <div class="service-cards-grid"> to its closing </div>
    // naive: find the section end after grid start
    const secStart = html.lastIndexOf('<section', gi);
    const nextSec = html.indexOf('<section', gi + 10);
    const block = html.slice(gi, Math.min(nextSec, gi + 12000));
    out.push('grid open idx=' + gi + ' block len=' + block.length);
    out.push('--- first 400 chars ---');
    out.push(block.slice(0, 400));
    out.push('--- last 600 chars ---');
    out.push(block.slice(-600));
    out.push('card count in block: ' + (block.match(/class="service-card /g) || []).length);
}
fs.writeFileSync(root + '/l3_aud8.txt', out.join('\n'), 'utf8');
