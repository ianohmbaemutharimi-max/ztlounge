var net=require('net');
var s=net.connect({port:3101,host:'127.0.0.1'});
s.setTimeout(4000);
s.on('connect',function(){console.log('PORT 3101 OPEN');s.destroy();process.exit(0);});
s.on('timeout',function(){console.log('PORT 3101 TIMEOUT');s.destroy();process.exit(1);});
s.on('error',function(e){console.log('PORT 3101 CLOSED:',e.code);process.exit(1);});
