const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const ADMIN = 'd:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin';
const AUDIT = 'd:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit';
const LOG = path.join(AUDIT, 'nextdev-webpack.log');
const ERR = path.join(AUDIT, 'nextdev-webpack.err.log');
const NEXT_BIN = path.join(ADMIN, 'node_modules/next/dist/bin/next');

// clean caches so we pick up the fixed next.config.ts
function clean() {
  const dirs = [
    path.join(ADMIN, '.next'),
    path.join(ADMIN, '.turbo'),
    path.join('d:/zt lounge/zt-lounge-demo/zt-lounge', '.next')
  ];
  for (const d of dirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch(e){} }
  // kill any leftover next.pid files
  try { fs.unlinkSync(path.join(ADMIN, '.next/server/next.pid')); } catch(e){}
  try { fs.unlinkSync(path.join('d:/zt lounge/zt-lounge-demo/zt-lounge/.next/server/next.pid')); } catch(e){}
}

function boot() {
  // truncate logs
  fs.writeFileSync(LOG, '');
  fs.writeFileSync(ERR, '');

  const outFd = fs.openSync(LOG, 'a');
  const errFd = fs.openSync(ERR, 'a');

  const args = ['dev', '-p', '3101', '--webpack'];
  const child = cp.spawn('C:/Program Files/nodejs/node.exe',
    [NEXT_BIN].concat(args), {
      cwd: ADMIN,
      detached: true,
      stdio: ['ignore', outFd, errFd],
      env: Object.assign({}, process.env, {
        NEXT_TELEMETRY_DISABLED: '1',
        NODE_OPTIONS: ''
      })
    }
  );
  child.unref();
  console.log(JSON.stringify({ pid: child.pid, log: LOG, err: ERR }));
}

clean();
boot();
console.log('launched');
