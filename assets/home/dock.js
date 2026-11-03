/* Subpages: the same docked consult button as the homepage (copied from site.js; the hero CTA glides to the bottom-center dock and steps aside at the closing Book section). */
/* hero CTA glides to the bottom-center dock as you scroll (one element; position and size follow scroll progress, rAF + light lerp; identical in every motion mode) */
(()=>{
const svA=null,svZ=null;
const btn=document.querySelector('.hero-f .btn'),slot=document.querySelector('.hero-f'),hero=document.querySelector('.hero, .pg-hero'),hc=document.querySelector('.hero-c, .pg-hero .pg-c'),end=document.querySelector('.end');
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
 /* steps aside (fades, untappable) wherever it would sit on the search section's headline, demo cards or copy, so it never covers text or the demo's Call/Website buttons */
 let sv=false;if(svA&&svZ){const b=btn.getBoundingClientRect(),M=56,t=svA.getBoundingClientRect().top,z=svZ.getBoundingClientRect().bottom;sv=b.bottom+M>t&&b.top-M<z}
 const o=sv||(pd>.98&&!!end&&end.getBoundingClientRect().top<innerHeight*.75);
 btn.classList.toggle('dock-sv',sv);if(o!==off){off=o;btn.classList.toggle('dock-off',o);btn.tabIndex=o?-1:0;btn.setAttribute('aria-hidden',o?'true':'false')}
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

