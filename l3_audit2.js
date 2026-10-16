// Loop 3 Phase A audit part 2: renderers + target page static markup
const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const out = [];
function sec(t) { out.push('\n===== ' + t + ' ====='); }

const cl = fs.readFileSync(root + '/assets/js/content-loader.js', 'utf8');
const lines = cl.split('\n');

function dumpFn(name, startLine) {
    // find end: next "\n    }" at 4-space indent followed by blank
    let i = startLine - 1, depth = 0, started = false, end = i;
    for (; i < lines.length; i++) {
        const l = lines[i];
        for (const ch of l) { if (ch === '{') { depth++; started = true; } if (ch === '}') depth--; }
        if (started && depth <= 0) { end = i; break; }
    }
    const body = lines.slice(startLine - 1, end + 1);
    sec(name + ' (lines ' + startLine + '-' + (end + 1) + ')');
    // print selector lines and card-building lines only
    body.forEach((l, idx) => {
        if (/querySelector|getElementById|innerHTML|card-image|image_url|public_url|resolveCollection|resolveSingle|getByPage|media_id|href|service-card|menu-item-card|skip|filter\(/.test(l)) {
            out.push('  L' + (startLine + idx) + ': ' + l.trim().slice(0, 160));
        }
    });
}

dumpFn('populateServices', 958);
dumpFn('populateServicePrices', 1118);
dumpFn('populateServiceCatalog', 1229);
dumpFn('populateCategoryServices', 733);

// Target pages: static service markup + hardcoded image URLs
const PAGES = {
    restaurant: 'pages/experiences/restaurant.html',
    lounge: 'pages/experiences/lounge.html',
    vip: 'pages/experiences/vip.html',
    events: 'pages/business/events.html',
    conference: 'pages/business/conference.html',
    grooming: 'pages/business/grooming-care.html',
};
for (const [name, rel] of Object.entries(PAGES)) {
    const html = fs.readFileSync(root + '/' + rel, 'utf8');
    sec('PAGE ' + name + ' (' + rel + ')');
    // service-card occurrences
    const cardCount = (html.match(/class="[^"]*service-card[^"]*"/g) || []).length;
    out.push('  service-card class occurrences: ' + cardCount);
    // grid containers
    (html.match(/class="service-cards-grid[^"]*"/g) || []).forEach(x => out.push('  grid: ' + x));
    // hardcoded supabase storage urls
    const urls = html.match(/https:\/\/jczwilrysvnhcjzjztbi\.supabase\.co\/storage\/v1\/object\/public\/[^"'\)\s]+/g) || [];
    const uniq = [...new Set(urls)];
    out.push('  hardcoded supabase storage URLs: ' + uniq.length);
    uniq.forEach(u => out.push('    ' + u));
    // local /assets/images business refs
    const loc = [...new Set(html.match(/(?:src|href)="\/assets\/images\/[^"]+"/g) || [])];
    out.push('  local /assets/images/ refs: ' + loc.length);
    loc.forEach(u => out.push('    ' + u));
    // inline populate/render hints
    const hints = [...new Set((html.match(/populate\w+|data-category-id="[^"]*"|data-category-grid|data-services|content-loader/g) || []))];
    out.push('  renderer hints: ' + hints.join(', '));
    // img tags total
    out.push('  <img> tags: ' + (html.match(/<img\s/g) || []).length);
    // CSS background urls (hero etc.)
    const bgUrls = [...new Set((html.match(/url\('https:\/\/[^']+'\)/g) || []))];
    out.push('  CSS background urls: ' + bgUrls.length);
}

fs.writeFileSync(root + '/l3_aud2.txt', out.join('\n'), 'utf8');
