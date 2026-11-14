/* Booked, Chosen, Found demo. Motion always on (no reduced motion branch); one Pause control. */
(function(){
var D=document,H=D.documentElement,W=window;
if(!W.gsap||!W.Lenis){return;} /* no libs: the page stays in plain readable flow */
H.classList.add('js');
var g=W.gsap,E='expo.out';
var beats=[].slice.call(D.querySelectorAll('.beat'));
var stages=beats.map(function(b){return b.querySelector('.stage');});
var LEN=[1.0,1.5,1.9,1.8,1.6,1.1,1.5,1.7,1.6,1.5,1.2]; /* scroll per beat, in screens */
var vh=0,starts=[],ends=[],total=0,W_=0,lenis=null,paused=false,lastW=0,cur=0;
function $(s,r){return (r||D).querySelector(s);} function $$(s,r){return [].slice.call((r||D).querySelectorAll(s));}
function clamp(v){return v<0?0:v>1?1:v;} function sm(t){t=clamp(t);return t*t*(3-2*t);}

/* ---------- generated parts ---------- */
var grid=$('.grid100'),onIdx=[];
(function(){var order=[],i,seed=11;for(i=0;i<100;i++)order.push(i);function r(){seed=(seed*9301+49297)%233280;return seed/233280;}
 for(i=99;i>0;i--){var j=Math.floor(r()*(i+1));var t=order[i];order[i]=order[j];order[j]=t;}
 onIdx=order.slice(0,54);for(i=0;i<100;i++)grid.appendChild(D.createElement('i'));})();
var dots=$$('i',grid),onDots=onIdx.map(function(i){return dots[i];});


/* outlier chart: a cluster of sample shops near the average */
var opd=$('.op-dots');(function(){var seed=7,i;function r(){seed=(seed*9301+49297)%233280;return seed/233280;}
 for(i=0;i<22;i++){var d=D.createElement('i');d.style.left=(5+i*3.5+r()*2)+'%';d.style.bottom=(14+r()*20)+'%';opd.appendChild(d);}})();
var opDots=$$('i',opd);

/* ---------- hook: three places money leaks, lit one at a time (time based) ---------- */
var lks=$$('.b1 .lk'),heroTl=g.timeline({repeat:-1});
lks.forEach(function(r){var f=$('.lk-f',r),d=$('.lk-d',r),seg=g.timeline();
  seg.to(r,{opacity:1,borderColor:'rgba(212,174,90,.55)',duration:.5,ease:E},0)
     .fromTo(f,{scaleX:1},{scaleX:.38,duration:1.6,ease:'power2.inOut'},.3)
     .fromTo(d,{opacity:0,y:-4},{opacity:1,y:22,duration:.8,ease:'power2.in',repeat:1,repeatDelay:.1},.5)
     .to(d,{opacity:0,duration:.2},'>')
     .to(r,{opacity:.72,borderColor:'rgba(238,232,221,.08)',duration:.6,ease:E},'+=.6')
     .to(f,{scaleX:1,duration:.6,ease:E},'<');
  heroTl.add(seg);});
var heroIn=g.timeline({delay:.15});
heroIn.from('.h1 .w',{yPercent:110,duration:1.2,ease:E,stagger:.12})
      .from('.srch',{y:30,opacity:0,duration:1.2,ease:E},.35)
      .from('.cue',{opacity:0,duration:1,ease:E},.9);

/* ---------- per beat scroll timelines (normalized) ---------- */
var tls=[];
function T(){var t=g.timeline({paused:true,defaults:{ease:'power2.out'}});tls.push(t);return t;}
/* 1 hook drifts on the way out */
T().to('.b1 .hook-copy',{y:-30,duration:1},0).to('.b1 .srch',{y:-16,duration:1},0);
/* pain: the ways leads slip away, one at a time */
T().from('.bp .h2',{y:40,opacity:0,duration:.14},0)
   .from('.bp .pain li',{x:-24,opacity:0,duration:.1,stagger:.1},.12)
   .from('.bp .pd',{scale:0,duration:.08,stagger:.1,ease:'back.out(3)'},.16)
   .from('.bp .nt',{y:50,opacity:0,duration:.14},.04)
   .from('.bp .nt-i',{x:30,opacity:0,duration:.08,stagger:.09},.14)
   .from('.bp .nt-x',{opacity:0,y:10,duration:.1},.56)
   .to({},{duration:.25});
/* not alone: four sourced numbers count up */
var cns=$$('.bs .cn');
T().from('.bs .h2',{y:40,opacity:0,duration:.12},0)
   .from('.bs .sub',{y:20,opacity:0,duration:.1},.08)
   .from('.bs .sc',{y:50,opacity:0,duration:.14,stagger:.07},.14);
cns.forEach(function(c,i){var to=+c.getAttribute('data-to'),o={v:0};tls[tls.length-1].to(o,{v:to,duration:.26,ease:'power1.out',onUpdate:function(){c.textContent=Math.round(o.v);}},.18+i*.07);});
tls[tls.length-1].from('.bs .sc-s',{opacity:0,duration:.08,stagger:.05},.5).to({},{duration:.22});
/* 2 proof: 54 of 100 light up gold */
var nEl=$('#n54'),cnt={v:0};
T().from('.b2 .big',{y:60,opacity:0,duration:.18},0)
   .from(dots,{scale:0,opacity:0,duration:.16,stagger:{each:.0012,from:'start'}},0)
   .to(cnt,{v:54,duration:.46,ease:'power1.inOut',onUpdate:function(){nEl.textContent=Math.round(cnt.v);}},.08)
   .to(onDots,{backgroundColor:'#f3dc9a',boxShadow:'0 0 10px rgba(243,220,154,.35)',duration:.02,stagger:.44/54},.08)
   .from('.b2 .h2',{y:40,opacity:0,duration:.18},.4)
   .from('.b2 .sub',{y:24,opacity:0,duration:.14},.5)
   .from('.b2 .src',{opacity:0,duration:.12},.58)
   .to({},{duration:.3});
/* outlier: the cluster settles near the average, one gold dot climbs clear of it */
T().from('.bo .h2',{y:40,opacity:0,duration:.12},0)
   .from('.bo .op',{y:50,opacity:0,duration:.14},.04)
   .from(opDots,{opacity:0,y:20,duration:.08,stagger:.006},.1)
   .from('.bo .op-avg',{scaleX:0,transformOrigin:'left center',duration:.12},.16)
   .from('.bo .op-you',{bottom:'26%',duration:.26,ease:'power3.inOut'},.3)
   .from('.bo .op-stem',{scaleY:0,duration:.26,ease:'power3.inOut'},.3)
   .from('.bo .op-tag',{opacity:0,x:12,duration:.1},.54)
   .from('.bo .sub',{y:24,opacity:0,duration:.12},.24)
   .to({},{duration:.24});
/* 6 order: the call line, one line at a time */
T().from('.b6 .h2 .ln',{y:50,opacity:0,duration:.18,stagger:.1},0).to({},{duration:.4});
/* 5 booked: the missed call turns into a booking, then a review */
T().from('.b5 .h2',{y:40,opacity:0,duration:.12},0)
   .from('.b5 .ph',{y:50,opacity:0,duration:.14},.04)
   .from('.b5 .msd',{opacity:0,y:10,duration:.06},.12)
   .to('.b5 .t1',{opacity:1,y:0,duration:.07},.2)
   .to('.b5 .t2',{opacity:1,y:0,duration:.07},.3)
   .to('.b5 .t3',{opacity:1,scale:1,duration:.07,ease:'back.out(2)'},.4)
   .to('.b5 .t4',{opacity:1,y:0,duration:.07},.52)
   .to('.b5 .t5',{opacity:1,duration:.07},.6)
   .from('.b5 .sub',{y:24,opacity:0,duration:.12},.24)
   .from('.b5 .stat',{y:20,opacity:0,duration:.1},.62)
   .from('.b5 .src',{opacity:0,duration:.08},.68)
   .to({},{duration:.22});
/* 4 chosen: mixed details scatter, the gold line sweeps in one clear page */
var ms=$$('.b4 .ms');
T().from('.b4 .h2',{y:40,opacity:0,duration:.14},0)
   .from('.b4 .pg',{y:50,opacity:0,duration:.16},.04)
   .from(ms,{opacity:0,scale:.9,duration:.06,stagger:.025},.1)
   .to(ms,{x:function(i){return [-10,12,-8,10,-12][i];},y:function(i){return [6,-8,10,-6,8][i];},duration:.12,ease:'sine.inOut'},.22)
   .fromTo('.b4 .gl',{opacity:1,left:'0%'},{left:'100%',duration:.18,ease:'power2.inOut'},.36)
   .to(ms,{opacity:0,x:'+=40',duration:.1,stagger:.012},.38)
   .to('.b4 .pg-clean',{opacity:1,duration:.1},.46)
   .to('.b4 .gl',{opacity:0,duration:.04},.54)
   .fromTo('.b4 .sweep',{left:'-40%'},{left:'120%',duration:.24,ease:'none'},.5)
   .from('.b4 .sub',{y:24,opacity:0,duration:.12},.48)
   .to({},{duration:.22});
/* 3 found: the answer names the shop, the pin lands */
T().from('.b3 .h2',{y:40,opacity:0,duration:.14},0)
   .from('.b3 .ask',{y:50,opacity:0,duration:.16},.04)
   .from('.b3 .ask-q',{y:16,opacity:0,duration:.08},.12)
   .from('.b3 .ask-a .sk',{scaleX:0,transformOrigin:'left center',duration:.06,stagger:.03},.18)
   .to('.b3 .pick',{opacity:1,y:0,duration:.1},.3)
   .fromTo('.b3 .mp.you',{opacity:0,scale:2.4},{opacity:1,scale:1,duration:.1,ease:'back.out(2)'},.36)
   .to('.b3 .mp.you',{boxShadow:'0 0 0 18px rgba(243,220,154,0)',duration:.14,ease:'power1.out'},.44)
   .from('.b3 .sub',{y:24,opacity:0,duration:.12},.4)
   .to({},{duration:.25});
/* tease: the three offers, in order */
T().from('.bt .h2',{y:40,opacity:0,duration:.12},0)
   .from('.bt .of',{y:50,opacity:0,duration:.14,stagger:.09},.1)
   .from('.bt .of-n',{opacity:0,scale:.7,duration:.1,stagger:.09},.16)
   .to({},{duration:.3});
/* 7 ask: the gold line draws round the button */
var rect=$('.cta-r'),svg=$('.cta-svg'),btn=$('#cta'),rlen=1;
function sizeCta(){var w=btn.offsetWidth+14,h=btn.offsetHeight+14;svg.setAttribute('width',w);svg.setAttribute('height',h);svg.setAttribute('viewBox','0 0 '+w+' '+h);
 rect.setAttribute('x',.8);rect.setAttribute('y',.8);rect.setAttribute('width',w-1.6);rect.setAttribute('height',h-1.6);var rr=Math.min((h-1.6)/2,40);rect.setAttribute('rx',rr);rect.setAttribute('ry',rr);
 rlen=rect.getTotalLength?rect.getTotalLength():2*(w+h);rect.style.strokeDasharray=rlen;}
sizeCta();
T().from('.b7 .h2 .ln',{y:50,opacity:0,duration:.16,stagger:.06},0)
   .from('.b7 .sub',{opacity:0,y:20,duration:.12},.2)
   .fromTo(rect,{strokeDashoffset:function(){return rlen;}},{strokeDashoffset:0,duration:.32,ease:'power2.inOut'},.24)
   .from(btn,{opacity:0,scale:.96,duration:.14},.44)
   .from('.ftr',{opacity:0,duration:.14},.54).to({},{duration:.2});

/* ---------- layout + render ---------- */
var track=$('#track');
function layout(){vh=H.clientHeight;W_=.42*vh;var y=0;starts=[];ends=[];
  LEN.forEach(function(l){starts.push(y);y+=l*vh;ends.push(y);});total=y;track.style.height=(total+vh)+'px';}
function render(y){if(paused)return;var n=stages.length;
  for(var i=0;i<n;i++){
    var h2=W_/2,en=i===0?1:sm((y-starts[i])/h2),ex=i===n-1?1:1-sm((y-(ends[i]-h2))/h2);
    var o=Math.min(en,ex),s=en<1?.94+.06*en:(ex<1?1+.06*(1-ex):1),st=stages[i];
    if(o<=.001){if(st._v!==0){st.style.visibility='hidden';st.style.opacity=0;st._v=0;}continue;}
    st.style.visibility='visible';st.style.opacity=o;st.style.transform=s===1?'':'scale('+s+')';st._v=1;
    tls[i].progress(clamp((y-starts[i])/((ends[i]-starts[i])*.86)));
    if(o>.5)cur=i;}
}
function startLenis(){lenis=new Lenis({lerp:.1,smoothWheel:true,wheelMultiplier:1});
  lenis.on('scroll',function(e){render(e.scroll);hdr(e.direction,e.scroll);});}
var hd=$('#hdr');function hdr(dir,y){if(y<40||y>=total-vh*.2){hd.classList.remove('up');return;}if(dir===1)hd.classList.add('up');else if(dir===-1)hd.classList.remove('up');}
g.ticker.add(function(t){if(lenis)lenis.raf(t*1000);});g.ticker.lagSmoothing(0);
layout();startLenis();render(W.scrollY||0);lastW=W.innerWidth;
W.addEventListener('resize',function(){var w=W.innerWidth;if(w===lastW&&Math.abs(H.clientHeight-vh)<120)return;lastW=w;if(paused)return;layout();sizeCta();render(lenis?lenis.scroll:W.scrollY);});

/* in page jumps (skip link) */
function goBeat(i){if(paused){beats[i].scrollIntoView();return;}var y=i===0?0:starts[i]+.55*(ends[i]-starts[i]);if(i===beats.length-1)y=total;
  lenis.scrollTo(y,{duration:1.6,easing:function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}});}
$$('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var el=D.getElementById(a.getAttribute('href').slice(1));var i=beats.indexOf(el&&el.closest('.beat'));if(i<0)return;e.preventDefault();goBeat(i);setTimeout(function(){btn.focus({preventScroll:true});},1700);});});

/* ---------- Pause animations (WCAG 2.2.2): shows everything as plain screens ---------- */
var pb=$('#pause');
pb.addEventListener('click',function(){
  if(!paused){var at=Math.max(cur,0);paused=true;H.classList.add('static');pb.setAttribute('aria-pressed','true');pb.textContent='Play Animations';
    g.globalTimeline.pause();heroIn.progress(1);tls.forEach(function(t){t.progress(1);});
    lks.forEach(function(r){r.style.opacity='1';});$$('.b1 .lk-f').forEach(function(x){x.style.transform='scaleX(.38)';});$$('.b1 .lk-d').forEach(function(x){x.style.opacity='0';});
    if(lenis){lenis.destroy();lenis=null;}
    stages.forEach(function(s){s.style.cssText='';s._v=undefined;});hd.classList.remove('up');
    beats[at].scrollIntoView();cur=at;
  }else{var at2=0,y=W.scrollY;beats.forEach(function(b,i){if(b.offsetTop<=y+H.clientHeight/2)at2=i;});
    paused=false;H.classList.remove('static');pb.setAttribute('aria-pressed','false');pb.textContent='Pause Animations';
    stages.forEach(function(s){s._v=undefined;});g.globalTimeline.resume();layout();startLenis();var ty=at2===0?0:starts[at2]+.55*(ends[at2]-starts[at2]);
    W.scrollTo(0,ty);lenis.scrollTo(ty,{immediate:true});render(ty);}
});
W.__dd={render:render,starts:function(){return starts;},ends:function(){return ends;},total:function(){return total;}};
})();
