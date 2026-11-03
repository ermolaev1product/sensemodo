const {JSDOM, VirtualConsole} = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('out/index.html','utf8');
const script = fs.readFileSync('out/app.js','utf8');
const summary=[];
(async()=>{
for(const lang of ['ru','sr']){
  const dom = new JSDOM(html,{url:'https://example.test/?lang='+lang,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dom.window,d=w.document;
  let copied='',downloaded='',blobContents=[];
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
  w.navigator.clipboard={writeText:async text=>{copied=text}};
  w.URL.createObjectURL=blob=>{blobContents.push(blob);return 'blob:local-test'}; w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){downloaded=this.download};
  w.eval(script);
  const q=s=>d.querySelector(s);
  assert.equal(d.documentElement.lang,lang==='ru'?'ru':'sr-Latn');
  assert.equal(d.querySelectorAll('.product-card').length,3);
  for(const task of ['map','pilot','partner']){
    q('[data-task="'+task+'"]').click();
    assert.equal(q('.product-card.recommended').dataset.product,task);
    assert.equal(q('[data-task="'+task+'"]').getAttribute('aria-pressed'),'true');
    q('[data-product-brief="'+task+'"]').click();
    assert.ok(q('dialog').hasAttribute('open'));
    assert.equal(q('#brief-product-name').textContent,q('#product-'+task+' h3').textContent);
    q('#business').value=lang==='ru'?'Тестовый бизнес':'Probni biznis';
    q('#problem').value='  ';
    q('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
    assert.ok(!q('form').hidden,'Whitespace input rejected');
    assert.ok(q('#problem').validationMessage.length>0);
    q('#problem').value=lang==='ru'?'Нужен отчёт быстрее':'Brža priprema izveštaja';
    q('#problem').dispatchEvent(new w.Event('input'));
    q('#outcome').value=lang==='ru'?'Сравнить время':'Uporediti vreme';
    q('#market').value='both';
    q('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
    assert.ok(q('form').hidden && !q('#brief-result').hidden);
    const brief=q('#brief-preview').value;
    assert.ok(brief.includes(q('#brief-product-name').textContent));
    assert.ok(brief.includes(q('#problem').value));
    if(lang==='sr')assert.ok(!/[А-Яа-яЁё]/.test(brief));
    q('#copy-brief').click();await new Promise(setImmediate);assert.equal(copied,brief);
    q('#download-brief').click();assert.equal(downloaded,'ermolayev-ai-brief-'+lang+'.txt');assert.ok(blobContents.length>0);
    q('#edit-brief').click();assert.ok(!q('form').hidden);assert.equal(q('#problem').value,lang==='ru'?'Нужен отчёт быстрее':'Brža priprema izveštaja');
    q('.close-dialog').click();assert.ok(!q('dialog').hasAttribute('open'));
    assert.equal(d.activeElement.dataset.productBrief,task);
  }
  q('[data-lang="'+(lang==='ru'?'sr':'ru')+'"]').click();
  assert.equal(q('.product-card.recommended').dataset.product,'partner');
  assert.equal(d.documentElement.lang,lang==='ru'?'sr-Latn':'ru');
  if(lang==='ru')assert.ok(!/[А-Яа-яЁё]/.test(q('main').textContent));
  assert.equal(w.localStorage.length,1);
  assert.ok(w.localStorage.getItem('ai-practice-language'));
  summary.push({language:lang,taskMappings:3,translation:true,formValidation:true,briefContent:true,copy:true,downloadHandler:true,languagePreservesTask:true,onlyLanguagePersisted:true});
  dom.window.close();
}
console.log(JSON.stringify({passed:true,environment:'JSDOM; dialog, clipboard and download browser APIs simulated. No visual layout verification.',checks:summary},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
