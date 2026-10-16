const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const adminPath = 'd:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin';
const logDir = 'd:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit';

function run(cmd) {
  try {
    return cp.execSync(cmd, { encoding: 'utf8', timeout: 10000, stdio: ['pipe','pipe','pipe'] }).trim();
  } catch (e) {
    return (e.stdout||'').toString().trim() + '\n' + (e.stderr||'').toString().trim();
  }
}

function taskkillNode() {
  run('taskkill /F /IM node.exe /T');
  try { fs.rmSync('D:/zt lounge/zt-lounge-demo/zt-lounge/.next', { recursive: true, force: true }); } catch(e){}
  try { fs.rmSync('D:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/.next', { recursive: true, force: true }); } catch(e){}
  try { fs.rmSync('D:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/.turbo', { recursive: true, force: true }); } catch(e){}
  try { fs.unlinkSync('D:/zt lounge/zt-lounge-demo/zt-lounge/.next/server/next.pid'); } catch(e){}
  try { fs.unlinkSync('D:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/.next/server/next.pid'); } catch(e){}
  run('powershell -Command "Get-ChildItem \'D:\\zt lounge\\zt-lounge-demo\\zt-lounge\\zt-lounge-admin\' -Filter \'next.pid\' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item $_.FullName -Force }"');
}

function ensureAdminDeps() {
  const postcssPkg = 'D:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/node_modules/@tailwindcss/postcss/package.json';
  if (!fs.existsSync(postcssPkg)) {
    console.log('Installing @tailwindcss/postcss...');
    cp.execSync('npm install @tailwindcss/postcss --save-dev --no-audit --no-fund', {
      cwd: adminPath,
      stdio: 'inherit',
      timeout: 120000
    });
  } else {
    console.log('@tailwindcss/postcss already installed');
  }
}

function cleanupLogs() {
  try { fs.unlinkSync(path.join(logDir, 'nextdev-webpack.log')); } catch(e){}
  try { fs.unlinkSync(path.join(logDir, 'nextdev-webpack.err.log')); } catch(e){}
}

function bootServer(mode) {
  cleanupLogs();
  
  var logPath = path.join(logDir, 'nextdev-' + mode + '.log');
  var errPath = path.join(logDir, 'nextdev-' + mode + '.err.log');
  
  var out = fs.openSync(logPath, 'w');
  var err = fs.openSync(errPath, 'w');
  
  var nextBin = path.join(adminPath, 'node_modules/next/dist/bin/next');
  var args = ['dev', '-p', '3101'];
  if (mode === 'webpack') {
    args.push('--webpack');
  }
  
  var child = cp.spawn('C:/Program Files/nodejs/node.exe',
    [nextBin].concat(args), {
      cwd: adminPath,
      detached: true,
      stdio: ['ignore', out, err],
      env: Object.assign({}, process.env, {
        NEXT_TELEMETRY_DISABLED: '1',
        NODE_OPTIONS: ''
      })
    }
  );
  
  child.unref();
  
  console.log(JSON.stringify({
    pid: child.pid,
    mode: mode,
    logPath: logPath,
    errPath: errPath,
    args: args
  }));
}

var mode = process.argv[2] || 'webpack';

console.log('=== Cleaning up stale processes and caches ===');
taskkillNode();
console.log('=== Ensuring dependencies ===');
ensureAdminDeps();
console.log('=== Booting server (mode: ' + mode + ') ===');
bootServer(mode);
console.log('Done. Server launched.');
