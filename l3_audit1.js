// Loop 3 Phase A audit: architecture map
const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const out = [];
function sec(t) { out.push('\n===== ' + t + ' ====='); }

sec('content-loader.js populate functions');
const cl = fs.readFileSync(root + '/assets/js/content-loader.js', 'utf8');
const re = /function (populate\w+)\s*\(/g; let m;
while ((m = re.exec(cl))) {
    const line = cl.slice(0, m.index).split('\n').length;
    out.push('  line ' + line + ': function ' + m[1] + '()');
}
// where is populateServiceCards called / DOMContentLoaded wiring
out.push('\n-- init wiring (calls of populate*) --');
const re2 = /populate\w+\(\)/g; const calls = {};
while ((m = re2.exec(cl))) { calls[m[0]] = (calls[m[0]] || 0) + 1; }
Object.keys(calls).forEach(k => out.push('  ' + k + ' x' + calls[k]));

sec('ServicesRepository public API');
const sr = fs.readFileSync(root + '/assets/js/repositories/ServicesRepository.js', 'utf8');
const re3 = /(?:function |(\w+):\s*function|(\w+):\s*\(?)\s*\(?/g;
sr.split('\n').forEach((l, i) => {
    if (/^\s{4}\w+\s*[:=]/.test(l) || /return \{/.test(l) || /^\s{8}\w+/.test(l) && /function/.test(l)) {
        if (/function|\(\s*\)|\w+\s*\(/.test(l) && !/^\s*(\/\*|\*|\/\/)/.test(l)) out.push('  L' + (i + 1) + ': ' + l.trim().slice(0, 100));
    }
});
sec('ServicesRepository return block');
const retIdx = sr.lastIndexOf('return {');
out.push(sr.slice(retIdx, retIdx + 700));

sec('MediaResolver API');
const mr = fs.readFileSync(root + '/assets/js/repositories/MediaResolver.js', 'utf8');
const re4 = /function (\w+)\s*\(/g;
while ((m = re4.exec(mr))) out.push('  function ' + m[1] + '()');
const mrRet = mr.lastIndexOf('return {');
out.push(mr.slice(mrRet, mrRet + 400));

fs.writeFileSync(root + '/l3_aud1.txt', out.join('\n'), 'utf8');
