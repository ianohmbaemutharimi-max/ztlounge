/**
 * Replace all local image paths with Supabase Storage URLs.
 * Handles three path formats:
 *   1. "assets/images/..." (relative from root)
 *   2. "../../assets/images/..." (relative from pages subdirectories)
 *   3. "https://ztlounge.co.ke/assets/images/..." (absolute URLs)
 *
 * Also fixes broken references in theme.css.
 *
 * Usage: node scripts/replace-image-paths.js
 */

const fs = require('fs');
const path = require('path');

// Storage URL base
const STORAGE_BASE = 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/';

// Files to process
const FILES_TO_PROCESS = [
    // HTML files
    'index.html',
    '404.html',
    'pages/experiences/vip.html',
    'pages/experiences/restaurant.html',
    'pages/experiences/lounge.html',
    'pages/experiences/restaurant-menu.html',
    'pages/contact/gallery.html',
    'pages/contact/contact.html',
    'pages/business/events.html',
    'pages/business/conference.html',
    'pages/business/autospa.html',
    // CSS files
    'assets/css/theme.css',
    // JS config files
    'assets/js/gallery.config.js',
    'assets/js/services.config.js',
    'assets/js/business-config.js',
    'assets/js/menu.config.js',
    'assets/js/shared-components.js',
];

// Broken reference fixes (applied before path replacement)
const BROKEN_REFS = [
    { find: 'lounge/interior.webp', replace: 'lounge/lounge-interior.webp' },
    { find: 'lounge/bar.webp', replace: 'lounge/lounge-bar.webp' },
    { find: 'lounge/entertainment.webp', replace: 'lounge/lounge-nightlife.webp' },
    { find: 'vip/cabin.webp', replace: 'vip/vip-cabin-luxury.webp' },
    { find: 'vip/interior.webp', replace: 'vip/vip-interior.webp' },
    { find: 'vip/amenities.webp', replace: 'vip/vip-premium-seating.webp' },
    { find: 'autospa/premium-wash-bay.webp', replace: 'autospa/car-wash.webp' },
    { find: 'autospa/finished-vehicle.webp', replace: 'autospa/premium-finish.webp' },
];

// Project root
const ROOT = path.join(__dirname, '..');

// Stats
let totalReplacements = 0;
let filesModified = 0;
const fileStats = [];

function processFile(filePath) {
    const fullPath = path.join(ROOT, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log('  SKIP (not found): ' + filePath);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    let replacements = 0;
    
    // Step 1: Fix broken references first (before path replacement)
    for (const fix of BROKEN_REFS) {
        const findStr = 'assets/images/' + fix.find;
        const replaceStr = 'assets/images/' + fix.replace;
        const count = content.split(findStr).length - 1;
        if (count > 0) {
            content = content.split(findStr).join(replaceStr);
            replacements += count;
            console.log('  Fixed broken ref: ' + fix.find + ' -> ' + fix.replace + ' (' + count + ' occurrences)');
        }
    }
    
    // Step 2: Replace absolute URLs: https://ztlounge.co.ke/assets/images/
    const absFind = 'https://ztlounge.co.ke/assets/images/';
    const absCount = content.split(absFind).length - 1;
    content = content.split(absFind).join(STORAGE_BASE);
    replacements += absCount;
    
    // Step 3: Replace relative paths from pages: ../../assets/images/
    const relDeepFind = '../../assets/images/';
    const relDeepCount = content.split(relDeepFind).length - 1;
    content = content.split(relDeepFind).join(STORAGE_BASE);
    replacements += relDeepCount;
    
    // Step 4: Replace remaining relative paths from root: assets/images/
    // (the ../../ and absolute URL patterns have already been replaced above)
    const relRootFind = 'assets/images/';
    const relRootCount = content.split(relRootFind).length - 1;
    content = content.split(relRootFind).join(STORAGE_BASE);
    replacements += relRootCount;
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        filesModified++;
        totalReplacements += replacements;
        fileStats.push({ file: filePath, replacements: replacements });
        console.log('  OK ' + filePath + ': ' + replacements + ' replacements');
    } else {
        console.log('  - ' + filePath + ': no changes needed');
    }
}

// Main
console.log('=== Replace Image Paths with Storage URLs ===');
console.log('Storage base: ' + STORAGE_BASE);
console.log('');

// Process all files
for (const file of FILES_TO_PROCESS) {
    console.log('Processing: ' + file);
    processFile(file);
    console.log('');
}

// Summary
console.log('=== Replacement Complete ===');
console.log('Files modified: ' + filesModified);
console.log('Total replacements: ' + totalReplacements);
console.log('');

// Detailed stats
console.log('Per-file breakdown:');
fileStats.forEach(function(f) { console.log('  ' + f.file + ': ' + f.replacements + ' replacements'); });