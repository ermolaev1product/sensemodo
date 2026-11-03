'use strict';
// No enquiry content, email addresses, or identifiers are persisted by this helper.
(function(root){
  async function send(endpoint,payload,options={}) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),options.timeoutMs??180000);
    const slowTimer=options.onSlow?setTimeout(()=>{try{options.onSlow();}catch{}},options.slowAfterMs??18000):null;
    let status=null;
    try {
      const response=await (options.fetch||fetch)(endpoint,{method:'POST',headers:{'Accept':'application/json'},signal:controller.signal,body:new URLSearchParams(payload)});
      status=response.status||null;
      let result;
      try {result=await response.json();} catch {return {kind:'uncertain',code:controller.signal.aborted?'TIMEOUT':'INVALID_RESPONSE',status};}
      if(/activat|confirm your email/i.test(result?.message||''))return {kind:'pending',code:'ACTIVATION_REQUIRED',status};
      if(response.ok&&(result?.success===true||result?.success==='true'))return {kind:'accepted',code:'ACCEPTED',status};
      if(result?.success===false||result?.success==='false')return {kind:'rejected',code:'PROVIDER_REJECTED',status};
      return {kind:'uncertain',code:'UNCONFIRMED_RESPONSE',status};
    } catch(error) {
      return {kind:'uncertain',code:controller.signal.aborted?'TIMEOUT':'NETWORK',status};
    } finally {clearTimeout(timer);if(slowTimer!==null)clearTimeout(slowTimer);}
  }
  const api={send};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.sensemodoDelivery=api;
})(typeof window==='object'?window:globalThis);
