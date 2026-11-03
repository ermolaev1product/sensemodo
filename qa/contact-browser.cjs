'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('out'),report={engine:null,externalRequestsSent:0,checks:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 report.engine=await browser.version();
 try{for(const lang of ['en','ru','sr','es'])for(const scenario of ['accepted','rejected','activation','network','invalid','timeout','delayed']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});let posts=0;const errors=[];
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const original=window.setTimeout;window.setTimeout=(f,ms,...a)=>original(f,ms===18000?100:ms===180000?300:ms,...a)});
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.origin==='http://127.0.0.1:4180'){
    const name=u.pathname==='/'?'index.html':u.pathname.slice(1),f=path.resolve(root,name);
    if(!f.startsWith(root+path.sep)||!fs.existsSync(f))return route.fulfill({status:404,body:''});
    return route.fulfill({status:200,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(f)],body:fs.readFileSync(f)});
   }
   assert.equal(u.href,'https://formsubmit.co/ajax/e1085381b579d1d2504bec089ab06358');
   const headers={'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type,accept'};
   if(req.method()==='OPTIONS')return route.fulfill({status:200,headers,body:''});
   assert.equal(req.method(),'POST');posts++;const payload=Object.fromEntries(new URLSearchParams(req.postData()));assert.equal(payload.email,'browser-test@example.invalid');assert.ok(payload.reference.startsWith('SM-'));
   if(scenario==='network')return route.abort('failed');
   if(scenario==='timeout'){await new Promise(r=>setTimeout(r,400));return route.abort('timedout').catch(()=>{});}
   if(scenario==='delayed')await new Promise(r=>setTimeout(r,180));
   const body=['accepted','delayed'].includes(scenario)?JSON.stringify({success:'true'}):scenario==='rejected'?JSON.stringify({success:false}):scenario==='activation'?JSON.stringify({success:false,message:'Please activate this form'}):'<html>upstream unavailable</html>';
   return route.fulfill({status:200,headers,contentType:scenario==='invalid'?'text/html':'application/json',body});
  });
  await page.goto('http://127.0.0.1:4180/?lang='+lang);await page.locator('.hero [data-open-contact]').click();
  await page.locator('#contact-name').fill('TEST');await page.locator('#contact-email').fill('browser-test@example.invalid');await page.locator('#contact-company').fill('TEST');await page.locator('#contact-message').fill('LOCAL MOCK TEST ONLY');await page.locator('#contact-consent').check();
  await page.locator('#contact-submit').click();await page.waitForFunction(()=>['success','pending','error'].includes(document.querySelector('#form-status').dataset.state));
  if(['accepted','delayed'].includes(scenario)){
   if(scenario==='delayed'){assert.equal(await page.locator('#contact-success').isVisible(),false);assert.equal(await page.locator('#contact-submit').isDisabled(),true);assert.equal(await page.locator('#form-status').getAttribute('data-state'),'pending');}
   await page.waitForFunction(()=>document.querySelector('#form-status').dataset.state==='success');
   assert.ok(await page.locator('#contact-success').isVisible());assert.equal(await page.locator('#contact-form').isVisible(),false);assert.equal(await page.locator('#contact-name').inputValue(),'');
  }else{
   assert.ok(await page.locator('#contact-form').isVisible());assert.equal(await page.locator('#contact-success').isVisible(),false);assert.equal(await page.locator('#contact-message').inputValue(),'LOCAL MOCK TEST ONLY');
   assert.equal(await page.locator('#form-status').getAttribute('data-state'),scenario==='rejected'?'error':'pending');
   if(['network','invalid','timeout','delayed'].includes(scenario)){
    await page.waitForFunction(()=>!document.querySelector('#contact-submit').disabled);await page.locator('#contact-submit').click();assert.equal(posts,1,'Immediate duplicate must be blocked');
    const status=await page.locator('#form-status').innerText();await page.locator('.dialog-close').click();await page.locator('.hero [data-open-contact]').click();assert.equal(await page.locator('#form-status').innerText(),status);
    const d=page.waitForEvent('download');await page.locator('#contact-save').click();const download=await d;assert.equal(download.suggestedFilename(),'ai-enquiry-'+lang+'.txt');
   }
  }
  assert.equal(posts,1);assert.deepEqual(errors,[]);
  if(lang==='en'&&['accepted','timeout'].includes(scenario))await page.screenshot({path:'qa/contact-'+scenario+'.png'});
  report.checks.push({lang,scenario,postsIntercepted:posts,status:await page.locator('#form-status').getAttribute('data-state'),passed:true});await context.close();
 }
 fs.writeFileSync('qa/contact-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
