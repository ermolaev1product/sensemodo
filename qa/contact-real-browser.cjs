'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const id=process.argv[2],mode=process.argv[3]||'candidate';assert.match(id,/^SM-(UI|LIVE)-\d{8}T\d{6}Z$/);assert.ok(['candidate','live'].includes(mode));
const dir=path.resolve('../sensemodo-diagnostics'),file=path.join(dir,id+'.json');assert.ok(!fs.existsSync(file),'Never repeat an existing test ID');
const root=path.resolve('out'),journal={id,mode,status:'prepared_not_submitted',method:'POST',endpoint:'https://formsubmit.co/ajax/e1085381b579d1d2504bec089ab06358',recipient:'ermolaev@gmail.com',observationLimitMs:195000,retry:false,posts:0,responses:[],console:[],pageErrors:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(journal,null,2));save();
(async()=>{const browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});journal.engine=await browser.version();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();let start;
try{
await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());
if(u.origin==='https://sensemodo.com'){
 if(mode==='live')return route.continue();
 const f=path.resolve(root,u.pathname==='/'?'index.html':u.pathname.slice(1));assert.ok(f.startsWith(root+path.sep));if(!fs.existsSync(f))return route.fulfill({status:404,body:''});return route.fulfill({status:200,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(f)],body:fs.readFileSync(f)});
}
assert.equal(u.href,journal.endpoint,'Only the authorized FormSubmit endpoint may receive external form traffic');
if(req.method()==='POST'){
 journal.posts++;if(journal.posts>1){journal.status='duplicate_blocked_by_test';save();return route.abort('blockedbyclient')}
 journal.payload=Object.fromEntries(new URLSearchParams(req.postData()));assert.equal(journal.payload.name,'TEST');assert.equal(journal.payload.company,'TEST');assert.equal(journal.payload.email,'ermolaev@gmail.com');assert.ok(journal.payload.message.includes(id));journal.status='submitting';save();
}
return route.continue();});
page.on('console',m=>{if(['warning','error'].includes(m.type())){journal.console.push(m.text());save()}});page.on('pageerror',e=>{journal.pageErrors.push(e.message);save()});
page.on('response',async r=>{if(r.url()===journal.endpoint){const item={method:r.request().method(),status:r.status(),elapsedMs:start===undefined?null:performance.now()-start,headers:await r.allHeaders()};delete item.headers['set-cookie'];if(r.request().method()==='POST'){try{item.body=await r.text()}catch(e){item.bodyReadError=e.message}}journal.responses.push(item);save()}});
await page.goto('https://sensemodo.com/?lang=en');await page.locator('.hero [data-open-contact]').click();await page.locator('#contact-name').fill('TEST');await page.locator('#contact-email').fill('ermolaev@gmail.com');await page.locator('#contact-company').fill('TEST');await page.locator('#contact-message').fill('TEST ONLY — Sensemodo delivery diagnosis — no client enquiry. ID: '+id);await page.locator('#contact-consent').check();
start=performance.now();journal.status='clicking_submit';save();await page.locator('#contact-submit').click();
await page.waitForFunction(()=>document.querySelector('#form-status').dataset.state==='success'||(!document.querySelector('#contact-submit').disabled&&document.querySelector('#form-status').textContent.length>0),{},{timeout:195000});
journal.elapsedMs=performance.now()-start;journal.statusText=await page.locator('#form-status').innerText();journal.statusState=await page.locator('#form-status').getAttribute('data-state');journal.successVisible=await page.locator('#contact-success').isVisible();journal.visibleText=journal.successVisible?await page.locator('#contact-success').innerText():journal.statusText;journal.formTextRetained=await page.locator('#contact-message').inputValue();journal.status=journal.successVisible?'ui_confirmed_success':'ui_delivery_not_confirmed';await page.screenshot({path:path.join(dir,id+'.png')});save();console.log(JSON.stringify(journal,null,2));
}finally{await browser.close()}})().catch(e=>{journal.error=e.message;journal.status=journal.posts?'uncertain_do_not_retry':'failed_before_submission';save();console.error(e);process.exit(1)});
