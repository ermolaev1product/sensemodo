const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM,VirtualConsole}=require('/tmp/sensemodo-test-deps/node_modules/jsdom');
for (const page of ['index','referral']) for (const lang of ['en','ru','sr','es']) {
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync('out/'+page+'.html','utf8'),{url:'https://sensemodo.com/'+(page==='index'?'':page)+'?lang='+lang,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document;
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};w.requestAnimationFrame=()=>0;
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 w.fetch=()=>{throw Error('No external requests allowed')};
 for(const el of d.querySelectorAll('script[src]'))w.eval(fs.readFileSync('out/'+el.getAttribute('src').slice(1),'utf8'));
 assert.equal(d.documentElement.lang,lang==='sr'?'sr-Latn':lang);
 for(const target of ['ru','sr','en','es','sr']) {
  d.querySelector(`[data-lang="${target}"]`).click();
  assert.equal(d.documentElement.lang,target==='sr'?'sr-Latn':target);
  assert.equal(new URL(w.location.href).searchParams.get('lang'),target);
  assert.equal(d.querySelector(`[data-lang="${target}"]`).getAttribute('aria-pressed'),'true');
  for(const e of d.querySelectorAll('[data-t],[data-r]'))assert.ok(e.textContent && e.textContent!=='undefined');
  if(target==='sr'){
   assert.equal(d.querySelector('.skip').textContent,'Pređi na sadržaj');
   assert.equal(d.querySelector('.langs').getAttribute('aria-label'),'Jezik');
   const clone=d.body.cloneNode(true);clone.querySelectorAll('script,noscript').forEach(e=>e.remove());
   assert.ok(!/[А-Яа-яЁё]/.test(clone.textContent),'No Russian in Serbian page');
   if(page==='index'){
    assert.equal(d.querySelector('nav').getAttribute('aria-label'),'Navigacija');
    d.querySelector('[data-open-contact]').click();assert.ok(d.querySelector('dialog').open);
    assert.equal(d.querySelector('#contact-submit').textContent,'Pošalji upit ↗');d.querySelector('.dialog-close').click();
    assert.ok([...d.querySelectorAll('[data-referral-link]')].every(a=>a.href.endsWith('?lang=sr')));
   }else assert.ok([...d.querySelectorAll('[data-home],[data-inquiry]')].every(a=>new URL(a.href).searchParams.get('lang')==='sr'));
  }
 }
 assert.deepEqual(errors,[]);dom.window.close();console.log('PASS '+page+' '+lang+': direct entry, RU/SR/EN/ES repeated switches, complete copy and internal language links');
}
