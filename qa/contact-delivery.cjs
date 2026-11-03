const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context={module:{exports:{}},AbortController,URLSearchParams,fetch,setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync('out/contact-delivery.js','utf8'),context);
const {send}=context.module.exports;
(async()=>{
 let count=0;const body={name:'LOCAL TEST ONLY',email:'qa@example.invalid',message:'mock'};
 async function check(response,kind,code){const r=await send('https://example.invalid',body,{fetch:async()=>{count++;return response}});assert.equal(r.kind,kind);assert.equal(r.code,code);}
 await check({ok:true,status:200,json:async()=>({success:true})},'accepted','ACCEPTED');
 await check({ok:true,status:200,json:async()=>({success:'true'})},'accepted','ACCEPTED');
 await check({ok:true,status:200,json:async()=>{throw Error('html')}},'uncertain','INVALID_RESPONSE');
 await check({ok:false,status:502,json:async()=>({})},'uncertain','UNCONFIRMED_RESPONSE');
 await check({ok:false,status:429,json:async()=>({success:false})},'rejected','PROVIDER_REJECTED');
 await check({ok:true,status:200,json:async()=>({success:false,message:'Please activate this form'})},'pending','ACTIVATION_REQUIRED');
 assert.equal((await send('',body,{fetch:async()=>{throw TypeError('offline')}})).code,'NETWORK');
 assert.equal((await send('',body,{timeoutMs:2,fetch:(_,o)=>new Promise((_,reject)=>o.signal.addEventListener('abort',()=>reject(Error('abort'))))})).code,'TIMEOUT');
 assert.equal((await send('',body,{timeoutMs:50,fetch:async()=>{await new Promise(r=>setTimeout(r,5));return {ok:true,status:200,json:async()=>({success:true})}}})).kind,'accepted');
 assert.equal((await send('',body,{timeoutMs:2,fetch:async(_,o)=>({ok:true,status:200,json:()=>new Promise((_,reject)=>o.signal.addEventListener('abort',()=>reject(Error('body aborted'))))})})).code,'TIMEOUT');
 await check({ok:true,status:200,json:async()=>({success:true,message:'Please activate this form'})},'pending','ACTIVATION_REQUIRED');
 await check({ok:true,status:200,json:async()=>({success:'true',message:'Please confirm your email'})},'pending','ACTIVATION_REQUIRED');
 let slowCalls=0;const delayed=await send('',body,{slowAfterMs:2,timeoutMs:80,onSlow:()=>slowCalls++,fetch:async(_,o)=>{await new Promise(r=>setTimeout(r,15));assert.equal(o.signal.aborted,false);return {ok:true,status:200,json:async()=>({success:true})}}});assert.equal(slowCalls,1);assert.equal(delayed.kind,'accepted');
 let encoded;await send('',{name:'A & B',message:'Привет + hello',_honey:''},{fetch:async(_,o)=>{encoded=o;return {ok:true,status:200,json:async()=>({success:true})}}});assert.ok(encoded.body instanceof URLSearchParams);assert.equal(encoded.body.get('name'),'A & B');assert.equal(encoded.body.get('message'),'Привет + hello');assert.equal(encoded.headers['Content-Type'],undefined);assert.equal(encoded.headers.Accept,'application/json');
 assert.equal(count,8);console.log('PASS: 14 mocked transport cases; no external requests, no automatic retry, no false success.');
})().catch(e=>{console.error(e);process.exit(1)});
