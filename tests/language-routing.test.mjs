import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languageRedirect, countryLanguage} from '../worker/language-routing.mjs';
const request=(path='/',country,headers={},method='GET')=>{
 const r=new Request('https://sensemodo.com'+path,{method,headers});
 if(country)Object.defineProperty(r,'cf',{value:{country}});
 return r;
};
for(const [country,language] of [['DE','de'],['RS','sr'],['ES','es'],['RU','ru'],['GE','ru'],['AM','ru'],['BR','pt-BR'],['US','en'],['XX','en'],[undefined,'en']])test(`Neutral first entry ${country} -> ${language}`,()=>{
 for(const path of ['/','/index.html','/referral','/referral/','/referral.html']){
  const r=languageRedirect(request(path+'?intent=referral',country));
  assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location')).pathname,`/${language}${path.includes('referral')?'/referral':'/'}`);
  assert.equal(new URL(r.headers.get('location')).searchParams.get('intent'),'referral');
  assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('set-cookie'),null);
 }
});
test('Saved manual choice overrides IP but explicit query overrides saved choice',()=>{
 assert.equal(new URL(languageRedirect(request('/','ES',{cookie:'a=b; sensemodo_lang=sr; other=c'})).headers.get('location')).pathname,'/sr/');
 const r=languageRedirect(request('/?lang=ru&intent=referral','ES',{cookie:'sensemodo_lang=sr'}));
 assert.equal(new URL(r.headers.get('location')).pathname,'/ru/');assert.match(r.headers.get('set-cookie'),/^sensemodo_lang=ru;/);
 assert.equal(new URL(languageRedirect(request('/','DE',{cookie:'sensemodo_lang=evil'})).headers.get('location')).pathname,'/de/');
});
test('Explicit links, assets, APIs and non-navigation methods remain untouched',()=>{
 for(const path of ['/en/','/ru/','/sr/','/es/referral','/ru/referral?lang=en','/api/visit-metrics','/app.js','/robots.txt','/sitemap.xml'])assert.equal(languageRedirect(request(path,'ES',{cookie:'sensemodo_lang=ru'})),null);
 assert.equal(languageRedirect(request('/','ES',{},'POST')),null);
});
test('Hosting country header fallback, unknown fallback, no browser-language override',()=>{
 assert.equal(new URL(languageRedirect(request('/',null,{'cf-ipcountry':'RS','accept-language':'ru'})).headers.get('location')).pathname,'/sr/');
 assert.equal(new URL(languageRedirect(request('/',null,{'accept-language':'ru'})).headers.get('location')).pathname,'/en/');
 assert.equal(countryLanguage('de'),'de');
});
test('Same-origin language endpoint for static-first hosting',async()=>{
 const {entryLanguageResponse}=await import('../worker/language-routing.mjs');
 for(const [country,language] of [['DE','de'],['RS','sr'],['ES','es'],['RU','ru'],['BR','pt-BR'],['GE','ru'],['AM','ru'],['XX','en']]){
 const response=entryLanguageResponse(request('/api/entry-language',country));
 assert.deepEqual(await response.json(),{language});assert.equal(response.headers.get('cache-control'),'private, no-store');}
 assert.equal(entryLanguageResponse(request('/api/visit-metrics','RS')),null);
});
test('Static first entry uses country lookup, manual choice and explicit URLs',async()=>{
 const fs=await import('node:fs');const vm=await import('node:vm');const source=fs.readFileSync('out/seo.js','utf8');
 async function run(path,cookie='',language='en'){
 let destination=null,calls=0;const url=new URL('https://sensemodo.com'+path);const location={href:url.href,pathname:url.pathname,replace(v){destination=v}};
 const document={cookie,addEventListener(){}};
 vm.runInNewContext(source,{URL,location,document,window:{},fetch:async()=>{calls++;return {ok:true,json:async()=>({language})}}});
 await new Promise(r=>setImmediate(r));return {destination,calls};
 }
 assert.equal(new URL((await run('/','','sr')).destination).pathname,'/sr/');
 assert.equal(new URL((await run('/','','de')).destination).pathname,'/de/');
 assert.equal(new URL((await run('/','','pt-BR')).destination).pathname,'/pt-BR/');
 assert.equal(new URL((await run('/','sensemodo_lang=pt-BR','de')).destination).pathname,'/pt-BR/');
 assert.equal(new URL((await run('/?lang=en','sensemodo_lang=pt-BR','de')).destination).pathname,'/en/');
 assert.equal(new URL((await run('/referral?ref=abc','','es')).destination).href,'https://sensemodo.com/es/referral?ref=abc');
 assert.equal(new URL((await run('/','sensemodo_lang=ru','es')).destination).pathname,'/ru/');
 assert.equal((await run('/es/','sensemodo_lang=ru')).destination,null);
 assert.equal((await run('/es/')).calls,0);
});
