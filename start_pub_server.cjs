var fs = require('fs');
var cp = require('child_process');

var ROOT = 'd:/zt lounge/zt-lounge-demo/zt-lounge';
var script = ROOT + '/_public_server.js';
var logFile = ROOT + '/_pub8000.log';

// Kill anything already on port 8000
try { cp.execSync('taskkill /f /im node.exe /t /fi "WINDOWTITLE eq pub8000" >nul 2>&1', {stdio: 'pipe'}); } catch(e) {}

// Truncate log
fs.writeFileSync(logFile, 'START ' + Date.now() + '\n');

var out = fs.openSync(logFile, 'a');
var child = cp.spawn(process.execPath, [script], {
  cwd: ROOT,
  stdio: ['ignore', out, out],
  detached: true,
  windowsHide: false
});
child.unref();

console.log('Public server launched, PID: ' + child.pid);

// Poll for readiness
var http = require('http');
var waited = 0;
var interval = setInterval(function() {
  waited++;
  var req = http.get({hostname: 'localhost', port: 8000, path: '/', timeout: 2000}, function(res) {
    console.log('Server UP at ' + waited + 's, status: ' + res.statusCode);
    clearInterval(interval);
    process.exit(0);
  });
  req.on('error', function(e) {
    if (waited < 15) {
      // not ready yet
    } else {
      console.log('Server not ready after ' + waited + 's');
      clearInterval(interval);
      process.exit(1);
    }
  });
  req.on('timeout', function() { req.destroy(); });
  setTimeout(function() { req.destroy(); }, 2100);
}, 1000);
