/**
 * Fix double-prefixed Storage URLs and remaining issues from the
 * initial path replacement.
 *
 * Issues to fix:
 * 1. Double-prefixed URLs: "public-https://...public-assets/images/" → "https://...public-assets/images/"
 * 2. site.webmanifest not processed
 * 3. Additional broken autospa references (paint-detailing, interior-detailing, ceramic-protection)
 *
 * Usage: node scripts/fix-image-paths.js
 */

var fs = require('fs');
var path = require('path');

// The correct Storage URL base
var STORAGE_BASE = 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/';

// The double-prefixed pattern to fix
var DOUBLE_PREFIX = 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/';

// Additional broken autospa references
var BROKEN_AUTOSPA = [
    { find: 'autospa/paint-detailing.webp', replace: 'autospa/car-detailing.webp' },
    { find: 'autospa/interior-detailing.webp', replace: 'autospa/autospa-1.webp' },
    { find: 'autospa/ceramic-protection.webp', replace: 'autospa/premium-finish.webp' }
];

// Files to process
var FILES_TO_PROCESS = [
    'index.html',
    '404.html',
    'site.webmanifest',
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
    'assets/js/gallery.config.js',
    'assets/js/services.config.js',
    'assets/js/business-config.js',
    'assets/js/menu.config.js',
    'assets/js/shared-components.js',
];

var ROOT = path.join(__dirname, '..');
var totalFixes = 0;
var filesFixed = 0;

function processFile(filePath) {
    var fullPath = path.join(ROOT, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log('  SKIP (not found): ' + filePath);
        return;
    }
    
    var content = fs.readFileSync(fullPath, 'utf8');
    var originalContent = content;
    var fixes = 0;
    
    // Fix 1: Remove double-prefixed URLs
    var doubleCount = content.split(DOUBLE_PREFIX).length - 1;
    if (doubleCount > 0) {
        content = content.split(DOUBLE_PREFIX).join(STORAGE_BASE);
        fixes += doubleCount;
        console.log('  Fixed double-prefix: ' + doubleCount + ' occurrences');
    }
    
    // Fix 2: Fix additional broken autospa references
    for (var i = 0; i < BROKEN_AUTOSPA.length; i++) {
        var fix = BROKEN_AUTOSPA[i];
        var findStr = STORAGE_BASE + fix.find;
        var replaceStr = STORAGE_BASE + fix.replace;
        var count = content.split(findStr).length - 1;
        if (count > 0) {
            content = content.split(findStr).join(replaceStr);
            fixes += count;
            console.log('  Fixed broken ref: ' + fix.find + ' -> ' + fix.replace + ' (' + count + ' occurrences)');
        }
    }
    
    // Fix 3: Replace any remaining local paths in site.webmanifest
    var localFind = 'assets/images/';
    var localCount = content.split(localFind).length - 1;
    if (localCount > 0) {
        content = content.split(localFind).join(STORAGE_BASE);
        fixes += localCount;
        console.log('  Fixed local paths: ' + localCount + ' occurrences');
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        filesFixed++;
        totalFixes += fixes;
        console.log('  OK ' + filePath + ': ' + fixes + ' fixes');
    } else {
        console.log('  - ' + filePath + ': no fixes needed');
    }
}

console.log('=== Fix Image Paths ===');
console.log('');

for (var i = 0; i < FILES_TO_PROCESS.length; i++) {
    console.log('Processing: ' + FILES_TO_PROCESS[i]);
    processFile(FILES_TO_PROCESS[i]);
    console.log('');
}

console.log('=== Fix Complete ===');
console.log('Files fixed: ' + filesFixed);
console.log('Total fixes: ' + totalFixes);