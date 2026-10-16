const fs = require('fs');
const root = 'd:/zt lounge/zt-lounge-demo/zt-lounge';

const files = [
    'pages/experiences/lounge.html',
    'pages/experiences/vip.html',
    'pages/business/events.html',
    'pages/experiences/restaurant.html',
    'pages/experiences/vip.html',
    'pages/business/conference.html'
];

const out = [];
for (const rel of files) {
    const html = fs.readFileSync(root + '/' + rel, 'utf8');
    const matches = [];
    const regex = /service-card/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
        matches.push({ index: m.index, context: html.slice(Math.max(0, m.index - 50), m.index + 600).replace(/\s+/g, ' ').trim() });
    }

    // Check what populateServiceCards actually renders
    out.push('\n' + '='.repeat(60));
    out.push('FILE: ' + rel + ' (total service-card occurrences: ' + matches.length + ')');
    out.push('='.repeat(60));

    if (matches.length > 0 && matches.length <= 20) {
        for (let i = 0; i < matches.length; i++) {
            out.push(`\n--- Match ${i+1} at offset ${matches[i].index} ---`);
            out.push(matches[i].context);
        }
    } else if (matches.length > 20) {
        out.push(`(too many matches: ${matches.length}, showing first 20)`);
        for (let i = 0; i < 20; i++) {
            out.push(`\n--- Match ${i+1} at offset ${matches[i].index} ---`);
            out.push(matches[i].context);
        }
    }

    out.push('\n...\n');
}

fs.writeFileSync(root + '/service_card_context.md', out.join('\n'), 'utf8');
console.log('Done - wrote ' + root + '/service_card_context.md');
