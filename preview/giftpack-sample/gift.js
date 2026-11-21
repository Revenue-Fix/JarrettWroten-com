/* gift r1: Copy buttons on the pack cards (clipboard, with a fallback for non secure pages) */
(function(){var D=document;
function txt(el){var t=(el.innerText||el.textContent).replace(/\u00a0/g,' ');t=t.replace(/^(Subject: [^\n]*)\n(?!\n)/,'$1\n\n');return t.replace(/\n{3,}/g,'\n\n').trim();}
function fb(s){var a=D.createElement('textarea');a.value=s;a.setAttribute('readonly','');a.style.position='fixed';a.style.top='-1000px';D.body.appendChild(a);a.select();a.setSelectionRange(0,s.length);var ok=false;try{ok=D.execCommand('copy');}catch(e){}D.body.removeChild(a);return ok;}
var live=D.createElement('p');live.setAttribute('aria-live','polite');live.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';D.body.appendChild(live);
[].forEach.call(D.querySelectorAll('.cpy'),function(b){b.addEventListener('click',function(){var s=txt(D.getElementById(b.getAttribute('data-c')));
 function done(ok){b.textContent=ok?'Copied':'Select To Copy';b.classList.toggle('ok',ok);live.textContent=ok?'Message copied':'Copy did not work, select the text to copy it';clearTimeout(b._t);b._t=setTimeout(function(){b.textContent='Copy';b.classList.remove('ok');},2200);}
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(s).then(function(){done(true);},function(){done(fb(s));});else done(fb(s));});});
})();
