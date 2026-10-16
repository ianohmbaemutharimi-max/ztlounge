var cp=require('child_process');
var fs=require('fs');
var admin='d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin';
var mode=process.argv[2]||'webpack';
var logPath='d:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit/nextdev-'+mode+'.log';
var errPath='d:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit/nextdev-'+mode+'.err.log';
var out=fs.openSync(logPath,'w');
var err=fs.openSync(errPath,'w');
var args=[admin+'/node_modules/next/dist/bin/next','dev','-p','3101'];
if(mode==='webpack'){args.push('--webpack');}
var child=cp.spawn('C:/Program Files/nodejs/node.exe',args,{cwd:admin,stdio:['ignore',out,err],env:Object.assign({},process.env,{NEXT_TELEMETRY_DISABLED:'1','NODE_OPTIONS':''})});
child.unref();
console.log('spawned PID '+child.pid+' mode='+mode);