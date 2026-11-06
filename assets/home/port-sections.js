/* Portable homepage section motion for service pages: search demo, Dylan count, work strip. Does not touch the homepage hero or loader. */
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],root=document.documentElement;
const P=()=>root.classList.contains('paused');
$$('.words').forEach(big=>{(function split(n){[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p))f.append(p);else{const s=document.createElement('span');s.className='wd';s.textContent=p;f.append(s)}});c.replaceWith(f)}else if(c.nodeType===1)split(c)})})(big)});
function ply(v,n){if(!v||P()||v.__done)return;v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.playsInline=true;
 let pr;try{pr=v.play()}catch(_){}
 if(pr&&pr.catch)pr.catch(()=>{n=n||0;if(n<4)setTimeout(()=>ply(v,n+1),400*(n+1))})}

const num=$('#dpNum');let counted=false;
function count(){if(counted||!num)return;counted=true;const to=30,s=performance.now(),D=1600;(function f(t){const p=Math.min(1,(t-s)/D),e=1-Math.pow(1-p,4);num.textContent=Math.round(to*e);if(p<1&&!P())requestAnimationFrame(f);else num.textContent='30'})(s)}
if(num){num.textContent='0';new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){o.disconnect();count()}},{rootMargin:'0px 0px -15% 0px'}).observe(num);setTimeout(()=>{if(!counted&&num.getBoundingClientRect().top<innerHeight)count()},4000)}

(function(){const d=document.getElementById('svDemo');if(!d)return;
const T=[
 {g:'japanese tattoo artist las vegas',a:'Who should I call for a Japanese tattoo in Las Vegas?',t:'Japanese Tattoo Artist',t2:'Japanese tattoo artist'},
 {g:'wedding venue las vegas',a:'What’s a good wedding venue in Las Vegas?',t:'Wedding Venue',t2:'wedding venue'},
 {g:'car wrap shop las vegas',a:'Where should I get my car wrapped in Las Vegas?',t:'Car Wrap Shop',t2:'car wrap shop'}];
const q=k=>d.querySelector('[data-k="'+k+'"]');const G=q('g'),A=q('a'),t=q('t'),t2=q('t2');
let i=0,timers=[],running=false,seen=false;
function clear(){timers.forEach(clearTimeout);timers=[]}
function at(ms,f){timers.push(setTimeout(f,ms))}
function type(el,s,ms0,per){if(!el)return;el.textContent='';for(let k=0;k<=s.length;k++)at(ms0+k*per,()=>{el.textContent=s.slice(0,k)})}
function final(){clear();const c=T[i];if(G)G.textContent=c.g;if(A)A.textContent=c.a;if(t)t.textContent=c.t;if(t2)t2.textContent=c.t2;d.className='sv-demo s-g s-r s-y s-a s-ans'}
function run(){if(P()){final();running=false;return}running=true;clear();const c=T[i];if(t)t.textContent=c.t;if(t2)t2.textContent=c.t2;
 d.className='sv-demo anim';const pg=46,pa=30;
 type(G,c.g,250,pg);const g1=250+c.g.length*pg;
 at(g1+150,()=>d.classList.add('s-g'));
 at(g1+500,()=>d.classList.add('s-r'));
 at(g1+1100,()=>d.classList.add('s-y'));
 const a0=g1+700;type(A,c.a,a0,pa);const a1=a0+c.a.length*pa;
 at(a1+200,()=>d.classList.add('s-a'));
 at(a1+700,()=>d.classList.add('s-ans'));
 at(Math.max(g1+1100,a1+700)+3600,()=>{i=(i+1)%T.length;d.classList.add('s-out');at(600,run)})}
new IntersectionObserver(es=>{const e=es[0];if(e.isIntersecting){if(!running){seen=true;run()}}else if(running){final();running=false}},{threshold:.25}).observe(d);
const pp=document.getElementById('pp');
if(pp)pp.addEventListener('click',()=>{if(P()){final();running=false}else if(seen){const r=d.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)run()}});
})();

(function(){
const W=[["rainbow","Rainbow Gardens","Wedding Venue"],["stirling","Stirling Club","Wedding And Event Venue"],["rana","Rana Levy","Fine Jewelry And Lapidary"],["generations","Generations Kitchen","Hawaiian Restaurant"],["paina","Pāʻina Café","Hawaiian Café"],["prorok","Dylan Prorok","Japanese Tattoo Artist"],["truheart","Tru Heart Consulting","Sales Team Consulting"],["purpleflare","Purple Flare Wraps","Wraps And Fleet Graphics"],["wrapstar","Wrapstar","Wraps, Ceramic Coating And Tint"]];
const track=document.getElementById('track'),work=document.querySelector('section.work'),wCount=document.getElementById('wCount'),wProg=document.getElementById('wProg');
if(!track||!work)return;
const cards=[];
W.forEach((w,i)=>{const a=document.createElement('a');a.className='pc';a.href=`https://${w[0]}.jarrettwroten.com/`;a.target='_blank';a.rel='noopener';
 const ver=w[0]==='truheart'?'p33':'p26';
 a.innerHTML=`<div class="pc-f"><video class="pc-full" muted loop playsinline preload="none" data-poster="/assets/home/film/w-${w[0]}-full.webp?v=${ver}"><source src="/assets/home/film/w-${w[0]}-full.webm?v=${ver}" type="video/webm; codecs=vp9"><source src="/assets/home/film/w-${w[0]}-full.mp4?v=${ver}" type="video/mp4"></video></div><div class="pc-i"><span class="pc-n" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="pc-h">${w[1]}<span class="pc-c">${w[2]}</span></span><span class="pc-o">Open The Concept</span></div>`;
 track.append(a);cards.push(a)});
let cur=-1;
const live=(c,j)=>Math.abs(j-cur)<=1||!!c.__vis;
function setCur(i){if(i===cur)return;cur=i;cards.forEach((c,j)=>{c.classList.toggle('on',j===i);const v=c.querySelector('video');if(!v)return;if(live(c,j)){v.preload='auto';if(!P())ply(v)}else v.pause()});
 if(wCount)wCount.textContent=String(i+1).padStart(2,'0');
 const wn=$('#wName');if(!wn)return;
 wn.querySelectorAll('.nm:not(.gone)').forEach(o=>{o.classList.remove('cur');o.classList.add('gone');setTimeout(()=>o.remove(),1000)});
 const sp=document.createElement('span');sp.className='nm';sp.innerHTML=W[i][1].replace(/(\S+)$/,'<em class="gs">$1</em>');wn.append(sp);sp.style.fontSize='';
 const aw=wn.clientWidth;if(sp.scrollWidth>aw){sp.style.fontSize=(parseFloat(getComputedStyle(sp).fontSize)*aw/sp.scrollWidth*0.98)+'px'}
 requestAnimationFrame(()=>requestAnimationFrame(()=>sp.classList.add('cur')))}
function onScroll(){const vh=innerHeight,r=work.getBoundingClientRect(),span=Math.max(1,r.height-vh);
 const q=Math.min(1,Math.max(0,-r.top/span));
 const max=track.scrollWidth-innerWidth;
 track.style.transform=`translate3d(${-q*max}px,0,0)`;
 if(wProg)wProg.style.width=(q*100)+'%';
 const center=innerWidth/2;let best=0,bd=1e9;
 cards.forEach((c,j)=>{const cr=c.getBoundingClientRect();const d=Math.abs(cr.left+cr.width/2-center);if(d<bd){bd=d;best=j}});
 if(matchMedia('(max-width:700px)').matches);else if(q>=.985)best=cards.length-1;else if(q<=.015)best=0;
 if(r.top<vh&&r.bottom>0)setCur(best)}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();setCur(0);
window.__wn=1;
{const cio=new IntersectionObserver(es=>es.forEach(e=>{const c=e.target;c.__vis=e.isIntersecting;const v=c.querySelector('video');if(v&&c.__vis&&!P()){v.preload='auto';ply(v)}}));cards.forEach(c=>cio.observe(c))}
(function(){const t=track,pg=wProg;const mq=matchMedia('(max-width:700px)');
 t.addEventListener('scroll',()=>{if(!mq.matches)return;const m=t.scrollWidth-t.clientWidth;if(pg&&m>0)pg.style.width=(t.scrollLeft/m*100)+'%'},{passive:true})})();
const f=()=>{root.style.setProperty('--trackH',track.clientHeight+'px')};f();addEventListener('resize',f,{passive:true});
const pp=document.getElementById('pp');
if(pp)pp.addEventListener('click',()=>{if(P()){cards.forEach(c=>{const v=c.querySelector('video');if(v)v.pause()})}else{const c=cards[cur];const v=c&&c.querySelector('video');if(v)ply(v)}});
})();
})();
