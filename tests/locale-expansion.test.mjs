import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {JSDOM} from 'jsdom';
const ctx={window:{}};for(const f of ['content.js','referral-copy.js'])vm.runInNewContext(fs.readFileSync('out/'+f,'utf8'),ctx);
function shape(value){if(Array.isArray(value))return value.map(shape);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,shape(value[k])]));return typeof value;}
for(const locale of ['de','pt-BR'])test(`Complete ${locale} copy with preserved numeric claims and consent`,()=>{
 const s=ctx.window.siteCopy[locale],r=ctx.window.referralCopy[locale];assert.deepEqual(shape(s),shape(ctx.window.siteCopy.en));assert.deepEqual(shape(r),shape(ctx.window.referralCopy.en));
 for(const [k,v] of Object.entries(s))if(typeof v==='string')assert.ok(v.trim(),k);
 for(const n of ['10','6','2–3','5'])assert.ok(s.bio2.includes(n),`bio metric ${n}`);assert.equal(s.caseMetric,'10×');assert.match(r.nav,/10\s*%/);
 const dom=new JSDOM(`<html lang="${locale}"><body></body></html>`,{url:`https://sensemodo.com/${locale}/`,runScripts:'outside-only'});let calls=0;dom.window.fetch=()=>{calls++;throw Error('No consent')};dom.window.eval(fs.readFileSync('analytics/client.js','utf8'));
 const shadow=dom.window.document.querySelector('#visit-metrics-preferences').shadowRoot;assert.ok(shadow.textContent.includes('90'));assert.ok(!shadow.textContent.includes('May we measure visits?'));assert.equal(shadow.querySelectorAll('button').length,2);assert.equal(calls,0);dom.window.close();
});
