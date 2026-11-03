'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const w={};vm.runInNewContext(fs.readFileSync('out/referral-copy.js','utf8'),{window:w});
(async()=>{const browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});const report=[];try{
for(const lang of ['en','ru','sr','es'])for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];let getRequests=0,blockedPosts=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const r=route.request();if(r.method()!=='GET'){blockedPosts++;return route.abort('blockedbyclient')}assert.equal(new URL(r.url()).origin,'https://sensemodo.com');getRequests++;return route.continue()});
 await page.goto('https://sensemodo.com/?lang='+lang);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Main page overflow');
 assert.equal(await page.locator('footer [data-referral-link]').getAttribute('href'),'/referral.html?lang='+lang);await page.locator('.referral-invitation [data-referral-link]').click();await page.waitForURL('https://sensemodo.com/referral.html?lang='+lang);
 assert.equal(await page.locator('h1').innerText(),w.referralCopy[lang].title);assert.equal(await page.locator('.referral-terms').innerText(),w.referralCopy[lang].terms);assert.equal(await page.locator('html').getAttribute('lang'),lang==='sr'?'sr-Latn':lang);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Referral page overflow');
 assert.deepEqual(await page.locator('.referral-rates strong').allTextContents(),['10%','15%','20%']);
 for(const other of ['en','ru','sr','es']){await page.locator('[data-lang='+other+']').click();assert.equal(await page.locator('h1').innerText(),w.referralCopy[other].title);assert.equal(await page.locator('[data-inquiry]').first().getAttribute('href'),'/?lang='+other+'&intent=referral#contact')}
 await page.locator('[data-lang='+lang+']').click();if(lang==='ru'&&width===390||lang==='en'&&width===1440)await page.screenshot({path:path.resolve('../sensemodo-diagnostics/referral-live-'+lang+'-'+width+'.png'),fullPage:true});
 await page.locator('[data-inquiry]').first().click();await page.waitForURL('https://sensemodo.com/?lang='+lang+'&intent=referral#contact');assert.ok(await page.locator('#contact-dialog').isVisible());assert.equal(await page.locator('#form-title').innerText(),w.referralCopy[lang].formTitle);assert.equal(await page.locator('#contact-consent').isChecked(),false);assert.ok((await page.locator('#contact-message').inputValue()).startsWith(w.referralCopy[lang].formMessage));assert.equal(blockedPosts,0);assert.deepEqual(errors,[]);
 report.push({lang,width,livePage:true,mainToPageToForm:true,languageSwitching:true,noOverflow:true,posts:0,getRequests,passed:true});await context.close();
}
fs.writeFileSync(path.resolve('../sensemodo-diagnostics/referral-live-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
