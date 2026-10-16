// READ-ONLY scanner: prints DB-scope / href / filter lines from the public website JS+HTML.
const fs = require('fs');
const path = require('path');
const root = 'D:\\zt lounge\\zt-lounge-demo\\zt-lounge';
const pats = [
  /services\.href/g,
  /\bgetServices\b/g,
  /getHeroSlides/g,
  /getMenuItems\b/g,
  /getMenuCategories\b/g,
  /getGallery\b/g,
  /getTestimonials\b/g,
  /getMembershipPlans\b/g,
  /getCustomerMemberships\b/g,
  /getBookings\b/g,
  /getBusinessSettings\b/g,
  /getWebsitePages\b/g,
  /getFeatures\b/g,
  /getGalleries\b/g,
  /getPages\b/g,
  /getFaqs\b/g,
  /getPromotions\b/g,
  /select\s*[:=,]\s*["']?([a-z_,\s*]+)/gi,
  /href\s*[:=]\s*["']([^"']+)/gi,
  /filter\s*[=:]\s*["']?([a-z_,\s*]+)/gi,
  /category_id\s*[:=]\s*["']?([a-z0-9_,\s*]+)/gi,
  /page_id\s*[:=]\s*["']?([a-z0-9_,\s*]+)/gi,
  /is_active\s*[:=]\s*["']?([a-z0-9_,\s*]+)/gi,
];
const out = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.isFile() && /\.(js|html)$/.test(ent.name)) {
      let txt;
      try { txt = fs.readFileSync(p, 'utf8'); } catch (e) { continue; }
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        for (const re of pats) {
          let m;
          re.lastIndex = 0;
          while ((m = re.exec(line)) !== null) {
            out.push([path.relative(root, p), i + 1, m[0].slice(0, 160)].join(': '));
          }
        }
      });
    }
  }
}
walk(root);
fs.writeFileSync('scripts\\public_grep.txt', out.join('\n'));
console.log('public_grep: ' + out.length + ' lines written');