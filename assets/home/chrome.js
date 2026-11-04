/* Older pages (Oct 17 stylesheets): the homepage header, Menu and docked consult button, inside a shadow root so the page's own styles and the homepage styles never touch each other. Same markup and stylesheets as the service pages. Full motion always plays. */
(()=>{
const host=document.querySelector('jw-chrome');if(!host)return;
let R=host.shadowRoot;
if(!R){const t=host.querySelector('template[shadowrootmode]');if(!t)return;R=host.attachShadow({mode:'open'});R.appendChild(t.content);t.remove()}
window.__jwChromeRoot=R;
const $=s=>R.querySelector(s),root=document.documentElement,wrap=$('.jwc');
/* reveal once every stylesheet in the shadow root has loaded (no unstyled flash) */
const links=[...R.querySelectorAll('link[rel=stylesheet]')];
const shown=()=>{wrap.classList.add('ok');requestAnimationFrame(()=>wrap.classList.add('ready'))};
let left=links.filter(l=>!l.sheet).length;if(!left)shown();else links.forEach(l=>{if(!l.sheet){const d=()=>{if(--left<=0)shown()};l.addEventListener('load',d,{once:true});l.addEventListener('error',d,{once:true})}});
/* header stays visible, turns solid once you scroll */
const bar=$('#bar');
function spacer(){if(host.hasAttribute('spacer'))host.style.height=bar.offsetHeight+'px'}
/* Pause: drives the page's own motion control when it has one, otherwise pauses the page's films */
const pp=$('#pp'),pageBtn=document.getElementById('motionBtn'),JM=window.JW_MOTION;
function isPaused(){if(pageBtn)return pageBtn.getAttribute('aria-pressed')==='true';if(JM)return JM.value!=='on';return root.classList.contains('jwc-paused')}
function sync(){const p=isPaused();pp.setAttribute('aria-pressed',p);pp.setAttribute('aria-label',p?'Play motion':'Pause motion');pp.querySelector('.pp-t').textContent=p?'Play':'Pause';wrap.classList.toggle('paused',p)}
pp.onclick=()=>{if(pageBtn)pageBtn.click();else if(JM)JM.set(JM.value!=='on','visitor',true);else{const p=!root.classList.contains('jwc-paused');root.classList.toggle('jwc-paused',p);document.querySelectorAll('video').forEach(v=>{if(p)v.pause();else{const b=v.getBoundingClientRect();if(b.top<innerHeight&&b.bottom>0)v.play().catch(()=>{})}})}sync()};
addEventListener('jw-motion-change',sync);sync();
/* menu */
const menu=$('#menu'),mb=$('#mbtn'),mc=$('#mclose');let lastF=null;
const act=()=>R.activeElement;
function open(){lastF=act()||document.activeElement;menu.hidden=false;requestAnimationFrame(()=>menu.classList.add('open'));mb.setAttribute('aria-expanded','true');root.style.overflow='hidden';setTimeout(()=>mc.focus(),50)}
function close(){menu.classList.remove('open');mb.setAttribute('aria-expanded','false');root.style.overflow='';setTimeout(()=>{menu.hidden=true},800);(lastF&&lastF.focus?lastF:mb).focus()}
mb.onclick=open;mc.onclick=close;
addEventListener('keydown',e=>{if(menu.hidden)return;if(e.key==='Escape')close();if(e.key==='Tab'){const f=[...menu.querySelectorAll('a,button')];const a=f[0],z=f[f.length-1];if(e.shiftKey&&act()===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&act()===z){e.preventDefault();a.focus()}}});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setTimeout(close,100)));
/* docked consult button: these pages have no hero button to glide from, so it rises into the same bottom-center dock once you scroll, and steps aside at the page's own closing call to action */
const btn=$('.btn.dock-btn');
const mqS=matchMedia('(max-width:860px)');
const books=[...document.querySelectorAll('a[href*="/book"]')].filter(a=>!a.closest('footer'));
const lastBook=books[books.length-1];
const end=lastBook?(lastBook.closest('section')||lastBook):null;
let off=null,raf=0;
const probe=document.createElement('div');probe.setAttribute('aria-hidden','true');probe.style.cssText='position:fixed;left:0;width:0;height:0;visibility:hidden;pointer-events:none';wrap.appendChild(probe);
function place(){const dw=btn.offsetWidth,dh=btn.offsetHeight;probe.style.bottom=mqS.matches?'calc(46px + env(safe-area-inset-bottom,0px))':'calc(22px + env(safe-area-inset-bottom,0px))';const x=Math.round((innerWidth-dw)/2),y=Math.round(probe.getBoundingClientRect().top-dh);btn.style.transform=`translate3d(${x}px,${y}px,0)`}
/* steps aside wherever it would sit on one of the page's own links or buttons, so it never covers a tap target (a whole-card link taller than 200px stays tappable around it, as on the homepage work cards) */
function overLink(){const r=btn.getBoundingClientRect(),M=20;if(!r.width)return false;for(const fy of [r.top-M,r.top+r.height/2,r.bottom+M])for(const fx of [.08,.3,.5,.7,.92]){const x=r.left+r.width*fx;if(fy<0||fy>innerHeight)continue;const e=document.elementsFromPoint(x,fy).find(n=>n!==host&&!host.contains(n));const a=e&&e.closest('a,button,input,select,textarea,[role=button]');if(a&&a.getBoundingClientRect().height<200)return true}return false}
function check(){raf=0;const y=scrollY;bar.classList.toggle('solid',y>80);
 const ft=document.querySelector('footer');
 const o=y<Math.min(innerHeight*.35,260)||(!!end&&end.getBoundingClientRect().top<innerHeight*.75)||(!!ft&&ft.getBoundingClientRect().top<innerHeight*.9);
 const v=!o&&overLink();btn.classList.toggle('dock-sv',v);const oo=o||v;
 if(oo!==off){off=oo;btn.classList.toggle('dock-off',oo);btn.tabIndex=oo?-1:0;btn.setAttribute('aria-hidden',oo?'true':'false')}}

function sched(){if(!raf)raf=requestAnimationFrame(check)}
addEventListener('scroll',sched,{passive:true});
let rt=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{place();spacer();check()},120)});
const go=()=>{place();spacer();check()};go();setInterval(()=>{if(!document.hidden)sched()},400);
if(document.readyState!=='complete')addEventListener('load',go);setTimeout(go,1200);setTimeout(go,4000);
if(document.fonts)document.fonts.ready.then(go);
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
window.__cometDbgChrome={items,draw,geo,at,TAIL,LOOP};
function run(){const R=window.__jwChromeRoot;if(!R)return;R.querySelectorAll('.btn.dock-btn, .menu-cta').forEach(add);kick()}
run();setInterval(kick,1500);
})();

