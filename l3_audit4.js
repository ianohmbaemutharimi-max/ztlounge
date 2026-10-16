// Loop 3 audit part 4: section context around static cards + restaurant img map
const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const out = [];
const PAGES = {
    restaurant: 'pages/experiences/restaurant.html',
    lounge: 'pages/experiences/lounge.html',
    vip: 'pages/experiences/vip.html',
    events: 'pages/business/events.html',
    conference: 'pages/business/conference.html'
};
for (const [name, rel] of Object.entries(PAGES)) {
    const html = fs.readFileSync(root + '/' + rel, 'utf8');
    out.push('\n===== ' + name + ' =====');
    // find section boundaries: capture <section ...> tags with id/class
    const secRe = /<section[^>]*>/g; let m; const secs = [];
    while ((m = secRe.exec(html))) secs.push({ tag: m[0], idx: m.index });
    secs.forEach((s, i) => {
        const end = i + 1 < secs.length ? secs[i + 1].idx : html.length;
        const body = html.slice(s.idx, end);
        const imgs = (body.match(/src="https:\/\/jczwilrysvnhcjzjztbi[^"]+"/g) || []).length;
        const bgUrls = (body.match(/url\('https:\/\/jczwilrysvnhcjzjztbi[^']+'\)/g) || []).length;
        const cards = (body.match(/class="[^"]*service-card[^"]*"/g) || []).length;
        const id = (s.tag.match(/id="([^"]*)"/) || [])[1] || '';
        const cls = (s.tag.match(/class="([^"]*)"/) || [])[1] || '';
        const heading = (body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1];
        const h2text = heading ? heading.replace(/<[^>]+>/g, '').trim().slice(0, 50) : '';
        if (imgs || bgUrls || cards) {
            out.push('  section id=' + id + ' class=' + cls.slice(0, 50) + ' h2="' + h2text + '" imgs=' + imgs + ' cssbg=' + bgUrls + ' cards=' + cards);
        }
    });
    // grid context: 300 chars before .service-cards-grid
    const gi = html.indexOf('class="service-cards-grid"');
    if (gi > -1) {
        out.push('  --- context before .service-cards-grid ---');
        out.push('  ' + html.slice(Math.max(0, gi - 350), gi + 40).replace(/\s+/g, ' '));
    }
    const ci = html.indexOf('service-cards-grid-conference');
    if (ci > -1) {
        out.push('  --- context before .service-cards-grid-conference ---');
        out.push('  ' + html.slice(Math.max(0, ci - 350), ci + 40).replace(/\s+/g, ' '));
    }
    // restaurant: list every <img> with alt
    if (name === 'restaurant') {
        out.push('  --- restaurant <img> inventory ---');
        const imgRe = /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g;
        let im;
        while ((im = imgRe.exec(html))) out.push('    alt="' + im[2].slice(0, 60) + '" src=' + im[1].slice(0, 120));
        // also cross-sell anchors with bg or img
        out.push('  --- restaurant <a> cards with images ---');
        const aRe = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]{0,600}?)<\/a>/g;
        let am;
        while ((am = aRe.exec(html))) {
            if (/supabase\.co/.test(am[2]) && /<img/.test(am[2])) {
                const t = (am[2].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '';
                const src = (am[2].match(/src="([^"]+)"/) || [])[1] || '';
                out.push('    a href=' + am[1] + ' h3="' + t.trim() + '" src=' + src.slice(0, 110));
            }
        }
    }
}
fs.writeFileSync(root + '/l3_aud6.txt', out.join('\n'), 'utf8');
