const http = require('http');
const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 8000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function analyze(body) {
  const usesShell = /id="site-header"/.test(body) || /shared-components\.js/.test(body);
  const darkMatch = body.match(/class="logo-dark site-logo"[^>]*\ssrc="([^"]+)"/) ||
                    body.match(/src="([^"]*)"[^>]*class="logo-dark site-logo"/) ||
                    body.match(/logo-dark site-logo"[^>]*src="([^"]+)"/);
  const lightMatch = body.match(/class="logo-light site-logo"[^>]*\ssrc="([^"]+)"/) ||
                     body.match(/src="([^"]*)"[^>]*class="logo-light site-logo"/) ||
                     body.match(/logo-light site-logo"[^>]*src="([^"]+)"/);
  return { usesShell, darkSrc: darkMatch ? darkMatch[1] : 'none', lightSrc: lightMatch ? lightMatch[1] : 'none' };
}

const pages = [
  'http://localhost:8000/',
  'http://localhost:8000/index_clean.html',
  'http://localhost:8000/pages/experiences/restaurant.html',
  'http://localhost:8000/pages/experiences/lounge.html',
  'http://localhost:8000/pages/experiences/vip.html',
  'http://localhost:8000/pages/business/events.html',
  'http://localhost:8000/pages/business/conference.html',
  'http://localhost:8000/pages/business/grooming-care.html',
  'http://localhost:8000/pages/contact/contact.html',
  'http://localhost:8000/pages/contact/gallery.html',
  'https://ztlounge.co.ke/',
];

(async () => {
  for (const url of pages) {
    try {
      const res = await fetch(url);
      const a = analyze(res.body);
      const swapped = (a.darkSrc.includes('logo.webp') && a.lightSrc.includes('logo-white')) ? 'SWAPPED!' :
                      (a.darkSrc === 'none' && a.lightSrc === 'none') ? 'dynamic' : 'ok';
      console.log(url);
      console.log('  status:', res.status, '| usesShell:', a.usesShell, '| darkSrc:', a.darkSrc, '| lightSrc:', a.lightSrc, '| =>', swapped);
    } catch (e) {
      console.log(url, 'FETCH ERROR:', e.message);
    }
  }
})();
