const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const w={};vm.runInNewContext(fs.readFileSync('out/referral-copy.js','utf8'),{window:w});
const keys=Object.keys(w.referralCopy.en).sort();
for(const lang of ['en','ru','sr','es']){
 const c=w.referralCopy[lang];assert.ok(c,'Missing language '+lang);assert.deepEqual(Object.keys(c).sort(),keys);
 for(const [key,v] of Object.entries(c)){assert.ok(Array.isArray(v)?v.length>0:typeof v==='string'&&v.trim().length>0,key);}
 assert.equal(c.steps.length,3);assert.equal(c.audience.length,4);
 const ctx={window:{siteCopy:{},referralCopy:w.referralCopy},URL,location:{href:'https://sensemodo.com/?lang='+lang+'&intent=referral'}};
 vm.runInNewContext(fs.readFileSync('out/content.js','utf8'),ctx);
 vm.runInNewContext(fs.readFileSync('out/referral-main.js','utf8'),ctx);
 assert.equal(ctx.window.referralIntent,true);assert.equal(ctx.window.siteCopy[lang].formtitle,c.formTitle);assert.equal(ctx.window.siteCopy[lang].formPlaceholder,c.formPlaceholder);
}
const html=fs.readFileSync('out/index.html','utf8');
for(const name of ['content','contact-config','contact-delivery','referral-copy','referral-main','app','referral-entry'])assert.ok(html.includes('/'+name+'.js'),name);
assert.ok(html.indexOf('/referral-main.js')<html.indexOf('/app.js'));assert.ok(html.indexOf('/referral-entry.js')>html.indexOf('/app.js'));
const app=fs.readFileSync('out/app.js','utf8');assert.ok(app.includes("window.referralIntent?'Sensemodo — referral programme enquiry'"));
console.log('PASS: complete EN/RU/SR/ES copy, explicit referral intent, existing form labels, safe script order. No browser or external requests.');
