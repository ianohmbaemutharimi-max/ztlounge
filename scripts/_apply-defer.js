const fs = require('fs');

const files = [
  'index.html',
  'pages/experiences/vip.html',
  'pages/experiences/lounge.html',
  'pages/experiences/restaurant-menu.html',
  'pages/business/events.html',
  'pages/business/conference.html',
  'pages/business/autospa.html',
  'pages/contact/gallery.html'
];

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const o = s;
  // Fix corrupted escaped newline: `</script>`n` -> `</script>\n`
  s = s.replace(/<\/script>`n/g, '</script>\n');
  // Add defer to external scripts that don't already have it
  s = s.replace(/<script src="([^"]+)"(?!\s*defer)([^>]*)><\/script>/g, '<script src="$1"$2 defer></script>');
  if (s !== o) {
    fs.writeFileSync(f, s);
    console.log(f + ': updated');
  } else {
    console.log(f + ': unchanged');
  }
}