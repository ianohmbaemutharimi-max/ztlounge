var path=require('path');
var fs=require('fs');
var cp=require('child_process');
var audit='d:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit';
var admin='d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin';
var npmCli='C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
var logPath=path.join(audit,'npm-playwright.log');
var logFd=fs.openSync(logPath,'w');
var child=cp.spawn('C:/Program Files/nodejs/node.exe',
  [npmCli,'install','playwright','@playwright/test','--save-dev','--no-audit','--no-fund'],
  {cwd:admin,detached:true,stdio:['ignore',logFd,logFd],
   env:Object.assign({},process.env,{NODE_ENV:'development'})});
child.unref();
console.log('playwright install PID '+child.pid);
console.log('logPath '+logPath);
setTimeout(function(){process.exit(0);},700);