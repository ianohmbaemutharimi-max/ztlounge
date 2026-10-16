/**
 * HERO PHASE 3 — Admin UI login test (audit-only, no bypass)
 * Uses the documented development credential from create-test-users.js.
 * Drives the REAL login form. No API bypass, no JWT injection, no RBAC weakening.
 */
var fs=require('fs');
var path=require('path');

var ROOT='d:/zt lounge/zt-lounge-demo/zt-lounge';
var ADMIN='http://localhost:3101';
var PW_PATH='d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/node_modules/playwright';

var EMAIL='manager@test.com';
var PASSWORD='Manager123!';

var TARGET_HERO='78eeb5cb-5070-42b0-9959-66e76cb0ba4f';
var TARGET_MEDIA='141ce2ea-6bf1-463d-a390-5faf426a74d4';

var consoleErrors=[];
var failedRequests=[];

async function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}

async function run(){
  var pw=require(PW_PATH);
  var chrome=pw.chromium;
  var browser=await chrome.launch({headless:true});
  var ctx=await browser.newContext({
    viewport:{width:1400,height:950},
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
  });
  var page=await ctx.newPage();

  page.on('console',function(msg){
    if(msg.type()==='error'){consoleErrors.push(msg.text());}
  });
  page.on('requestfailed',function(req){
    failedRequests.push(req.url()+' | '+req.failure()?.errorText);
  });

  console.log('=== HERO PHASE 3 — UI LOGIN TEST ===');
  console.log('Admin URL:',ADMIN+'/login');
  console.log('Credential:',EMAIL,'/',PASSWORD);
  console.log('');

  // STEP 1 — LOGIN
  console.log('STEP 1 — LOGIN');
  try{
    await page.goto(ADMIN+'/login',{waitUntil:'domcontentloaded',timeout:45000});
    await sleep(2500);
    console.log('Page title:',await page.title());
    var pageUrl=page.url();
    console.log('After load URL:',pageUrl);

    if(pageUrl.indexOf('/login')<0){
      console.log('UNEXPECTED: already on',pageUrl);
    }

    // Fill the real login form
    var emailField=await page.$('#email');
    var passwordField=await page.$('#password');
    var submitBtn=await page.$('button[type="submit"]');
    console.log('email field present:',!!emailField);
    console.log('password field present:',!!passwordField);
    console.log('submit button present:',!!submitBtn);

    if(!emailField||!passwordField||!submitBtn){
      console.log('BLOCKED — login form elements missing');
      console.log('_console errors so far:',consoleErrors.length);
      console.log('failed requests so far:',failedRequests.length);
      await browser.close();
      process.exit(1);
    }

    await page.fill('#email',EMAIL);
    await page.fill('#password',PASSWORD);
    console.log('Filled credentials into real form fields');

    // Capture pre-click URL
    var beforeUrl=page.url();

    // Submit via the real button
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:45000}),
      page.click('button[type="submit"]')
    ]).catch(function(e){
      console.log('Navigation wait rejected:',e.message);
    });

    var afterUrl=page.url();
    console.log('After submit URL:',afterUrl);

    // Give the app a moment to render any error state
    await sleep(3000);

    var bodyText=await page.evaluate(function(){
      return document.body?document.body.innerText.substring(0,600):'';
    });
    console.log('After submit body excerpt:');
    console.log(bodyText.replace(/\n+/g,' | '));

    // Read any alert/error box
    var alertText='';
    try{
      var alerts=await page.$$eval('div[role="alert"], .text-rose-400, [class*="rose"]',function(nodes){
        return nodes.map(function(n){return n.innerText;});
      });
      alertText=alerts.join(' || ');
    }catch(e){}
    console.log('Alert text:',alertText||'(none)');

    var loginFailed=afterUrl.indexOf('/login')>=0;
    console.log('Login succeeded:',!loginFailed);

    if(loginFailed){
      console.log('RESULT: login FAILED via real form');
    }else{
      console.log('RESULT: login SUCCEEDED — would continue to hero edit (not executed here)');
    }

  }catch(e){
    console.log('FATAL during login step:',e.message);
  }

  console.log('');
  console.log('=== METRICS ===');
  console.log('Console errors:',consoleErrors.length);
  consoleErrors.forEach(function(e){console.log('  - '+e);});
  console.log('Failed requests:',failedRequests.length);
  failedRequests.forEach(function(r){console.log('  - '+r);});

  await browser.close();
  console.log('=== DONE ===');
}

run().catch(function(e){console.error('UNCAUGHT:',e.message);process.exit(1);});
