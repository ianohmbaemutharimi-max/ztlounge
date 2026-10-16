const { execSync } = require('child_process');
const dir = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const out = execSync(`git -C "${dir}" diff --stat HEAD -- *.js *.html *.css *.json`, { encoding: 'utf8' });
console.log(out);
const st = execSync(`git -C "${dir}" status --short`, { encoding: 'utf8' });
console.log('STATUS:');
console.log(st);
