const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const cl = fs.readFileSync(root + '/assets/js/content-loader.js', 'utf8');
const lines = cl.split('\n');
const out = [];
// find the init block: lines containing populateServiceCards() call and DOMContentLoaded/init
lines.forEach((l, i) => {
    if (/populateServiceCards\(\)|DOMContentLoaded|function init|function boot|window\.addEventListener\('load'|PageIdentity|getPageId\b/.test(l)) {
        out.push('L' + (i + 1) + ': ' + l.trim().slice(0, 150));
    }
});
// dump the init region (from first DOMContentLoaded to EOF, capped)
const idx = lines.findIndex(l => /DOMContentLoaded|function init\(/.test(l));
out.push('\n--- init region ---');
out.push(lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 80)).join('\n'));
// getPageId implementation
const gi = lines.findIndex(l => /function getPageId\(/.test(l));
if (gi > -1) {
    out.push('\n--- getPageId ---');
    out.push(lines.slice(gi, gi + 40).join('\n'));
}
fs.writeFileSync(root + '/l3_aud7.txt', out.join('\n'), 'utf8');
