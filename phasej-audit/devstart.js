var cp=require('child_process');
var fs=require('fs');
var admin='d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin';
var args=process.argv.slice(2);
var mode=args[0]||'webpack';
var out=fs.openSync('d:/zt lounge/zt-lounge-demo/zt-lounge/phasej-audit/nextdev-'+mode+'.log','w');
var nextArgs=[admin+'/node_modules/next/dist/bin/next','dev','-p','3101'];
if(mode==='webpack'){nextArgs.push('--webpack');}
var child=cp.spawn('C:/Program Files/nodejs/node.exe',nextArgs,{cwd:admin,detached:true,stdio:['ignore',out,out],env:Object.assign({},process.env,{NEXT_TELEMETRY_DISABLED:'1'})});
child.unref();
console.log('spawned PID '+child.pid+' mode='+mode);