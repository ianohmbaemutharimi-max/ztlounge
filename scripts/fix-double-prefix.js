/**
 * Fix double-prefixed Storage URLs ONLY.
 * Does NOT touch files that already have correct Storage URLs.
 * Handles site.webmanifest separately (it was not processed by the original script).
 *
 * Usage: node scripts/fix-double-prefix.js
 */

var fs = require('fs');
var path = require('path');

var STORAGE_BASE = 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/';
var DOUBLE_PREFIX = 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/';

// Additional broken autospa references (using Storage URLs)
var BROKEN_AUTOSPA = [
    { find: 'autospa/paint-detailing.webp', replace: 'autospa/car-detailing.webp' },
    { find: 'autospa/interior-detailing.webp', replace: 'autospa/autospa-1.webp' },
    { find: 'autospa/ceramic-protection.webp', replace: 'autospa/premium-finish.webp' }
];

var ROOT = path.join(__dirname, '..');
var totalFixes = 0;
var filesFixed = 0;

// Files that may have double-prefixed URLs
var DOUBLE_PREFIX_FILES = [
    'index.html',
    'pages/experiences/vip.html',
    'pages/experiences/restaurant.html',
    'pages/experiences/lounge.html',
    'pages/experiences/restaurant-menu.html',
    'pages/contact/gallery.html',
    'pages/contact/contact.html',
    'pages/business/events.html',
    'pages/business/conference.html',
    'pages/business/autospa.html',
    'assets/css/theme.css',
];

// site.webmanifest needs local paths replaced (was not processed before)
var MANIFEST_FILE = 'site.webmanifest';

function fixDoublePrefixes(filePath) {
    var fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) return;
    
    var content = fs.readFileSync(fullPath, 'utf8');
    var originalContent = content;
    var fixes = 0;
    
    // Fix double-prefixed URLs
    var count = content.split(DOUBLE_PREFIX).length - 1;
    if (count > 0) {
        content = content.split(DOUBLE_PREFIX).join(STORAGE_BASE);
        fixes += count;
    }
    
    // Fix broken autospa references (only for autospa.html)
    if (filePath.indexOf('autospa') !== -1) {
        for (var i = 0; i < BROKEN_AUTOSPA.length; i++) {
            var fix = BROKEN_AUTOSPA[i];
            var findStr = STORAGE_BASE + fix.find;
            var replaceStr = STORAGE_BASE + fix.replace;
            var cnt = content.split(findStr).length - 1;
            if (cnt > 0) {
                content = content.split(findStr).join(replaceStr);
                fixes += cnt;
            }
        }
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        filesFixed++;
        totalFixes += fixes;
        console.log('  OK ' + filePath + ': ' + fixes + ' fixes');
    } else {
        console.log('  - ' + filePath + ': already correct');
    }
}

function fixManifest(filePath) {
    var fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) return;
    
    var content = fs.readFileSync(fullPath, 'utf8');
    var originalContent = content;
    
    // Replace local paths with Storage URLs
    var count = content.split('assets/images/').length - 1;
    content = content.split('assets/images/').join(STORAGE_BASE);
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        filesFixed++;
        totalFixes += count;
        console.log('  OK ' + filePath + ': ' + count + ' fixes');
    } else {
        console.log('  - ' + filePath + ': no changes needed');
    }
}

console.log('=== Fix Double-Prefix URLs ===');
console.log('');

console.log('Fixing double-prefixed URLs:');
for (var i = 0; i < DOUBLE_PREFIX_FILES.length; i++) {
    fixDoublePrefixes(DOUBLE_PREFIX_FILES[i]);
}

console.log('');
console.log('Fixing site.webmanifest:');
fixManifest(MANIFEST_FILE);

console.log('');
console.log('=== Fix Complete ===');
console.log('Files fixed: ' + filesFixed);
console.log('Total fixes: ' + totalFixes);