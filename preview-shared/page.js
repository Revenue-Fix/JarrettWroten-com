/* Subpage motion: same Lenis, header, menu, Pause, reveals and purple comet as the homepage (site.js), without homepage-only sections. Full motion always plays. */
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],root=document.documentElement;
let paused=false;
const touchFirst=matchMedia('(pointer:coarse)').matches;
const lenis=(!touchFirst&&window.Lenis)?new Lenis({lerp:.1,smoothWheel:true}):{raf(){},on(){},stop(){root.style.overflow='hidden'},start(){root.style.overflow=''},scrollTo(y){scrollTo({top:typeof y==='number'?y:0,behavior:'smooth'})}};
window.__lenis=lenis;(function raf(t){lenis.raf(t);requestAnimationFrame(raf)})();
// reveals
const obs=$$('.mask,.fade');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
requestAnimationFrame(()=>{root.classList.add('ready');obs.forEach(o=>io.observe(o))});
setInterval(()=>obs.forEach(o=>{if(o.getBoundingClientRect().top<innerHeight)o.classList.add('in')}),900);
// lazy film, plays at normal speed
const vids=$$('video[data-src]');
const vio=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){if(!v.src){v.src=v.dataset.src}v.playbackRate=1;if(!paused)v.play().catch(()=>{})}else v.pause()}),{rootMargin:'25% 0px'});
vids.forEach(v=>vio.observe(v));
// header + film widen
const bar=$('#bar'),film=$('.pg-film'),hbg=$('.pg-bg'),hv=$('.pg-v'),hc=$('.pg-hero .pg-c'),hs=$('.pg-hero');let last=0;
if(hv){hv.playbackRate=1;hv.play().catch(()=>{})}
function onScroll(){const vh=innerHeight,y=scrollY;
 if(hs&&!paused){const r=hs.getBoundingClientRect();const p=Math.min(1,Math.max(0,-r.top/Math.max(1,r.height)));const e=p*p*(3-2*p);hbg.style.setProperty('--ix',(e*4)+'vw');hbg.style.setProperty('--iy',(e*5)+'vh');hbg.style.setProperty('--ir',(e*22)+'px');hv.style.setProperty('--vs',(1.06-e*.06).toFixed(4));hc.style.transform=`translate3d(0,${-e*14}vh,0)`;hc.style.opacity=1-e*.9}
 if(film&&innerWidth>860&&!paused){const r=film.getBoundingClientRect();const p=Math.min(1,Math.max(0,(vh-r.top)/(vh*.9)));const ins=18*(1-p);film.style.clipPath=`inset(0 ${ins}% 0 ${ins}% round 8px)`}
 bar.classList.toggle('solid',y>80);if(y>vh*.6&&y>last+2)bar.classList.add('hide');if(y<last-2||y<vh*.6)bar.classList.remove('hide');last=y;
 if(y+vh>=root.scrollHeight-40){root.classList.add('done');obs.forEach(o=>o.classList.add('in'))}}
lenis.on('scroll',onScroll);addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
// pause
const pp=$('#pp');pp.onclick=()=>{paused=!paused;pp.setAttribute('aria-pressed',paused);pp.setAttribute('aria-label',paused?'Play motion':'Pause motion');pp.querySelector('.pp-t').textContent=paused?'Play':'Pause';root.classList.toggle('paused',paused);
 if(paused){vids.forEach(v=>v.pause());hv&&hv.pause();obs.forEach(o=>o.classList.add('in'))}else{hv&&hv.play().catch(()=>{});vids.forEach(v=>{const b=v.getBoundingClientRect();if(v.src&&b.top<innerHeight&&b.bottom>0)v.play().catch(()=>{})});onScroll()}};
$('#top').onclick=()=>lenis.scrollTo(0,{duration:1.8,easing:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2});
// menu
const menu=$('#menu'),mb=$('#mbtn'),mc=$('#mclose');let lastF=null;
function open(){lastF=document.activeElement;menu.hidden=false;requestAnimationFrame(()=>menu.classList.add('open'));mb.setAttribute('aria-expanded','true');lenis.stop();root.style.overflow='hidden';setTimeout(()=>mc.focus(),50)}
function close(){menu.classList.remove('open');mb.setAttribute('aria-expanded','false');lenis.start();root.style.overflow='';setTimeout(()=>{menu.hidden=true},800);(lastF||mb).focus()}
mb.onclick=open;mc.onclick=close;
addEventListener('keydown',e=>{if(menu.hidden)return;if(e.key==='Escape')close();if(e.key==='Tab'){const f=[...menu.querySelectorAll('a,button')];const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setTimeout(close,100)));
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
function run(){document.querySelectorAll('.end-a .btn, .menu-cta').forEach(add);kick()}
run();setInterval(kick,1500);
})();

