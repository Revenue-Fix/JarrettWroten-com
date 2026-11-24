/* Demo tailoring (Nov 22, 2026). With no shop known, the sample trade in the AI question rotates through
   several trades. A gift page sets window.JW_SHOP = {name, trade}, or a link adds ?shop=...&trade=..., and the
   demo shows that shop's own name and trade instead. Text only (textContent), never HTML from the URL.
   Pause Animations (html.static) stops the rotation; it resumes on Play. */
(function(){
var D=document,H=D.documentElement,cfg=window.JW_SHOP||{};
try{var q=new URLSearchParams(location.search);if(q.get('shop'))cfg={name:q.get('shop'),trade:q.get('trade')||cfg.trade};else if(q.get('trade'))cfg.trade=q.get('trade');}catch(e){}
function clean(s){return String(s||'').replace(/[\u0000-\u001f<>{}]/g,'').replace(/\s+/g,' ').trim().slice(0,60)}
var name=clean(cfg.name),trade=clean(cfg.trade);
if(name)[].forEach.call(D.querySelectorAll('[data-shop]'),function(el){el.textContent=name;el.title=name;el.classList.add('is-shop')});
var tr=[].slice.call(D.querySelectorAll('[data-trade]'));if(!tr.length)return;
if(trade){tr.forEach(function(el){el.textContent=trade});return}
var T=['AC company','roofer','auto shop','cosmetic dentist','med spa','plumber','pest control company'],i=0;
function off(){return H.classList.contains('static')||H.classList.contains('paused')||D.hidden}
setInterval(function(){if(off())return;i=(i+1)%T.length;tr.forEach(function(el){el.classList.add('tr-out');setTimeout(function(){el.textContent=T[i];el.classList.remove('tr-out')},260)})},2800);
})();
