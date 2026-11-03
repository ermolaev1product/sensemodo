'use strict';
// All requests intercepted. This test never sends a real enquiry.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('out');
(async()=>{
 const browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});const report=[];
 try{for(const lang of ['en','ru','sr','es'])for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];let posts=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());
 if(u.origin==='http://127.0.0.1:4180'){
 const f=path.resolve(root,u.pathname==='/'?'index.html':u.pathname.slice(1));assert.ok(f.startsWith(root+path.sep));
 if(!fs.existsSync(f))return route.fulfill({status:404,body:''});
 return route.fulfill({status:200,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(f)],body:fs.readFileSync(f)});
 }
 assert.equal(u.href,'https://formsubmit.co/ajax/e1085381b579d1d2504bec089ab06358');
 const headers={'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type,accept'};
 if(req.method()==='OPTIONS')return route.fulfill({status:200,headers,body:''});
 assert.equal(req.method(),'POST');posts++;const p=Object.fromEntries(new URLSearchParams(req.postData()));
 assert.equal(p._subject,'Sensemodo — referral programme enquiry');assert.equal(p.email,'referral-test@example.invalid');assert.equal(p.language,lang);
 return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({success:'true'})});
 });
 await page.goto('http://127.0.0.1:4180/?lang='+lang);
 await page.locator('.referral-invitation [data-referral-link]').click();await page.waitForURL('**/referral.html?lang='+lang);
 assert.equal(await page.locator('html').getAttribute('lang'),lang==='sr'?'sr-Latn':lang);
 assert.equal(await page.locator('.referral-rates strong').allTextContents().then(a=>a.join(',')),'10%,15%,20%');
 assert.equal(await page.locator('#referral-audience li').count(),4);assert.equal(await page.locator('#referral-steps li').count(),3);
 assert.ok((await page.locator('.referral-terms').innerText()).length>100);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'horizontal overflow');
 for(const target of ['en','ru','sr','es']){await page.locator('[data-lang='+target+']').click();assert.ok(page.url().endsWith('lang='+target));assert.equal(await page.locator('[data-inquiry]').first().getAttribute('href'),'/?lang='+target+'&intent=referral#contact');assert.ok(!await page.locator('body').innerText().then(t=>t.includes('undefined')));}
 await page.locator('[data-lang='+lang+']').click();await page.screenshot({path:'qa/referral-'+lang+'-'+width+'.png',fullPage:true});
 await page.locator('[data-inquiry]').first().click();await page.waitForURL('**/?lang='+lang+'&intent=referral#contact');
 assert.ok(await page.locator('#contact-dialog').isVisible());assert.equal(posts,0,'No submission on entry');assert.equal(await page.locator('#contact-consent').isChecked(),false);
 await page.locator('#contact-submit').click();assert.equal(posts,0,'Invalid form must not send');
 await page.locator('#contact-name').fill('LOCAL MOCK TEST');await page.locator('#contact-email').fill('referral-test@example.invalid');await page.locator('#contact-message').fill('LOCAL MOCK REFERRAL TEST');await page.locator('#contact-consent').check();await page.locator('#contact-submit').click();await page.waitForFunction(()=>!document.querySelector('#contact-success').hidden);
 assert.equal(posts,1);assert.deepEqual(errors,[]);report.push({lang,width,passed:true,postsIntercepted:posts,externalRequestsSent:0});await context.close();
 }
 fs.writeFileSync('qa/referral-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
