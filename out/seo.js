(() => {
 const languages=['en','ru','sr','es','de','pt-BR'];
 const titles={en:'Sensemodo — AI implementation for business',ru:'Sensemodo — внедрение AI в бизнес',sr:'Sensemodo — primena AI u poslovanju',es:'Sensemodo — implementación de IA para empresas',de:'Sensemodo — KI-Implementierung für Unternehmen','pt-BR':'Sensemodo — implementação de IA para empresas'};
 const isReferral=()=>location.pathname.includes('referral');
 const path=(l,ref)=>'/'+l+(ref?'/referral':'/');
 const lang=()=>{const q=new URL(location.href).searchParams.get('lang'),p=location.pathname.split('/')[1];return languages.includes(q)?q:languages.includes(p)?p:'en'};
 function apply(l,ref){
  document.title=ref?'Sensemodo / '+window.referralCopy[l].nav:titles[l];
  let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical)}canonical.href='https://sensemodo.com'+path(l,ref);
  document.querySelectorAll('link[hreflang]').forEach(e=>e.remove());
  for(const alt of [...languages,'x-default']){const link=document.createElement('link');link.rel='alternate';link.hreflang=alt==='sr'?'sr-Latn':alt;link.href='https://sensemodo.com'+path(alt==='x-default'?'en':alt,ref);document.head.append(link)}
  document.querySelectorAll('[data-lang]').forEach(a=>{const u=new URL(location.href);u.pathname=path(a.dataset.lang,ref);u.searchParams.delete('lang');a.href=u.pathname+u.search+u.hash;a.setAttribute('aria-current',a.dataset.lang===l?'page':'false')});
 }
 function navigate(l,ref){const u=new URL(location.href);u.pathname=path(l,ref);u.searchParams.delete('lang');history.replaceState({},'',u)}
 function remember(l){if(languages.includes(l))document.cookie='sensemodo_lang='+l+'; Path=/; Max-Age=31536000; SameSite=Lax; Secure'}
 // Store only a deliberate language selection, never an automatic IP default.
 document.addEventListener('click',e=>{const a=e.target.closest?.('[data-lang]');if(a)remember(a.dataset.lang)},true);
 // Handle neutral static assets on hosts that serve assets before the Worker.
 const neutral=['/','/index.html','/referral','/referral/','/referral.html'];
 if(!window.__SENSEMODO_PRERENDER && neutral.includes(location.pathname)){
  const original=location.href, u=new URL(original), explicit=u.searchParams.get('lang');
  const saved=document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('sensemodo_lang='))?.slice(15);
  const move=l=>{if(location.href!==original||!languages.includes(l))return;u.pathname=path(l,isReferral());u.searchParams.delete('lang');location.replace(u.href)};
  if(languages.includes(explicit)){remember(explicit);move(explicit)}
  else if(languages.includes(saved))move(saved);
  else if(typeof fetch==='function')fetch('/api/entry-language',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data)move(data.language)}).catch(()=>{});
 }
 window.sensemodoSEO={language:lang,apply,navigate,remember};
})();
