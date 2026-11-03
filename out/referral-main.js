// Adds only referral copy; the established consent and delivery flow stays unchanged.
(() => {
window.referralIntent=new URL(location.href).searchParams.get('intent')==='referral';
const menu={"en":"Referral programme from 10%","ru":"Реферальная программа от 10%","sr":"Program preporuka od 10%","es":"Programa de referidos desde el 10%"};
const explore={en:'Explore the programme',ru:'О программе',sr:'O programu',es:'Conoce el programa',de:'Mehr über das Programm','pt-BR':'Conheça o programa'};
for(const [language,t] of Object.entries(window.siteCopy)){
 const r=window.referralCopy[language];
 t.referralMenu=r.nav;t.referralNav=r.nav;t.referralTitle=r.title;t.referralExplore=explore[language];
 if(window.referralIntent){t.formtitle=r.formTitle;t.formintro=r.formIntro;t.formlabel=r.formLabel;t.formChallenge=r.formQuestion;t.formPlaceholder=r.formPlaceholder;}
}
})();
