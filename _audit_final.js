const fs = require('fs');
const path = require('path');

// 1. Is booking.js referenced anywhere?
let bookingJsRefs = [];
function walk(d) {
  if (d.includes('node_modules')) return;
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp);
    else if (/\.(html|js)$/.test(f)) {
      const src = fs.readFileSync(fp, 'utf8');
      if (/["']booking\.js["']/.test(src) && !src.includes('booking.config')) {
        bookingJsRefs.push(fp);
      }
    }
  }
}
walk('.');
console.log('=== booking.js referenced in ===');
console.log(bookingJsRefs.length ? bookingJsRefs.join('\n') : 'NOWHERE (orphaned)');

// 2. scripts/replace file
console.log('\n=== scripts/replace ===');
if (fs.existsSync('scripts/replace')) {
  console.log('size: ' + fs.statSync('scripts/replace').size + ' bytes, no extension');
  try {
    const b = fs.readFileSync('scripts/replace', 'utf8');
    console.log('content head: ' + JSON.stringify(b.slice(0, 150)));
    console.log('has CRLF: ' + b.includes('\r\n'));
  } catch (e) {
    console.log('not readable: ' + e.message);
  }
} else {
  console.log('MISSING');
}

// 3. Admin dir
console.log('\n=== ADMIN (../zt-lounge-admin) ===');
const admin = '../zt-lounge-admin';
console.log('exists: ' + fs.existsSync(admin));
if (fs.existsSync(admin)) {
  const envLocal = path.join(admin, '.env.local');
  const envExample = path.join(admin, '.env.example');
  console.log('.env.local: ' + (fs.existsSync(envLocal) ? 'PRESENT' : 'absent'));
  console.log('.env.example: ' + (fs.existsSync(envExample) ? 'PRESENT' : 'absent'));
  if (fs.existsSync(envLocal)) {
    const env = fs.readFileSync(envLocal, 'utf8');
    const lines = env.split('\n').filter(l => l.includes('=') && !/^\s*#/.test(l));
    console.log('keys: ' + lines.map(l => l.split('=')[0]).join(', '));
    console.log('values set: ' + lines.map(l => (l.split('=')[1] || '').trim().length > 0 ? 'SET' : 'EMPTY').join(', '));
  }
  // Check for .next build artifacts
  console.log('.next dir: ' + (fs.existsSync(path.join(admin, '.next')) ? 'present (built)' : 'absent'));
  console.log('package.json: ' + (fs.existsSync(path.join(admin, 'package.json')) ? 'PRESENT' : 'absent'));
}

// 4. Env example keys in root
console.log('\n=== .env.example ===');
if (fs.existsSync('.env.example')) {
  const e = fs.readFileSync('.env.example', 'utf8');
  console.log(e.split('\n').filter(l => l.includes('=') && !/^\s*#/.test(l)).map(l => l.split('=')[0]).join(', '));
}

// 5. env.js (runtime) - check what's exposed
console.log('\n=== assets/js/config/env.js ===');
if (fs.existsSync('assets/js/config/env.js')) {
  const src = fs.readFileSync('assets/js/config/env.js', 'utf8');
  const hasUrl = /supabase\.co/.test(src);
  const hasAnonKey = /eyJhbGciOiJIUzI1NiIs/.test(src);
  console.log('contains supabase URL: ' + hasUrl);
  console.log('contains anon key literal: ' + hasAnonKey);
  const urlMatch = src.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
  console.log('URL found: ' + (urlMatch ? urlMatch[0] : 'none'));
}

// 6. Page body classes / hero / font loading (performance quick check)
console.log('\n=== Performance indicators ===');
console.log('theme.css size: ' + (fs.existsSync('assets/css/theme.css') ? fs.statSync('assets/css/theme.css').size + ' bytes' : 'MISSING'));
const indexHtml = fs.readFileSync('index.html', 'utf8');
const ndEx = indexHtml.match(/src="https:\/\/fonts\.googleapis\.com[^"]*"/g) || [];
console.log('Google Fonts refs: ' + ndEx.length);
const jsDelivr = indexHtml.match(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/g) || [];
console.log('Supabase CDN: ' + (jsDelivr.length ? 'v2 (unpinned minor)' : 'none/null'));
const deferCount = (indexHtml.match(/<script[^>]*defer/g) || []).length;
const asyncCount = (indexHtml.match(/<script[^>]*async/g) || []).length;
console.log('scripts with defer: ' + deferCount + ', async: ' + asyncCount);
const preloadCount = (indexHtml.match(/rel="preload"/g) || []).length;
console.log('preload hints: ' + preloadCount);

// 7. Check for lazy loading
const lazyImgs = (indexHtml.match(/loading="lazy"/g) || []).length;
console.log('lazy images on home: ' + lazyImgs + ' of 15 imgs');