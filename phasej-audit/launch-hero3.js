var cp=require('child_process');

var child=cp.spawn('node',['phasej-audit/hero-phase3-ui.js'],{
  cwd:'D:/zt lounge/zt-lounge-demo/zt-lounge',
  env:Object.assign({},process.env,{PATH:process.env.PATH}),
  stdio:['ignore','ignore','ignore'],
  detached:true
});
child.unref();
setTimeout(function(){process.exit(0);},400);
