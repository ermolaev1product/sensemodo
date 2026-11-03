import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';import {renderPage} from '../scripts/build-seo.mjs';
const langs=['en','ru','sr','es','de','pt-BR'];
for(const lang of langs)for(const ref of [false,true])test(`Static ${lang} ${ref?'referral':'home'} and runtime compatibility`,()=>{
 const path='/'+lang+(ref?'/referral':'/'),file='out/'+lang+'/'+(ref?'referral.html':'index.html'),html=fs.readFileSync(file,'utf8'),raw=new JSDOM(html).window.document;
 assert.equal(raw.documentElement.lang,lang==='sr'?'sr-Latn':lang);assert.ok(raw.title.startsWith('Sensemodo'));assert.ok(raw.querySelector('h1').textContent.trim());assert.equal(raw.querySelector('link[rel=canonical]').href,'https://sensemodo.com'+path);assert.equal(raw.querySelectorAll('link[hreflang]').length,7);assert.equal(raw.querySelectorAll('.langs a[href]').length,6);assert.equal(raw.querySelectorAll('meta[name=robots]').length,0);
 const dom=renderPage(html,'https://sensemodo.com'+path),w=dom.window,d=w.document;
 assert.equal(d.documentElement.lang,lang==='sr'?'sr-Latn':lang);
 for(const other of langs){d.querySelector('[data-lang='+other+']').click();assert.equal(d.documentElement.lang,other==='sr'?'sr-Latn':other);assert.equal(d.querySelector('link[rel=canonical]').href,'https://sensemodo.com/'+other+(ref?'/referral':'/'));assert.equal(w.location.pathname,'/'+other+(ref?'/referral':'/'));if(!ref){assert.equal(d.querySelector('[data-referral-link]').getAttribute('href'),'/'+other+'/referral');d.querySelector('header nav a[href="#contact"]').click();assert.ok(d.querySelector('dialog').open);d.querySelector('.dialog-close').click();assert.ok(!d.querySelector('dialog').open)}}
 assert.match(w.document.cookie,/sensemodo_lang=pt-BR/);
 dom.window.close();
});
for(const lang of langs)test('Legacy query '+lang+' and referral intent',()=>{
 for(const ref of [false,true]){const html=fs.readFileSync('out/'+(ref?'referral.html':'index.html'),'utf8'),dom=renderPage(html,'https://sensemodo.com/'+(ref?'referral':'')+'?lang='+lang+'&intent=referral#contact'),d=dom.window.document;assert.equal(d.documentElement.lang,lang==='sr'?'sr-Latn':lang);assert.equal(d.querySelector('link[rel=canonical]').href,'https://sensemodo.com/'+lang+(ref?'/referral':'/'));if(!ref){assert.ok(d.querySelector('dialog').open);assert.ok(d.querySelector('#contact-message').value.length>0);d.querySelector('.dialog-close').click()}d.querySelector('[data-lang=en]').click();assert.equal(new URL(dom.window.location.href).searchParams.get('intent'),'referral');dom.window.close()}
});
test('12 sitemap URLs match files and no private URLs exposed',()=>{const s=fs.readFileSync('out/sitemap.xml','utf8');assert.equal((s.match(/<loc>/g)||[]).length,12);assert.ok(!/api|account|draft/.test(s));for(const l of langs){assert.ok(s.includes('https://sensemodo.com/'+l+'/'));assert.ok(s.includes('https://sensemodo.com/'+l+'/referral'))}});
