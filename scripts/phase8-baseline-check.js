/** Phase 8 — Baseline checks: git status + Playwright availability */
const { execSync } = require('child_process');
const fs = require('fs');

const publicRepo = 'D:\\zt lounge\\zt-lounge-demo\\zt-lounge';
const adminRepo = 'D:\\zt lounge\\zt-lounge-demo\\zt-lounge-admin';

console.log('=== Git Status (public repo) ===');
try {
  const log = execSync('git --no-pager log --oneline -5', { cwd: publicRepo, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log('Recent commits:', log.trim());
} catch(e) { console.log('Git log error:', e.message.split('\n')[0]); }
try {
  const status = execSync('git --no-pager status --short', { cwd: publicRepo, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log('Git status:', status.trim() || '(clean)');
} catch(e) { console.log('Git status error:', e.message.split('\n')[0]); }
try {
  const diff = execSync('git --no-pager diff --stat', { cwd: publicRepo, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log('Diff stat:', diff.trim() || '(none)');
} catch(e) { console.log('Diff error:', e.message.split('\n')[0]); }

console.log('\n=== Playwright Check ===');
const pwPath = adminRepo + '\\node_modules\\playwright';
console.log('admin node_modules/playwright exists:', fs.existsSync(pwPath));
try {
  const pkg = JSON.parse(fs.readFileSync(adminRepo + '\\package.json', 'utf8'));
  const devDeps = pkg.devDependencies || {};
  console.log('playwright in devDeps:', JSON.stringify(devDeps).includes('playwright'));
  const allDeps = { ...devDeps, ...(pkg.dependencies || {}) };
  console.log('playwright anywhere in deps:', JSON.stringify(allDeps).includes('playwright'));
} catch(e) { console.log('package.json parse error:', e.message); }
try {
  const v = execSync('npx --no-install playwright --version', { cwd: adminRepo, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log('Playwright CLI version:', v.trim());
} catch(e) {
  console.log('npx playwright --version: NOT FOUND (need install)');
  console.log('  error:', e.message.split('\n')[0]);
}
try {
  const browsers = execSync('npx --no-install playwright install --dry-run chromium', { cwd: adminRepo, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log('Browser dry-run:', browsers.trim());
} catch(e) {
  console.log('Browser dry-run check:', e.message.split('\n').slice(0,3).join(' | '));
}
