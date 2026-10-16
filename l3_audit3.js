// Loop 3 audit: DB services per page + page grid markup
const fs = require('fs');
const https = require('https');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const SB = 'https://jczwilrysvnhcjzjztbi.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDEyNTAsImV4cCI6MjA5OTUxNzI1MH0.TooU0gjA4VcKsGBF07O1hpiCvJgACLxvZY09bukpXhw';
function sb(table, q) {
    return new Promise((res, rej) => {
        https.get(SB + '/rest/v1/' + table + '?' + q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }, r => {
            let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(d.slice(0, 200)); } });
        }).on('error', rej);
    });
}
(async () => {
    const out = [];
    const pages = await sb('website_pages', 'select=id,page_key,title&order=page_key.asc');
    out.push('=== website_pages ===');
    pages.forEach(p => out.push('  ' + p.page_key + ' | ' + (p.title || '') + ' | ' + p.id));
    const pageByKey = {}; pages.forEach(p => pageByKey[p.page_key] = p.id);

    const services = await sb('services', 'select=id,name,slug,page_id,category_id,media_id,image_url,href,is_active,display_order&order=display_order.asc');
    // resolve media
    const mids = services.filter(s => s.media_id).map(s => s.media_id);
    const media = mids.length ? await sb('media_assets', 'select=id,public_url,alt_text&or=(' + mids.map(i => 'id.eq.' + i).join(',') + ')') : [];
    const mediaById = {}; media.forEach(m => mediaById[m.id] = m);

    out.push('\n=== ALL SERVICES (with page_key + canonical media) ===');
    const pageIdByKey = {}; Object.keys(pageByKey).forEach(k => pageIdByKey[pageByKey[k]] = k);
    services.forEach(s => {
        const pk = pageIdByKey[s.page_id] || '(unknown page ' + s.page_id + ')';
        const murl = s.media_id ? (mediaById[s.media_id] ? mediaById[s.media_id].public_url : 'UNRESOLVED!') : 'NULL';
        out.push('  [' + (s.is_active ? 'active' : 'INACTIVE') + '] ' + s.name + ' (slug=' + s.slug + ')');
        out.push('      page=' + pk + ' | category=' + (s.category_id || 'none') + ' | ord=' + s.display_order + ' | href=' + (s.href || '-') + ' | media_id=' + (s.media_id ? 'SET' : 'NULL'));
        out.push('      canonical_url=' + murl);
        if (s.image_url) out.push('      legacy_image_url=' + s.image_url);
    });

    // static grid markup per page
    const PAGES = {
        restaurant: 'pages/experiences/restaurant.html',
        lounge: 'pages/experiences/lounge.html',
        vip: 'pages/experiences/vip.html',
        events: 'pages/business/events.html',
        conference: 'pages/business/conference.html',
        grooming: 'pages/business/grooming-care.html'
    };
    for (const [name, rel] of Object.entries(PAGES)) {
        const html = fs.readFileSync(root + '/' + rel, 'utf8');
        out.push('\n=== ' + name + ': grid markup context ===');
        // find each service-card block and capture its heading + img src
        const cardRe = /<a[^>]*class="[^"]*service-card[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
        let m, i = 0;
        while ((m = cardRe.exec(html))) {
            i++;
            const body = m[1];
            const h3 = (body.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '';
            const img = (body.match(/src="([^"]+)"/) || [])[1] || '(css bg or none)';
            const cls = (m[0].match(/class="([^"]*)"/) || [])[1];
            out.push('  card#' + i + ' [' + cls + '] h3="' + h3.trim().slice(0, 60) + '"');
            out.push('      img=' + img.slice(0, 130));
        }
        // article-based cards
        const artRe = /<article[^>]*class="[^"]*service-card[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
        while ((m = artRe.exec(html))) {
            i++;
            const h = (m[1].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '';
            const img = (m[1].match(/src="([^"]+)"/) || [])[1] || '(none)';
            out.push('  article-card#' + i + ' h3="' + h.trim().slice(0, 60) + '" img=' + img.slice(0, 130));
        }
        // page identity + explore section check
        out.push('  data-page: ' + ((html.match(/<body[^>]*data-page="([^"]*)"/) || [])[1] || '(none)'));
        out.push('  explore-section present: ' + /Explore\s*<span>|Our Services/i.test(html));
    }
    fs.writeFileSync(root + '/l3_aud4.txt', out.join('\n'), 'utf8');
})().catch(e => { fs.writeFileSync(root + '/l3_aud4.txt', 'FATAL: ' + (e.stack || e), 'utf8'); });
