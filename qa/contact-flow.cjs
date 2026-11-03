const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('out/app.js','utf8').split("const contactDialog=")[1];
(async()=>{for(const language of ['en','ru','sr','es']){
 const els=new Map(),requests=[],logs=[];
 function el(s){if(!els.has(s))els.set(s,{hidden:s==='#contact-success',open:false,value:'',disabled:false,textContent:'',dataset:{},handlers:{},attrs:{},addEventListener(n,f){(this.handlers[n]??=[]).push(f)},setAttribute(k,v){this.attrs[k]=v},focus(){},showModal(){this.open=true},close(){this.open=false;(this.handlers.close||[]).forEach(f=>f())},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},reportValidity(){return true},reset(){for(const k of ['name','email','company','message'])el('#contact-'+k).value=''},async fire(n){for(const f of this.handlers[n]||[])await f({preventDefault(){},target:this})}});return els.get(s);}
 const langButtons=[{dataset:{lang:'ru'},addEventListener(){}}],trigger=el('trigger');
 const context={window:{contactDelivery:{enabled:true,endpoint:'https://example.invalid'},sensemodoDelivery:{send:async(url,payload)=>{requests.push(payload);return context.next}}},document:{body:{classList:{add(){},remove(){}}}},console:{warn(...a){logs.push(a)}},lang:language,$:el,$$:s=>s==='[data-lang]'?langButtons:[trigger],FormData:class{constructor(){return Object.entries(Object.fromEntries(['name','email','company','message'].map(k=>[k,el('#contact-'+k).value])))}},location:{origin:'https://example.invalid'},Date,Math,setTimeout,clearTimeout,URL,Blob};
 vm.createContext(context);vm.runInContext(fs.readFileSync('out/content.js','utf8'),context);context.copy=context.window.siteCopy;
 vm.runInContext('const contactDialog='+source,context);
 el('#contact-name').value='Synthetic person';el('#contact-email').value='test@example.invalid';el('#contact-message').value='Synthetic enquiry';
 context.next={kind:'uncertain',code:'TIMEOUT',status:null};await el('#contact-form').fire('submit');
 assert.equal(requests.length,1);assert.ok(requests[0].reference.startsWith('SM-'));assert.equal(el('#contact-message').value,'Synthetic enquiry');assert.equal(el('#contact-success').hidden,true);assert.equal(el('#form-status').dataset.state,'pending');assert.ok(el('#form-status').textContent.includes('SM-'));
 await trigger.fire('click');assert.ok(el('#form-status').textContent.includes('SM-'),'reopening keeps delivery status');
 await el('#contact-form').fire('submit');assert.equal(requests.length,1,'rapid duplicate blocked');
 context.Date={now:()=>Date.now()+120000};await el('#contact-form').fire('submit');assert.equal(requests.length,1,'uncertain duplicate stays blocked after two minutes');
 el('#contact-message').value='A genuinely changed enquiry';context.next={kind:'accepted',code:'ACCEPTED',status:200};await el('#contact-form').fire('submit');
 assert.equal(requests.length,2);assert.notEqual(requests[1].reference,requests[0].reference);assert.equal(el('#contact-message').value,'');assert.equal(el('#contact-success').hidden,false);assert.equal(el('#contact-form').hidden,true);
 await trigger.fire('click');assert.equal(el('#form-status').textContent,'','new blank form clears prior success');el('#contact-name').value='Synthetic person';el('#contact-email').value='test@example.invalid';el('#contact-message').value='UI error test';el('#contact-success-title').focus=()=>{throw Error('simulated UI exception')};await el('#contact-form').fire('submit');assert.equal(el('#form-status').dataset.state,'success','UI exception must not turn acceptance into delivery failure');assert.equal(el('#contact-form').hidden,false);
 assert.ok(!JSON.stringify(logs).includes('test@example.invalid'));assert.ok(!JSON.stringify(logs).includes('Synthetic enquiry'));
 console.log(language+': PASS mocked form flow, preserved ambiguity, repeat prevention, edited retry, accepted success, no PII logs');
}})().catch(e=>{console.error(e);process.exit(1)});
