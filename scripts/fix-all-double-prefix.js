/**
 * Final fix: Remove ALL double-prefixed Storage URLs from every file.
 * This script ONLY removes double-prefixes — it does NOT do any
 * assets/images/ replacement (which caused the bug in the first place).
 *
 * Usage: node scripts/fix-all-double-prefix.js
 */

var fs = require('fs');
var path = require('path');

var STORAGE_BASE = 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/';
var DOUBLE_PREFIX = 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/';

var ROOT = path.join(__dirname, '..');
var totalFixes = 0;
var filesFixed = 0;

// ALL files that may have double-prefixed URLs
var ALL_FILES = [
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

function fixFile(filePath) {
    var fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log('  SKIP: ' + filePath);
        return;
    }
    
    var content = fs.readFileSync(fullPath, 'utf8');
    var originalContent = content;
    
    // Replace double-prefixed URLs with correct Storage URLs
    var count = content.split(DOUBLE_PREFIX).length - 1;
    if (count > 0) {
        content = content.split(DOUBLE_PREFIX).join(STORAGE_BASE);
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        filesFixed++;
        totalFixes += count;
        console.log('  OK ' + filePath + ': ' + count + ' fixes');
    } else {
        console.log('  - ' + filePath + ': already correct');
    }
}

console.log('=== Final Double-Prefix Fix ===');
console.log('');

for (var i = 0; i < ALL_FILES.length; i++) {
    fixFile(ALL_FILES[i]);
}

console.log('');
console.log('Files fixed: ' + filesFixed);
console.log('Total fixes: ' + totalFixes);