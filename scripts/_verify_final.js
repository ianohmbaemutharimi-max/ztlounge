const fs = require('fs');
const { execSync } = require('child_process');

// 1. Re-create test file from current HEAD (post-fix commit)
const headContent = execSync('git show HEAD:index.html').toString('utf8');
fs.writeFileSync('_committed_index_fixed.html', headContent, 'utf8');
console.log('1. Re-created _committed_index_fixed.html from HEAD (d183dda)');

// 2. Verify HEAD has correct logo assignments
const lines = headContent.split('\n');
let allCorrect = true;
lines.forEach((x, i) => {
    // Find img tags with both src and class on same line
    if (x.includes('class="logo-dark site-logo"') && x.includes('src=')) {
        const isLight = x.includes('logo-white.webp');
        console.log('   HEAD line ' + (i+1) + ': .logo-dark -> ' + (isLight ? 'logo-white.webp' : 'logo.webp') + (isLight ? ' ✓' : ' ✗ BUG'));
        if (!isLight) allCorrect = false;
    }
    if (x.includes('class="logo-light site-logo"') && x.includes('src=')) {
        const isDark = x.includes('logo.webp') && !x.includes('logo-white');
        console.log('   HEAD line ' + (i+1) + ': .logo-light -> ' + (isDark ? 'logo.webp' : 'logo-white.webp') + (isDark ? ' ✓' : ' ✗ BUG'));
        if (!isDark) allCorrect = false;
    }
});

// 3. Check lines where src and class are on different lines (logo-light)
lines.forEach((x, i) => {
    if (x.includes('src=') && x.includes('branding/logo.webp') && !x.includes('logo-white')) {
        // Look ahead for class="logo-light site-logo"
        for (let j = i; j < Math.min(i + 6, lines.length); j++) {
            if (lines[j].includes('class="logo-light site-logo"')) {
                console.log('   HEAD (multi-line src): .logo-light -> logo.webp ✓');
                break;
            }
        }
    }
});

console.log('\n2. HEAD fix verification: ' + (allCorrect ? 'ALL CORRECT ✓' : 'BUGS REMAIN ✗'));
console.log('   Commit: ' + execSync('git log --oneline -1').toString().trim());
