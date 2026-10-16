/**
 * Browser availability check: starts a static server, fetches index.html,
 * and verifies the logo img elements have correct initial src attributes
 * after the init-flash fix.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = 'D:\\zt lounge\\zt-lounge-demo\\zt-lounge';
const ct = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const srv = http.createServer((req, res) => {
  let f = decodeURIComponent(req.url.split('?')[0]);
  if (f === '/') f = '/index.html';
  const fp = path.join(root, f);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found: ' + fp); return; }
    res.writeHead(200, { 'Content-Type': ct[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

async function fetchPage(urlPath) {
  return new Promise((resolve) => {
    http.get('http://localhost:8080' + urlPath, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', (e) => resolve({ status: 0, error: e.message }));
  });
}

async function main() {
  await new Promise((resolve) => srv.listen(8080, resolve));
  console.log('Server started on http://localhost:8080');

  // 1. Fetch index.html
  console.log('\n=== Fetching index.html ===');
  const html = await fetchPage('/index.html');
  console.log('Status:', html.status);
  if (html.status !== 200) { console.log('Body:', html.body); return; }

  // 2. Check logo img elements
  console.log('\n=== Logo img element verification ===');
  const darkLogoMatch = html.body.match(/<img[^>]+class="[^"]*logo-dark[^"]*"[^>]*src="([^"]*)"/);
  const lightLogoMatch = html.body.match(/<img[^>]+class="[^"]*logo-light[^"]*"[^>]*src="([^"]*)"/);
  console.log('.logo-dark src:', darkLogoMatch ? darkLogoMatch[1] : 'NOT FOUND');
  console.log('.logo-light src:', lightLogoMatch ? lightLogoMatch[1] : 'NOT FOUND');

  // 3. Check that shared-components.js is referenced
  console.log('\n=== Script references ===');
  console.log('shared-components.js referenced:', html.body.includes('shared-components'));
  console.log('branding-init.js referenced:', html.body.includes('branding-init'));

  // 4. Fetch shared-components.js (syntax check via HTTP)
  console.log('\n=== Fetching shared-components.js ===');
  const js = await fetchPage('/assets/js/shared-components.js');
  console.log('Status:', js.status);
  if (js.status === 200) {
    // Count logo img src assignments
    const darkSrcLight = (js.body.match(/class="logo-dark[^"]*"[^>]*src="[^"]*logo-white/g) || []).length;
    const lightSrcDark = (js.body.match(/class="logo-light[^"]*"[^>]*src="[^"]*logo\.webp/g) || []).length;
    console.log('.logo-dark → logo-white.webp (LIGHT):', darkSrcLight, 'occurrence(s)');
    console.log('.logo-light → logo.webp (DARK):', lightSrcDark, 'occurrence(s)');
    console.log('Init-flash fix verified:', darkSrcLight >= 2 && lightSrcDark >= 2 ? 'YES ✅' : 'NO ❌');
  }

  // 5. Fetch navbar.css to verify display rules
  console.log('\n=== Fetching navbar.css (logo display rules) ===');
  const css = await fetchPage('/assets/css/components/navbar.css');
  console.log('Status:', css.status);
  if (css.status === 200) {
    console.log('.logo-dark {display:block}:', css.body.includes('.logo-dark { display: block; }') ? 'YES ✅' : 'NO');
    console.log('.logo-light {display:none}:', css.body.includes('.logo-light { display: none; }') ? 'YES ✅' : 'NO');
    console.log('.light-mode .logo-dark {display:none}:', css.body.includes('.light-mode .logo-dark { display: none; }') ? 'YES ✅' : 'NO');
    console.log('.light-mode .logo-light {display:block}:', css.body.includes('.light-mode .logo-light { display: block; }') ? 'YES ✅' : 'NO');
  }

  srv.close();
  console.log('\n=== Server closed ===');
}

main().catch(e => console.error('Fatal:', e.message));
