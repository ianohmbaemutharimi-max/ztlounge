var cp=require('child_process');
var fs=require('fs');
var admin='d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin';
var log=fs.openSync('d:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit/npm-install.log','w');
var child=cp.spawn('C:/Program Files/nodejs/node.exe','node_modules/npm/bin/npm-cli.js install --no-audit --no-fund'.split(' '),{cwd:admin,detached:true,stdio:['ignore',log,log],env:Object.assign({},process.env,{NODE_ENV:'development'})});
child.unref();
console.log('npm install detached PID '+child.pid);
setTimeout(function(){process.exit(0);},600);
