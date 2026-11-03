import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const locales=['en','ru','sr','es','de','pt-BR'];
const read=n=>fs.readFileSync('out/'+n,'utf8');
export function renderPage(html,url){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.requestAnimationFrame=()=>0;
 w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};
 const noop=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
 w.__SENSEMODO_PRERENDER=true;
 w.fetch=()=>{throw Error('Unexpected network request in SEO prerender')};
 const code=[...w.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')).filter(s=>!s.startsWith('/visit-metrics.js')).map(s=>read(s.split('?')[0].replace(/^\//,''))).join('\n;\n');w.eval(code);
 if(errors.length)throw Error(errors.join('\n'));
 return dom;
}
const templates={main:read('index.html'),referral:read('referral.html')};
for(const l of locales)for(const type of ['main','referral']){
 const file='out/'+l+'/'+(type==='main'?'index.html':'referral.html');fs.mkdirSync('out/'+l,{recursive:true});
 const dom=renderPage(templates[type],'https://sensemodo.com/'+l+(type==='main'?'/':'/referral'));
 fs.writeFileSync(file,dom.serialize());dom.window.close();
}
// Retain legacy public addresses with English content and explicit preferred URL.
for(const [type,file] of [['main','index.html'],['referral','referral.html']]){const dom=renderPage(templates[type],'https://sensemodo.com/'+(type==='main'?'':'referral'));fs.writeFileSync('out/'+file,dom.serialize());dom.window.close()}
const urls=locales.flatMap(l=>['https://sensemodo.com/'+l+'/','https://sensemodo.com/'+l+'/referral']);
fs.writeFileSync('out/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>'<url><loc>'+u+'</loc></url>').join('\n')+'\n</urlset>\n');
fs.writeFileSync('out/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://sensemodo.com/sitemap.xml\n');
console.log('SEO prerender: 12 localized public pages and 2 legacy entry points; no network');
