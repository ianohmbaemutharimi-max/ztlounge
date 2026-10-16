/**
 * HERO PHASE 3B — Admin UI click-path via Playwright (audit-only)
 * Uses login form + hero tab + media picker. No API bypass.
 */
var http=require('http');
var fs=require('fs');
var path=require('path');
var ROOT='d:/zt lounge/zt-lounge-demo/zt-lounge';
var ADMIN='http://localhost:3101';
var PW='d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/node_modules/playwright';
var PORT=8896;
var MIME={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon'};
var server=http.createServer(function(req,res){
  var p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  var file=path.join(ROOT,p);
  if(!fs.existsSync(file)){res.writeHead(404);res.end('nf');return;}
  res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
var TARGET_MEDIA='141ce2ea-6bf1-463d-a390-5faf426a74d4';
var HERO_ID='78eeb5cb-5070-42b0-9959-66e76cb0ba4f';
async function main(){
  var chromium=require(PW).chromium;
  var browser=await chromium.launch({headless:true});
  var ctx=await browser.newContext({viewport:{width:1400,height:950}});
  var page=await ctx.newPage();
  // 1. LOGIN
  await page.goto(ADMIN+'/login',{waitUntil:'networkidle',timeout:45000});
  console.log('LOGIN page title:',await page.title());
  await page.fill('#email','admin@salon.com');
  await page.fill('#password','Manager123!');
  await Promise.all([
    page.waitForNavigation({waitUntil:'networkidle',timeout:45000}).catch(function(e){console.log('nav wait:',e.message);}),
    page.click('button[type=\"submit\"]')
  ]);
  console.log('after login URL:',page.url());
  var bodyText=await page.evaluate(function(){return document.body.innerText.substring(0,300);});
  console.log('after login body:',bodyText.replace(/\n+/g,' | '));
  if(page.url().indexOf('login')>=0){console.log('LOGIN FAILED — stopping');await browser.close();process.exit(1);}
  // 2. NAVIGATE to CMS/hero
  await page.goto(ADMIN+'/dashboard/cms',{waitUntil:'networkidle',timeout:60000}).catch(function(){});
  await page.waitForTimeout(3000);
  console.log('CMS URL:',page.url());
  console.log('CMS body:',(await page.evaluate(function(){return document.body.innerText;})).substring(0,500).replace(/\n+/g,' | '));
  await browser.close();
  server.close();
  console.log('DONE');
}
main().catch(function(e){console.error('FATAL:',e.message);process.exit(1);});
