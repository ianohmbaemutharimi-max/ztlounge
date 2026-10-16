const fs = require('fs');
const root = 'D:/zt lounge/zt-lounge-demo/zt-lounge';
const t = fs.readFileSync(root + '/l3_aud4.txt', 'utf8');
const a = t.indexOf('Haircut & Beard Grooming');
const b = t.indexOf('card#1 [service-card service-card-vip]');
const c = t.indexOf('===== restaurant: grid markup context ====');
const d = t.indexOf('===== vip: grid markup context ====');
fs.writeFileSync(root + '/l3_aud5.txt', '--- SERVICES TAIL ---\n' + t.slice(a, c) + '\n--- RESTAURANT + LOUNGE MARKUP ---\n' + t.slice(c, d), 'utf8');
