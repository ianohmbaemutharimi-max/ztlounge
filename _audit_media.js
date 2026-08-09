const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const pages = [
  'index.html',
  '404.html',
  'pages/experiences/restaurant.html',
  'pages/experiences/restaurant-menu.html',
  'pages/experiences/lounge.html',
  'pages/experiences/vip.html',
  'pages/business/events.html',
  'pages/business/conference.html',
  'pages/business/autospa.html',
  'pages/contact/gallery.html',
  'pages/contact/contact.html'
];

const urls = new Set();

for (const p of pages) {
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, 'utf8');
  const re = /(?:src|href|poster|content)="(https:\/\/[^"]+\.(?:webp|jpg|jpeg|png|gif|svg|avif|ico|mp4|webm)[^"]*)"/g;
  const found = [...html.matchAll(re)].map(m => m[1]);
  for (const f of found) {
    if (f.includes('supabase.co')) urls.add(f);
  }
}

// Also scan JS config files for image URLs
const jsFiles = [
  'assets/js/hero.config.js',
  'assets/js/gallery.config.js',
  'assets/js/menu.config.js',
  'assets/js/testimonials.config.js',
  'assets/js/faq.config.js',
  'assets/js/services.config.js',
  'assets/js/business-config.js',
  'assets/js/booking.config.js',
  'assets/js/contact.config.js'
];
for (const jf of jsFiles) {
  if (!fs.existsSync(jf)) continue;
  const js = fs.readFileSync(jf, 'utf8');
  const re = /(https:\/\/[^"'\s]+\.(?:webp|jpg|jpeg|png|gif|svg|avif))/g;
  const found = [...js.matchAll(re)].map(m => m[1]);
  for (const f of found) {
    if (f.includes('supabase.co')) urls.add(f);
  }
}

console.log('Total unique Supabase media URLs: ' + urls.size);

function check(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 15000 }, (res) => {
      // Only read a small amount to avoid downloading full images
      res.on('data', () => { res.destroy(); });
      res.on('end', () => resolve({ url, status: res.statusCode, ok: res.statusCode < 400 }));
      resolve({ url, status: res.statusCode, ok: res.statusCode < 400 });
    });
    req.on('error', (e) => resolve({ url, status: 'ERR', ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 'TIMEOUT', ok: false }); });
  });
}

(async () => {
  const results = [];
  const concurrency = 6;
  const arr = [...urls];
  for (let i = 0; i < arr.length; i += concurrency) {
    const batch = arr.slice(i, i + concurrency);
    const res = await Promise.all(batch.map(check));
    results.push(...res);
  }
  console.log('=== CHECK RESULTS ===');
  let totalBytes = 0;
  const bad = results.filter(r => !r.ok);
  for (const r of results) {
    const label = r.ok ? 'OK ' : 'FAIL';
    console.log(label + ' ' + r.status + ' ' + r.url);
  }
  console.log('\n=== SUMMARY ===');
  console.log('Checked: ' + results.length);
  console.log('OK: ' + results.filter(r => r.ok).length);
  console.log('Failed: ' + bad.length);
  for (const b of bad) console.log('  FAIL: ' + b.status + ' ' + b.url + (b.error ? ' (' + b.error + ')' : ''));
})();