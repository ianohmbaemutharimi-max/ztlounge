var url=process.argv[2]||'http://localhost:3101/login';
var ac=new AbortController();
var t=setTimeout(function(){ac.abort();},15000);
fetch(url,{signal:ac.signal,redirect:'manual'}).then(function(r){
  return r.text().then(function(b){
    clearTimeout(t);
    console.log('STATUS',r.status,'LEN',b.length);
    console.log(b.substring(0,400).replace(/\s+/g,' '));
    process.exit(0);
  });
}).catch(function(e){clearTimeout(t);console.log('ERR',e.name,e.message);process.exit(1);});
