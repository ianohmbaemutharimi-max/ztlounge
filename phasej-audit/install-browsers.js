var path=require('path');
var fs=require('fs');
var cp=require('child_process');
var admin='d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin';
var cli=admin+'/node_modules/playwright/cli.js';
if(!fs.existsSync(cli)){console.log('cli missing at '+cli);process.exit(1);}
var log=fs.openSync('d:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit/playwright-install.log','w');
var child=cp.spawn('C:/Program Files/nodejs/node.exe',
  [cli,'install','chromium'],
  {cwd:admin,detached:true,stdio:['ignore',log,log],
   env:Object.assign({},process.env,{PLAYWRIGHT_BROWSERS_PATH:''})});
child.unref();
console.log('browser install PID '+child.pid);
console.log('logPath d:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit/playwright-install.log');
setTimeout(function(){process.exit(0);},700);