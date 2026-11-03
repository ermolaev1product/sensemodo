(() => {
'use strict';
const all = window.referralCopy;
function render(lang){
const t=all[lang];document.documentElement.lang=lang==='sr'?'sr-Latn':lang;
window.sensemodoSEO.apply(lang,true);
document.querySelector('.langs').setAttribute('aria-label',t.languageLabel);
document.querySelector('meta[name=description]').content=t.intro;
document.querySelectorAll('[data-r]').forEach(el=>el.textContent=t[el.dataset.r]);
document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));
for(const [id,key] of [['referral-audience','audience'],['referral-steps','steps']]) document.getElementById(id).replaceChildren(...t[key].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
document.querySelectorAll('[data-home]').forEach(a=>a.href='/'+lang+'/');
document.querySelectorAll('[data-inquiry]').forEach(a=>a.href='/'+lang+'/?intent=referral#contact');
window.sensemodoSEO.navigate(lang,true);
}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();render(b.dataset.lang)}));
const requested=window.sensemodoSEO.language();render(all[requested]?requested:'en');
})();
