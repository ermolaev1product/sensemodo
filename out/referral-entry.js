// Explicit programme CTA reuses the existing form. No request is sent on entry.
if(window.referralIntent){
 const message=document.querySelector('#contact-message');
 if(!message.value)message.value=window.referralCopy[lang].formMessage;
 openContact(document.querySelector('[data-referral-link]'));
}
