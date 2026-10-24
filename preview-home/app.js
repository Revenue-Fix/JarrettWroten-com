(()=>{
const W=[
["rainbow","Rainbow Gardens","Wedding Venue"],["stirling","Stirling Club","Wedding And Event Venue"],["rana","Rana Levy","Fine Jewelry And Lapidary"],["generations","Generations Kitchen","Hawaiian Restaurant"],["paina","P\u0101\u2018ina Caf\u00e9","Hawaiian Caf\u00e9"],["prorok","Dylan Prorok","Japanese Tattoo Artist"],["truheart","Tru Heart Consulting","Sales Team Consulting"],["purpleflare","Purple Flare Wraps","Wraps And Fleet Graphics"],["wrapstar","Wrapstar","Wraps, Ceramic Coating And Tint"]];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],root=document.documentElement;
let paused=false;
const lenis=new Lenis({lerp:.1,smoothWheel:true});window.__lenis=lenis;
(function raf(t){lenis.raf(t);requestAnimationFrame(raf)})();
lenis.stop();scrollTo(0,0);
// intro: counter 0-100, then curtain up
const intro=$('#intro'),iN=$('#introN'),iB=$('#introBar'),hv=$('#heroV');
ply(hv);
requestAnimationFrame(()=>intro.classList.add('go'));
const t0=performance.now(),DUR=2400,SH=1200;let ts=0;
(function tick(t){const p=Math.min(1,(t-t0)/DUR),e=1-Math.pow(1-p,3);iN.textContent=Math.round(e*100);iB.style.width=(e*100)+'%';window.__wd&&window.__wd(p);
 if(p<1){requestAnimationFrame(tick);return}
 /* one full shine sweep over the finished word, then the lift */
 if(!ts)ts=t;const sp=window.__ws?Math.min(1,(t-ts)/SH):1;window.__ws&&window.__ws(sp);
 if(sp<1){requestAnimationFrame(tick);return}
 setTimeout(()=>{intro.classList.add('out');root.classList.add('ready');try{hv.currentTime=0}catch(_){}ply(hv);lenis.start();setTimeout(()=>intro.remove(),1200)},200)})(t0);
// payoff word lands 0.25s after payoff cut (5.5s), then stays
const po=$('#payoff'),PAY=5.75;
function pay(){if(!po.classList.contains('on')&&root.classList.contains('ready')&&(hv.currentTime>=PAY||paused))po.classList.add('on')}
hv.addEventListener('timeupdate',pay);
// fallback: land even if the film stalls, is blocked from autoplay, or loops past the cue unseen
new MutationObserver((m,o)=>{if(root.classList.contains('ready')){o.disconnect();setTimeout(()=>po.classList.add('on'),Math.max(0,(PAY-(hv.currentTime||0))*1000)+600)}}).observe(root,{attributes:true,attributeFilter:['class']});
// words
const big=$('.words');
(function split(n){[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p))f.append(p);else{const s=document.createElement('span');s.className='wd';s.textContent=p;f.append(s)}});c.replaceWith(f)}else if(c.nodeType===1)split(c)})})(big);
const wds=[...big.querySelectorAll('.wd')];
// horizontal track
const track=$('#track'),work=$('.work'),wCount=$('#wCount'),wProg=$('#wProg');const cards=[];
W.forEach((w,i)=>{const a=document.createElement('a');a.className='pc';a.href=`https://${w[0]}.jarrettwroten.com/`;a.target='_blank';a.rel='noopener';a.innerHTML=`<div class="pc-f">${`<video class="pc-full" muted loop playsinline preload="none" poster="assets/home/film/w-${w[0]}-full.jpg?v=p26"><source src="assets/home/film/w-${w[0]}-full.webm?v=p26" type="video/webm; codecs=vp9"><source src="assets/home/film/w-${w[0]}-full.mp4?v=p26" type="video/mp4"></video>`}</div><div class="pc-i"><span class="pc-n" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="pc-h">${w[1]}<span class="pc-c">${w[2]}</span></span><span class="pc-o">Open The Concept</span></div>`;
track.append(a);cards.push(a)});
let cur=-1;
/* Playback guarantee: every carousel/hero video plays in every motion mode (no reduced-motion branch anywhere), explicit play() with catch + retry,
   retried again on the first scroll/tap/key, and a 1s watchdog that restarts any card in view that is paused or stalled. */
function ply(v,n){if(!v||paused)return;v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.playsInline=true;
 let pr;try{pr=v.play()}catch(_){}
 if(pr&&pr.catch)pr.catch(()=>{n=n||0;if(n<4)setTimeout(()=>ply(v,n+1),400*(n+1))})}
const kickAll=()=>{ply(hv);cards.forEach((c,j)=>{const v=c.querySelector('video');if(v&&Math.abs(j-cur)<=1&&window.__wn)ply(v)})};
['pointerdown','touchstart','keydown','wheel','scroll'].forEach(e=>addEventListener(e,()=>{kickAll()},{passive:true,once:true}));
/* Autoplay policy can need a real activation (click, tap, key). wheel/scroll are NOT activations, so the one-shot kick above can be spent without unlocking anything. Keep kicking on every real activation. */
['pointerdown','pointerup','mouseup','click','touchend','keydown'].forEach(e=>addEventListener(e,()=>{kickAll();$$('video[data-src]').forEach(v=>{if(v.src&&inView(v))ply(v)})},{passive:true}));
/* No-autoplay fallback: where the browser, OS or policy keeps <video> from advancing, an animated WebP of the same film (assets/home/film/<name>-a.webp, loaded only then) covers the frame. Detection is currentTime, not paused. The video is still retried and the WebP is removed again if it starts to advance. */
function inView(v){const r=v.getBoundingClientRect();return r.width>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}
function fbUrl(v){let b;if(v===hv)b=matchMedia('(max-width:700px) and (orientation:portrait)').matches?'assets/home/film/hero-sm-p29':'assets/home/film/hero-p29';else{const u=v.dataset.src||(v.querySelector('source')||{}).getAttribute&&v.querySelector('source').getAttribute('src')||v.currentSrc||v.getAttribute('src')||'';b=u.replace(/[?#].*$/,'').replace(/\.(mp4|webm)$/,'')}return b?new URL(b+'-a.webp',document.baseURI).href:''}
function fbShow(v){if(v.__fb)return;const u=fbUrl(v);if(!u)return;const im=new Image();im.className=(v.className+' vfb').trim();im.alt='';im.setAttribute('aria-hidden','true');im.decoding='async';im.style.cssText=v.style.cssText;im.src=u;if(!/^(absolute|fixed)$/.test(getComputedStyle(v).position)){v.__d=v.style.display;v.style.display='none'}v.after(im);v.__fb=im;v.dataset.fb='1'}
function fbHide(v){if(!v.__fb)return;v.__fb.remove();v.__fb=null;if(v.__d!==undefined){v.style.display=v.__d;v.__d=undefined}delete v.dataset.fb}
window.__fbShow=fbShow;
setInterval(()=>{if(document.hidden||!root.classList.contains('ready'))return;[hv,...$$('video')].forEach((v,k,a)=>{if(a.indexOf(v)!==k||v.closest('dialog'))return;
 const ci=cards.findIndex(c=>c.contains(v));let want=!paused&&inView(v)&&(ci<0||(window.__wn&&Math.abs(ci-cur)<=1));if(v.style.display==='none'&&v.__fb)want=!paused&&inView(v.__fb);
 const t=v.currentTime,adv=v.__lt!==undefined&&(t>v.__lt+.03||t<v.__lt-.5);v.__lt=t;
 if(!want){v.__st=0;v.__ok=0;return}
 if(adv&&!v.paused){v.__st=0;v.__ok=(v.__ok||0)+1;if(v.__fb&&v.__ok>=4)fbHide(v);return}
 v.__ok=0;v.__st=(v.__st||0)+1;if(v.paused||v.ended)ply(v);
 const buffering=!v.error&&v.readyState<3&&v.networkState===2;if(v.__st>=(buffering?12:4))fbShow(v)})},500);
setInterval(()=>{if(paused||document.hidden)return;cards.forEach((c,j)=>{const v=c.querySelector('video');if(!v||!window.__wn||Math.abs(j-cur)>1)return;if(v.paused||v.ended)ply(v);else if(v.readyState<2&&v.networkState===3)v.load()})},1000);
function setCur(i){if(i===cur)return;cur=i;cards.forEach((c,j)=>{c.classList.toggle('on',j===i);const v=c.querySelector('video');if(!v||!window.__wn)return;if(Math.abs(j-i)<=1){v.preload='auto';ply(v)}else v.pause()});wCount.textContent=String(i+1).padStart(2,'0');const wn=$('#wName');wn.querySelectorAll('.nm:not(.gone)').forEach(o=>{o.classList.remove('cur');o.classList.add('gone');setTimeout(()=>o.remove(),1000)});const sp=document.createElement('span');sp.className='nm';sp.innerHTML=W[i][1].replace(/(\S+)$/,'<em class="gs">$1</em>');wn.append(sp);sp.style.fontSize='';const aw=wn.clientWidth;if(sp.scrollWidth>aw){sp.style.fontSize=(parseFloat(getComputedStyle(sp).fontSize)*aw/sp.scrollWidth*0.98)+'px'}requestAnimationFrame(()=>requestAnimationFrame(()=>sp.classList.add('cur')))}
// reveals
const obs=$$('.fade,.mask,.me-p');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -12% 0px'});obs.forEach(o=>io.observe(o));
// lazy videos
const lz=$$('video[data-src]');
const lio=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){if(!v.src)v.src=(v.dataset.webm&&v.canPlayType('video/webm; codecs="vp9"')==='probably')?v.dataset.webm:v.dataset.src;ply(v)}else v.pause()}),{rootMargin:'300px'});lz.forEach(v=>lio.observe(v));
/* hero film: never auto-paused (not when off-screen, hidden, low-power, data saver or reduced motion); only the manual Pause pill stops it. Resumes with retry on view, tab return, any 'pause' it didn't ask for, and a 1s watchdog. */
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)ply(hv)})).observe(hv);
hv.addEventListener('pause',()=>{if(!paused&&!document.hidden)setTimeout(()=>{if(hv.paused&&!paused)ply(hv)},60)});
hv.addEventListener('stalled',()=>{if(!paused)ply(hv)});hv.addEventListener('suspend',()=>{if(!paused&&hv.paused)ply(hv)});
setInterval(()=>{if(!paused&&!document.hidden&&(hv.paused||hv.ended))ply(hv)},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!paused)ply(hv)});
// counter: Dylan's real figure (within 30 days)
const num=$('#dpNum');let counted=false;
function count(){if(counted||!num)return;counted=true;const to=30,s=performance.now(),D=1600;(function f(t){const p=Math.min(1,(t-s)/D),e=1-Math.pow(1-p,4);num.textContent=Math.round(to*e);if(p<1&&!paused)requestAnimationFrame(f);else num.textContent='30'})(s)}
if(num){num.textContent='0';new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){o.disconnect();count()}},{rootMargin:'0px 0px -15% 0px'}).observe(num);setTimeout(()=>{if(!counted&&num.getBoundingClientRect().top<innerHeight)count()},4000)}

// stacked cards + end film + header
const stackCards=$$('.card'),endW=$('.end-v-w'),bar=$('#bar');let last=0;
function onScroll(){const vh=innerHeight,y=scrollY;
 const b=big.getBoundingClientRect();const p=Math.min(1,Math.max(0,(vh*.85-b.top)/(b.height+vh*.3)));const n=Math.round(p*wds.length);wds.forEach((w,i)=>w.classList.toggle('lit',i<n||paused));
 const r=work.getBoundingClientRect(),span=r.height-vh;const q=Math.min(1,Math.max(0,-r.top/span));
 const max=track.scrollWidth-innerWidth;track.style.transform=`translate3d(${-q*max}px,0,0)`;wProg.style.width=(q*100)+'%';
 const center=innerWidth/2;let best=0,bd=1e9;cards.forEach((c,j)=>{const cr=c.getBoundingClientRect();const d=Math.abs(cr.left+cr.width/2-center);if(d<bd){bd=d;best=j}});if(matchMedia('(max-width:700px)').matches);else if(q>=.985)best=cards.length-1;else if(q<=.015)best=0;if(r.top<vh&&r.bottom>0)setCur(best);
 if(innerWidth>860)stackCards.forEach((c,i)=>{const nx=stackCards[i+1];if(!nx){c.style.transform='';return}const nr=nx.getBoundingClientRect(),cr=c.getBoundingClientRect();const k=Math.min(1,Math.max(0,(cr.bottom-nr.top)/cr.height));c.style.transform=`scale(${1-k*.06})`;c.style.filter=`brightness(${1-k*.35})`});
 const er=endW.getBoundingClientRect();const ep=Math.min(1,Math.max(0,(vh-er.top)/(vh*.9)));const ins=18*(1-ep);endW.style.clipPath=`inset(0 ${ins}% 0 ${ins}% round 8px)`;
 bar.classList.toggle('solid',y>vh*.85);if(y>vh*.85&&y>last+2)bar.classList.add('hide');if(y<last-2||y<vh*.85)bar.classList.remove('hide');last=y;
 if(y+vh>=document.documentElement.scrollHeight-40){root.classList.add('done');obs.forEach(o=>o.classList.add('in'))}}
lenis.on('scroll',onScroll);addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();setCur(0);
{const wk=document.querySelector('.work');new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){window.__wn=1;o.disconnect();const k=cur;cur=-1;setCur(k)}},{rootMargin:'100% 0px'}).observe(wk)}
setInterval(()=>obs.forEach(o=>{if(o.getBoundingClientRect().top<innerHeight)o.classList.add('in')}),900);
// pause
const pp=$('#pp');pp.onclick=()=>{paused=!paused;pp.setAttribute('aria-pressed',paused);pp.setAttribute('aria-label',paused?'Play motion':'Pause motion');pp.querySelector('.pp-t').textContent=paused?'Play':'Pause';root.classList.toggle('paused',paused);
 const vs=$$('video');if(paused){vs.forEach(v=>v.pause());po.classList.add('on');wds.forEach(w=>w.classList.add('lit'));obs.forEach(o=>o.classList.add('in'));if(num)num.textContent='30';counted=true}else{hv.play().catch(()=>{});const c=cards[cur];c&&c.querySelector('video')&&c.querySelector('video').play().catch(()=>{});lz.forEach(v=>{if(v.src&&v.getBoundingClientRect().top<innerHeight&&v.getBoundingClientRect().bottom>0)v.play().catch(()=>{})})}};
$('#top').onclick=()=>lenis.scrollTo(0,{duration:1.8,easing:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2});
})();
(()=>{const $=s=>document.querySelector(s),root=document.documentElement;
const wrap=$('#heroWrap'),hv=$('#heroV'),hc=$('.hero-c'),secs=[...document.querySelectorAll('[data-theme]')],cards=[...document.querySelectorAll('.pc')],work=$('.work'),tr=$('#track');
let snapT=0,snapping=false;
function loop(){const vh=innerHeight;
 const r=wrap.getBoundingClientRect();const p=Math.min(1,Math.max(0,-r.top/(r.height-vh)));const e=p*p*(3-2*p);
 hv.style.setProperty('--ix',(e*4)+'vw');hv.style.setProperty('--iy',(e*5)+'vh');hv.style.setProperty('--ir',(e*22)+'px');hc.style.transform=`translate3d(0,${-e*14}vh,0)`;hc.style.opacity=1-e*.9;hv.__fb&&(hv.__fb.style.cssText=hv.style.cssText);
 let th='dark';for(const s of secs){const b=s.getBoundingClientRect();if(b.top<vh*.5&&b.bottom>vh*.5){th=s.dataset.theme;break}}root.classList.toggle('light',th==='light');
 const cx=innerWidth/2;cards.forEach(c=>{const b=c.getBoundingClientRect();const d=(b.left+b.width/2-cx)/innerWidth;c.style.setProperty('--px',(-d*60)+'px')});
 requestAnimationFrame(loop)}
loop();
// snap the strip to the nearest card when scrolling settles inside it (inertia from Lenis, then snap)
const L=window.__lenis;
addEventListener('scroll',()=>{clearTimeout(snapT);if(snapping)return;snapT=setTimeout(()=>{const r=work.getBoundingClientRect(),vh=innerHeight,span=r.height-vh;if(r.top>0||r.bottom<vh)return;const q=-r.top/span,max=tr.scrollWidth-innerWidth;
 const offs=cards.map(c=>Math.min(1,Math.max(0,(c.offsetLeft+c.offsetWidth/2-innerWidth/2)/max)));let best=offs[0];offs.forEach(o=>{if(Math.abs(o-q)<Math.abs(best-q))best=o});
 const target=scrollY+(best-q)*span;if(Math.abs(target-scrollY)<4)return;snapping=true;(L?L.scrollTo(target,{duration:.9,easing:t=>1-Math.pow(1-t,4),onComplete:()=>snapping=false}):(scrollTo({top:target,behavior:'smooth'}),setTimeout(()=>snapping=false,900)));setTimeout(()=>snapping=false,1100)},160)},{passive:true});
// cursor
const cur=$('#cur');let mx=-100,my=-100,x=-100,y=-100;
addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;mx=e.clientX;my=e.clientY;cur.classList.add('on');cur.classList.toggle('big',!!e.target.closest('.pc'));cur.classList.toggle('hide',!e.target.closest('.pc')&&!!e.target.closest('a,button'))});
{const tk=document.getElementById('track');const off=()=>cur.classList.remove('big');tk.addEventListener('pointerleave',off);document.documentElement.addEventListener('pointerleave',()=>cur.classList.remove('on','big'));addEventListener('scroll',()=>{const r=tk.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||!(document.elementFromPoint(mx,my)||document.body).closest('.pc'))cur.classList.remove('big')},{passive:true})}
(function c(){x+=(mx-x)*.18;y+=(my-y)*.18;cur.style.transform=`translate3d(${x}px,${y}px,0)`;requestAnimationFrame(c)})();
// drag strip
let dn=false,sx=0,sy=0,moved=0;
tr.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;dn=true;sx=e.clientX;sy=scrollY;moved=0;tr.classList.add('drag');e.preventDefault()});
addEventListener('pointermove',e=>{if(!dn)return;const dx=e.clientX-sx;moved=Math.max(moved,Math.abs(dx));const span=work.offsetHeight-innerHeight,max=tr.scrollWidth-innerWidth;scrollTo(0,sy-dx*span/max)});
addEventListener('pointerup',()=>{dn=false;tr.classList.remove('drag')});
tr.addEventListener('click',e=>{if(moved>6){e.preventDefault();e.stopPropagation()}},true);
})();
(()=>{const $=s=>document.querySelector(s);
const W=[["rainbow","Rainbow Gardens","Wedding Venue"],["stirling","Stirling Club","Event Venue"],["rana","Rana Levy","Fine Jewelry"],["generations","Generations Kitchen","Restaurant"],["paina","P\u0101\u2018ina Caf\u00e9","Caf\u00e9"],["prorok","Dylan Prorok","Tattoo Artist"],["truheart","Tru Heart Consulting","Sales Team"],["purpleflare","Purple Flare Wraps","Wraps And Fleet"],["starbase","Starbase Wraps","Tesla Wraps"],["wrapstar","Wrapstar","Wraps And Coating"]];
const ml=$('#menuL');W.forEach((w,i)=>{const li=document.createElement('li');li.className='m-in';li.style.transitionDelay=(0.12+i*0.03)+'s';li.innerHTML=`<a href="https://${w[0]}.jarrettwroten.com/" target="_blank" rel="noopener">${w[1]}<span>${w[2]}</span></a>`;ml.append(li)});
const menu=$('#menu'),mb=$('#mbtn'),mc=$('#mclose');let last=null;
function open(){last=document.activeElement;menu.hidden=false;requestAnimationFrame(()=>menu.classList.add('open'));mb.setAttribute('aria-expanded','true');window.__lenis&&window.__lenis.stop();document.documentElement.style.overflow='hidden';setTimeout(()=>mc.focus(),50)}
function close(){menu.classList.remove('open');mb.setAttribute('aria-expanded','false');window.__lenis&&window.__lenis.start();document.documentElement.style.overflow='';setTimeout(()=>{menu.hidden=true},800);(last||mb).focus()}
mb.onclick=open;mc.onclick=close;
addEventListener('keydown',e=>{if(menu.hidden)return;if(e.key==='Escape')close();if(e.key==='Tab'){const f=[...menu.querySelectorAll('a,button')];const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setTimeout(close,100)));
// header CTA: only between hero and finale (one primary CTA per view)
const bar=$('#bar'),hero=$('#heroWrap'),end=$('.end');
function cta(){const vh=innerHeight,h=hero.getBoundingClientRect(),e=end.getBoundingClientRect();bar.classList.toggle('cta',h.bottom<vh*.4&&e.top>vh*.85)}
addEventListener('scroll',cta,{passive:true});cta();
})();

/* walkthrough (opt-in, restored) */
(()=>{const wo=document.getElementById('walkOpen'),dlg=document.getElementById('walkDialog');if(!wo||!dlg)return;
if(!dlg.showModal){wo.addEventListener('click',()=>{location.href='assets/home/walk/golden-arrival-approved.mp4'});return}
const v=document.getElementById('walkVideo'),sc=document.getElementById('walkScrub'),end=document.getElementById('walkEnd'),cl=document.getElementById('walkClose'),rp=document.getElementById('walkReplay');
const L=()=>window.__lenis||null;
function start(){end.hidden=true;v.currentTime=0;const p=v.play();if(p&&p.catch)p.catch(()=>{})}
wo.addEventListener('click',()=>{dlg.showModal();try{L()&&L().stop()}catch(e){}v.preload='auto';start();cl.focus()});
cl.addEventListener('click',()=>{v.pause();if(dlg.open)dlg.close()});
dlg.addEventListener('close',()=>{v.pause();try{L()&&L().start()}catch(e){}wo.focus()});
rp.addEventListener('click',start);
v.addEventListener('timeupdate',()=>{if(v.duration)sc.value=Math.round(v.currentTime/v.duration*1000)});
v.addEventListener('ended',()=>{end.hidden=false});
sc.addEventListener('input',()=>{if(v.duration){v.pause();v.currentTime=sc.value/1000*v.duration;end.hidden=true}});
sc.addEventListener('change',()=>{if(v.currentTime<v.duration-0.05){const p=v.play();if(p&&p.catch)p.catch(()=>{})}});})();

/* device QA: give the mobile card frame the real track height so the card never runs into the name line */
(function(){const t=document.getElementById('track');if(!t)return;const f=()=>{document.documentElement.style.setProperty('--trackH',t.clientHeight+'px')};f();addEventListener('resize',f,{passive:true});addEventListener('orientationchange',()=>setTimeout(f,300));addEventListener('load',f)})();

/* 1012 phones: the work strip is a native swipe carousel (no long pinned scroll) */
(function(){const t=document.getElementById('track'),pg=document.getElementById('wProg');if(!t)return;const mq=matchMedia('(max-width:700px)');
t.addEventListener('scroll',()=>{if(!mq.matches)return;const m=t.scrollWidth-t.clientWidth;dispatchEvent(new Event('scroll'));if(pg&&m>0)pg.style.width=(t.scrollLeft/m*100)+'%'},{passive:true})})();

/* AI Search Visibility demo: a search and an AI question, then the business lands first.
   Illustration only (no rankings, ratings or numbers). Final state is the default markup, so it
   reads complete with JS off or motion paused. */
(function(){const d=document.getElementById('svDemo');if(!d)return;const root=document.documentElement;
const T=[
 {g:'japanese tattoo artist las vegas',a:'Who should I call for a Japanese tattoo in Las Vegas?',t:'Japanese Tattoo Artist',t2:'Japanese tattoo artist'},
 {g:'wedding venue las vegas',a:'What’s a good wedding venue in Las Vegas?',t:'Wedding Venue',t2:'wedding venue'},
 {g:'car wrap shop las vegas',a:'Where should I get my car wrapped in Las Vegas?',t:'Car Wrap Shop',t2:'car wrap shop'}];
const q=k=>d.querySelector('[data-k="'+k+'"]');const G=q('g'),A=q('a'),t=q('t'),t2=q('t2');
let i=0,timers=[],running=false,seen=false;const P=()=>root.classList.contains('paused');
function clear(){timers.forEach(clearTimeout);timers=[]}
function at(ms,f){timers.push(setTimeout(f,ms))}
function type(el,s,ms0,per){el.textContent='';for(let k=0;k<=s.length;k++)at(ms0+k*per,()=>{el.textContent=s.slice(0,k)})}
function final(){clear();const c=T[i];G.textContent=c.g;A.textContent=c.a;t.textContent=c.t;t2.textContent=c.t2;d.className='sv-demo s-g s-r s-y s-a s-ans'}
function run(){if(P()){final();running=false;return}running=true;clear();const c=T[i];t.textContent=c.t;t2.textContent=c.t2;
 d.className='sv-demo anim';const pg=46,pa=30;
 type(G,c.g,250,pg);const g1=250+c.g.length*pg;
 at(g1+150,()=>d.classList.add('s-g'));          // results area appears
 at(g1+500,()=>d.classList.add('s-r'));          // other results load
 at(g1+1100,()=>d.classList.add('s-y'));         // your business lands first
 const a0=g1+700;type(A,c.a,a0,pa);const a1=a0+c.a.length*pa;
 at(a1+200,()=>d.classList.add('s-a'));
 at(a1+700,()=>d.classList.add('s-ans'));
 at(Math.max(g1+1100,a1+700)+3600,()=>{i=(i+1)%T.length;d.classList.add('s-out');at(600,run)})}
new IntersectionObserver(es=>{const e=es[0];if(e.isIntersecting){if(!running){seen=true;run()}}else if(running){final();running=false}},{threshold:.25}).observe(d);
document.getElementById('pp').addEventListener('click',()=>{if(P()){final();running=false}else if(seen){const r=d.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)run()}});
})();

/* hero CTA glides to the bottom-center dock as you scroll (one element; position and size follow scroll progress, rAF + light lerp; identical in every motion mode) */
(()=>{
const btn=document.querySelector('.hero-f .btn'),slot=document.querySelector('.hero-f'),hero=document.querySelector('.hero'),hc=document.querySelector('.hero-c'),end=document.querySelector('.end');
if(!btn||!slot||!hero)return;
const mqS=matchMedia('(max-width:860px)');
const probe=document.createElement('div');probe.setAttribute('aria-hidden','true');
probe.style.cssText='position:fixed;left:0;width:0;height:0;visibility:hidden;pointer-events:none';document.body.appendChild(probe);
let ax=0,ay=0,hw=0,dw=0,dh=0,dx=0,dy=0,sc=1,P=300,pd=0,tp=0,raf=0,last=0,ready=false,off=false;
btn.classList.add('dock-btn');
function ty(){if(!hc)return 0;const t=getComputedStyle(hc).transform;if(!t||t==='none')return 0;const m=t.match(/matrix(3d)?\(([^)]+)\)/);if(!m)return 0;const v=m[2].split(',').map(parseFloat);return m[1]?v[13]:v[5]}
function measure(){
 /* hero state: measure in the slot; dock state: measure as the fixed glide button */
 btn.classList.remove('fade');const inSlot=btn.parentNode===slot;
 if(!inSlot){btn.classList.remove('glide');btn.style.transform='';slot.appendChild(btn)}
 slot.style.minHeight='';const r=btn.getBoundingClientRect();hw=r.width;
 ax=r.left;ay=r.top+scrollY-ty()-scrollY+scrollY; /* viewport y at scrollY 0 */
 ay=r.top+scrollY-ty();
 slot.style.minHeight=r.height+'px';
 btn.classList.add('glide');document.body.appendChild(btn);btn.style.transform='translate(0,0)';
 dw=btn.offsetWidth;dh=btn.offsetHeight;
 probe.style.bottom=mqS.matches?'calc(46px + env(safe-area-inset-bottom,0px))':'calc(22px + env(safe-area-inset-bottom,0px))';
 const pb=probe.getBoundingClientRect().top;
 dx=Math.round((innerWidth-dw)/2);dy=pb-dh;
 sc=dw?hw/dw:1;
 P=Math.max(240,hero.offsetHeight*.7);
}
function draw(){
 const e=pd,s=sc+(1-sc)*e,x=ax+(dx-ax)*e,y=ay+(dy-ay)*e;
 btn.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)})`;
}
function endCheck(){
 const o=pd>.98&&!!end&&end.getBoundingClientRect().top<innerHeight*.75;
 if(o!==off){off=o;btn.classList.toggle('dock-off',o);btn.tabIndex=o?-1:0;btn.setAttribute('aria-hidden',o?'true':'false')}
}
function frame(t){
 raf=0;const dt=Math.min(64,t-(last||t));last=t;
 tp=Math.min(1,Math.max(0,scrollY/P));
 const k=1-Math.exp(-dt/85);pd+=(tp-pd)*k;
 if(Math.abs(tp-pd)<.0006)pd=tp;
 draw();endCheck();
 if(pd!==tp){raf=requestAnimationFrame(frame)}else last=0;
}
function sched(){if(!raf)raf=requestAnimationFrame(frame)}
function init(snap){measure();tp=Math.min(1,Math.max(0,scrollY/P));if(snap)pd=tp;draw();endCheck();ready=true;sched()}
addEventListener('scroll',sched,{passive:true});
let rt=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>init(true),120)});
const go=()=>init(true);
if(document.readyState==='complete')go();else addEventListener('load',go);
setTimeout(go,1200);setTimeout(go,4000);
window.__glide=()=>({pd,tp,P,ax,ay,dx,dy,sc,hw,dw,dh});
})();

/* purple comet v2: canvas-drawn on the gold CTA border. Long smooth tail (~80% of the perimeter, 140 additive segments, no banding) fading from bright lavender at the head to nothing,
   with a layered, tapered head bloom. Clipped to a thin ring inside the pill edge so the label/tap target stay clean. One shared rAF loop, only visible buttons draw, 3.4s loop, runs in every motion mode. */
(()=>{
const LOOP=3400,N=200,TAIL=.98;
const items=[];let raf=0;
function add(btn){
 if(!btn||btn.querySelector('canvas.comet2'))return;
 const old=btn.querySelector('svg.comet');old&&old.remove();
 const cv=document.createElement('canvas');cv.className='comet2';cv.setAttribute('aria-hidden','true');btn.appendChild(cv);
 const it={btn,cv,ctx:cv.getContext('2d'),w:0,h:0,vis:true,dpr:1};
 function fit(){const w=btn.offsetWidth,h=btn.offsetHeight;if(!w||!h)return;const d=Math.min(2,window.devicePixelRatio||1);it.w=w;it.h=h;it.dpr=d;cv.width=Math.round(w*d);cv.height=Math.round(h*d);it.geo=null;draw(it,performance.now())}
 fit();
 if('ResizeObserver' in window)new ResizeObserver(fit).observe(btn);else addEventListener('resize',fit);
 if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(e=>{it.vis=e.isIntersecting;kick()})).observe(btn);
 items.push(it);
}
function geo(it){
 const ins=2.2,W=it.w-2*ins,H=it.h-2*ins,r=H/2,S=Math.max(0,W-2*r),P=2*S+2*Math.PI*r;
 return it.geo={ins,r,S,P,band:Math.max(8,Math.min(12,it.h*.23))}}
function at(g,s){
 s=((s%g.P)+g.P)%g.P;const {ins,r,S}=g,A=Math.PI*r;
 if(s<S)return[ins+r+s,ins,0];s-=S;
 if(s<A){const a=-Math.PI/2+s/r;return[ins+r+S+Math.cos(a)*r,ins+r+Math.sin(a)*r,a+Math.PI/2]}s-=A;
 if(s<S)return[ins+r+S-s,ins+2*r,Math.PI];s-=S;
 const a=Math.PI/2+s/r;return[ins+r+Math.cos(a)*r,ins+r+Math.sin(a)*r,a+Math.PI/2]}
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const C0=[236,224,255],C1=[167,123,255],C2=[124,74,230];
function col(u){return u<.18?mix(C0,C1,u/.18):mix(C1,C2,Math.min(1,(u-.18)/.82))}
function draw(it,now){
 const g=it.geo||geo(it),c=it.ctx,d=it.dpr;if(!it.w)return;
 c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,it.w,it.h);
 const sh=((now%LOOP)/LOOP)*g.P,Lt=g.P*TAIL;
 c.save();
 /* clip to a thin ring just inside the pill edge (keeps the label area untouched) */
 const R=it.h/2,b=g.band,ir=Math.max(1,R-b);
 c.beginPath();rr(c,0,0,it.w,it.h,R);rr(c,b,b,it.w-2*b,it.h-2*b,ir);c.clip('evenodd');
 c.globalCompositeOperation='lighter';c.lineCap='butt';c.lineJoin='round';
 for(let pass=0;pass<2;pass++){
  c.lineWidth=pass?2.3:5.6;
  for(let i=0;i<N;i++){
   const u0=i/N,u1=(i+1)/N,um=(u0+u1)/2,a=Math.pow(1-um,.7)*(pass?.9:.38);
   const p0=at(g,sh-u0*Lt),p1=at(g,sh-u1*Lt),k=col(um);
   c.strokeStyle='rgba('+k[0]+','+k[1]+','+k[2]+','+a.toFixed(3)+')';
   c.beginPath();c.moveTo(p0[0],p0[1]);c.lineTo(p1[0],p1[1]);c.stroke()}}
 /* head: tapered bloom leading into the tail, three soft blurred layers + a tight white-lavender core (no hard dot) */
 const H=at(g,sh);
 const L=[[-9,30,9.5,'139,92,246',.72],[-4,16,6.5,'196,162,255',.7],[-1.2,6.2,3.1,'243,234,255',.95]];
 L.forEach(l=>{c.save();c.translate(H[0],H[1]);c.rotate(H[2]);c.translate(l[0],0);c.scale(l[1]/l[2],1);
  const gr=c.createRadialGradient(0,0,0,0,0,l[2]);gr.addColorStop(0,'rgba('+l[3]+','+l[4]+')');gr.addColorStop(.45,'rgba('+l[3]+','+(l[4]*.4).toFixed(3)+')');gr.addColorStop(1,'rgba('+l[3]+',0)');
  c.fillStyle=gr;c.beginPath();c.arc(0,0,l[2],0,Math.PI*2);c.fill();c.restore()});
 c.restore();
 it.head=H}
function rr(c,x,y,w,h,r){c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arc(x+w-r,y+r,r,-Math.PI/2,Math.PI/2);c.lineTo(x+r,y+h);c.arc(x+r,y+r,r,Math.PI/2,Math.PI*1.5);c.closePath()}
function live(it){return it.vis&&it.w&&!it.btn.classList.contains('dock-off')&&it.btn.getClientRects().length>0}
function frame(now){raf=0;let any=false;items.forEach(it=>{if(live(it)){draw(it,now);any=true}});if(any)raf=requestAnimationFrame(frame)}
function kick(){if(!raf)raf=requestAnimationFrame(frame)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});
addEventListener('scroll',kick,{passive:true});
addEventListener('click',kick,true);
window.__cometDbg={items,draw,geo,at,TAIL,LOOP};
function run(){document.querySelectorAll('.hero-f .btn, .btn.dock-btn, .end-a .btn, .menu-cta').forEach(add);kick()}
run();setInterval(kick,1500);
})();
