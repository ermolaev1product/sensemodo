import fs from 'node:fs';import path from 'node:path';
fs.rmSync('public',{recursive:true,force:true});fs.cpSync('out','public',{recursive:true});
const html=[];function walk(dir){for(const n of fs.readdirSync(dir)){const p=path.join(dir,n);if(fs.statSync(p).isDirectory())walk(p);else if(p.endsWith('.html'))html.push(p);}}walk('public');
const publicPaths=[];for(const p of html){const rel='/'+path.relative('public',p).replaceAll('\\','/');if(/(?:account|auth|login|callback|draft|app-preview)/i.test(rel))continue;publicPaths.push(rel,rel.replace(/index\.html$/,''),rel.replace(/\.html$/,''));let s=fs.readFileSync(p,'utf8');if(!s.includes('src="/visit-metrics.js"'))s=s.replace('</body>','<script src="/visit-metrics.js" defer></script></body>');fs.writeFileSync(p,s);}
fs.copyFileSync('analytics/client.js','public/visit-metrics.js');
fs.writeFileSync('analytics/paths.json',JSON.stringify([...new Set(publicPaths)]));
console.log('Analytics instrumented public HTML:',html.length,'; original out unchanged');
