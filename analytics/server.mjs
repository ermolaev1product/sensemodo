import paths from './paths.json' with {type:'json'};
const allowed=new Set(paths);const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function dayTbilisi(now){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tbilisi',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function sourceCategory(value){return ['direct','google','bing','yandex','duckduckgo','telegram','facebook','instagram','linkedin','other'].includes(value)?value:'other';}
export function validate(body){return body&&['view','active'].includes(body.type)&&uuid.test(body.id)&&uuid.test(body.visitor)&&typeof body.path==='string'&&allowed.has(body.path)&&body.consent===true&&typeof body.test==='boolean';}
function response(status){return new Response(null,{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
export async function traffic(request,env){
 if(request.method!=='POST')return response(405);
 const origin=request.headers.get('Origin');if(!origin||origin!==new URL(request.url).origin)return response(403);
 if(request.headers.get('Sec-GPC')==='1'||request.headers.get('DNT')==='1')return response(204);
 if(/bot|crawler|spider|headless/i.test(request.headers.get('user-agent')||''))return response(204);
 if(Number(request.headers.get('content-length')||0)>2048)return response(413);
 const raw=await request.text();if(raw.length>2048)return response(413);let body;try{body=JSON.parse(raw);}catch{return response(400);}
 if(!validate(body))return response(400);if(!env.DB)return response(503);
 const now=new Date(),day=dayTbilisi(now);const visitor=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(day+'|'+body.visitor)).then(b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join(''));
 try{
  if(body.type==='view')await env.DB.prepare('INSERT OR IGNORE INTO traffic_events_v2 (id,occurred_at,day_tbilisi,visitor,path,source,active_seconds,is_test,schema_version) VALUES (?,?,?,?,?,?,0,?,2)').bind(body.id,now.toISOString(),day,visitor,body.path,sourceCategory(body.source),body.test?1:0).run();
  else {const seconds=Math.trunc(Number(body.seconds));if(!Number.isFinite(seconds)||seconds<1||seconds>30)return response(400);await env.DB.prepare('UPDATE traffic_events_v2 SET active_seconds=MIN(14400,active_seconds+?) WHERE id=? AND visitor=? AND day_tbilisi=? AND path=? AND is_test=?').bind(seconds,body.id,visitor,day,body.path,body.test?1:0).run();}
  await env.DB.prepare('DELETE FROM traffic_events_v2 WHERE day_tbilisi < ?').bind(dayTbilisi(new Date(now.getTime()-90*86400000))).run();
  return response(204);
 }catch{return response(503);}
}
