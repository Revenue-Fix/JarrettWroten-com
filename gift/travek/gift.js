/* Gift Pack copy buttons + GA4 and Microsoft Clarity event tracking */
(function(){
function cp(t){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t);
 var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(a);return Promise.resolve();}
function track(name,params,ctag,cval){
 if(window.gtag)window.gtag('event',name,params||{});
 if(window.clarity){if(ctag&&cval)window.clarity('set',ctag,cval);window.clarity('event',name);}
}
document.addEventListener('click',function(e){
 var b=e.target&&e.target.closest?e.target.closest('.cpy'):null;
 if(b){
  var id=b.getAttribute('data-c')||'',el=document.getElementById(id);if(!el)return;
  var card=b.closest('.prc'),k=card&&card.querySelector('.prc-k'),lbl=k?(k.textContent||'').trim():id;
  var sh=window.JW_SHOP||{},slug=sh.slug||location.pathname.replace(/^\/+|\/+$/g,'')||'gift';
  var txt=el.innerText.trim();
  track('gift_copy_click',{message_id:id,message_label:lbl,shop_slug:slug,shop_name:sh.name||'',page_path:location.pathname},'copied_message',id);
  if(window.clarity)window.clarity('set','gift_copy','yes');
  cp(txt).then(function(){b.textContent='Copied';b.classList.add('ok');clearTimeout(b._t);b._t=setTimeout(function(){b.textContent='Copy';b.classList.remove('ok');},1600);});
  return;
 }
 var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
 if(!a)return;
 var h=a.getAttribute('href')||'',sh2=window.JW_SHOP||{},slug2=sh2.slug||location.pathname.replace(/^\/+|\/+$/g,'')||'gift';
 var n=/calendar\.google\.com|calendar\.app\.google|\/book\/?(#|$)/.test(h)?'book_call_click':h.indexOf('tel:')===0?'phone_click':h.indexOf('mailto:')===0?'email_click':'';
 if(n)track(n,{link_text:(a.textContent||'').replace(/\s+/g,' ').trim().slice(0,80),shop_slug:slug2,shop_name:sh2.name||'',page_path:location.pathname});
});
})();
