var cp=require('child_process');
try{
  var out=cp.execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH',{encoding:'utf8',timeout:5000}).trim();
  if(out===''){console.log('NO_NODE_PROCESSES');process.exit(0);}
  out.split('\n').forEach(function(l){console.log(l);});
}catch(e){console.log('execSync failed:',e.code||e.message);}
