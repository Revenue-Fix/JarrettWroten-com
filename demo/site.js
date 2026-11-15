/* Booked, Chosen, Found demo. Motion always on (no reduced motion branch); one Pause control. */
(function(){
var D=document,H=D.documentElement,W=window;
if(!W.gsap||!W.Lenis){return;} /* no libs: the page stays in plain readable flow */
H.classList.add('js');
var g=W.gsap,E='expo.out';
var beats=[].slice.call(D.querySelectorAll('.beat'));
var stages=beats.map(function(b){return b.querySelector('.stage');});
var LEN=[0.3,1.5,1.9,1.8,1.6,1.6,1.9,1.5,1.1,1.7,1.7,3.2,1.2,2.4,3.6,1.5,1.2]; /* scroll per beat, in screens */
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
lks.forEach(function(r,i){var f=$('.lk-f',r),d=$('.lk-d',r),seg=g.timeline();
  seg.to(r,{opacity:1,borderColor:'rgba(212,174,90,.55)',duration:.3,ease:E},0)
     .fromTo(f,{scaleX:1},{scaleX:.38,duration:1.05,ease:'power2.inOut'},.1)
     .fromTo(d,{opacity:0,y:-4},{opacity:1,y:22,duration:.45,ease:'power2.in',repeat:1,repeatDelay:.05},.2)
     .to(d,{opacity:0,duration:.15},'>')
     .to(r,{opacity:.72,borderColor:'rgba(238,232,221,.08)',duration:.5,ease:E},1.35)
     .to(f,{scaleX:1,duration:.5,ease:E},'<');
  heroTl.add(seg,i*1.3);});
heroTl.to({},{duration:.4});
var heroIn=g.timeline({delay:.05});
heroIn.from('.h1 .w',{yPercent:110,duration:.9,ease:E,stagger:.08})
      .from('.srch',{y:16,opacity:0,duration:.45,ease:E},0)
      .from('.cue',{opacity:0,duration:1,ease:E},.9);

/* ---------- per beat scroll timelines (normalized) ---------- */
var tls=[];
function T(){var t=g.timeline({paused:true,defaults:{ease:'power2.out'}});tls.push(t);return t;}
/* 1 hook drifts on the way out */
var phn=matchMedia('(max-width:760px)').matches;/* r34a16: on phones the headline drifts down, away from the floating header */
T().to('.b1 .hook-copy',{y:phn?10:-30,duration:1},0).to('.b1 .srch',{y:phn?-6:-16,duration:1},0);
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
   .from('.bs .sl p',{y:14,opacity:0,duration:.08,stagger:.04},.1)
   .from('.bs .sc',{y:50,opacity:0,duration:.14,stagger:.07},.2);
cns.forEach(function(c,i){var to=+c.getAttribute('data-to'),o={v:0};tls[tls.length-1].to(o,{v:to,duration:.26,ease:'power1.out',onUpdate:function(){c.textContent=Math.round(o.v);}},.24+i*.07);});
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
var ors=$$('.b6 .or');function ost(){return ors.length>2?ors[1].offsetTop-ors[0].offsetTop:0;}
function M(){return Math.min(40,Math.max(18,(ors[0]?ors[0].offsetWidth:300)*.07));}
T().to({},{duration:1});
/* one swap: the row moving up arcs left over the top, the row moving down arcs right underneath */
function sw(up,uy,dn,dy){var t=g.timeline();
  t.set(up,{zIndex:2}).set(dn,{zIndex:1})
   .to(up,{y:uy,duration:.7,ease:'power2.inOut'},0).to(up,{x:function(){return -M();},scale:1.04,duration:.35,ease:'power1.out'},0).to(up,{x:0,scale:1,duration:.35,ease:'power1.in'},.35)
   .to(dn,{y:dy,duration:.7,ease:'power2.inOut'},0).to(dn,{x:function(){return M();},opacity:.6,duration:.35,ease:'power1.out'},0).to(dn,{x:0,opacity:1,duration:.35,ease:'power1.in'},.35);
  return t;}
var fx=[];function FX(i,t){fx.push({i:i,t:t,on:false});return t;}
FX(5,g.timeline({paused:true,defaults:{ease:'power2.out'}}))
   .fromTo('.b6 .h2 .ln:nth-child(1)',{y:50,opacity:0},{y:0,opacity:1,duration:.6},0)
   .fromTo('.b6 .h2 .ln:nth-child(2)',{y:50,opacity:0},{y:0,opacity:1,duration:.6},.25)
   .fromTo('.b6 .h2 .ln:nth-child(3)',{y:50,opacity:0},{y:0,opacity:0,duration:.01},0)
   .fromTo('.b6 .ov',{opacity:0,x:30,y:function(){return -2*ost();}},{opacity:1,x:0,y:function(){return -2*ost();},duration:.5},.2)
   .fromTo('.b6 .oq',{opacity:0,x:30},{opacity:1,x:0,duration:.5},.35)
   .fromTo('.b6 .os',{opacity:0,x:30,y:function(){return 2*ost();},'--lit':0,'--pulse':0},{opacity:1,x:0,y:function(){return 2*ost();},'--lit':0,'--pulse':0,duration:.5},.5)
   /* hold the agency order, then one move at a time: Speed climbs two places, then Quality and Volume settle */
   .add(sw('.b6 .os',function(){return ost();},'.b6 .oq',function(){return ost();}),1.3)
   .add(sw('.b6 .os',0,'.b6 .ov',function(){return -ost();}),2.3)
   .to('.b6 .h2 .ln:nth-child(3)',{y:0,opacity:1,duration:.6},2.75)
   .add(sw('.b6 .oq',0,'.b6 .ov',0),3.3)
   /* selected: border lights, glow pulses once and settles, line fills */
   .to('.b6 .os',{'--lit':1,duration:.6,ease:'power2.out'},4.1)
   .to('.b6 .os',{'--pulse':1,duration:.35,ease:'power2.out'},4.15)
   .to('.b6 .os',{'--pulse':0,duration:.7,ease:'power2.inOut'},4.5);
T().from('.bv .h2 .ln',{y:50,opacity:0,duration:.16,stagger:.08},0)
   .from('.bv .sub',{y:24,opacity:0,duration:.12},.16)
   .from('.bv .lw',{y:16,opacity:0,duration:.08,stagger:.1},.3)
   .from('.bv .chev path',{strokeDashoffset:24,duration:.08,stagger:.1},.36)
   .from('.bv .lad .on',{'--bar':0,duration:.16},.5)
   .from('.bv .stat',{y:20,opacity:0,duration:.1},.6)
   .from('.bv .src',{opacity:0,duration:.08},.68).to({},{duration:.2});
(function(t){var fl=$('.bv .lf .fl'),mx=$$('.bv .lf .mx i'),at=.5,n=1;
  t.fromTo('.bv .lane',{opacity:0,y:20},{opacity:1,y:0,duration:.5,stagger:.12},0)
   .fromTo('.bv .ls .fl',{scaleX:0},{scaleX:.82,duration:7,ease:'none'},.3);
  for(var k=0;k<5;k++){var set=mx.slice(n===1?0:n/2,n);
    t.fromTo(fl,{scaleX:0},{scaleX:1,duration:.6,ease:'power1.in',immediateRender:k===0},at)
     .fromTo(set,{scale:0,opacity:0,'--glow':1},{scale:1,opacity:1,'--glow':1,duration:.4,stagger:.015,ease:'back.out(2.2)',immediateRender:true},at+.6)
     .to(set,{'--glow':0,duration:.6,ease:'power2.out'},at+.95);
    at+=1.2;n*=2;}
})(FX(6,g.timeline({paused:true,defaults:{ease:'power2.out'}})));

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
   .to({},{duration:.22});
/* after speed, quality: the order moves to its second word */
T().from('.bw .h2 .ln',{y:50,opacity:0,duration:.16,stagger:.08},0)
   .from('.bw .lw',{y:16,opacity:0,duration:.08,stagger:.08},.3)
   .from('.bw .chev path',{strokeDashoffset:24,duration:.08,stagger:.08},.36)
   .from('.bw .lad .on',{'--bar':0,duration:.18},.52).to({},{duration:.25});
/* quality is efficiency: the line, then the three ways, then the close */
T().from('.bq .h2',{y:40,opacity:0,duration:.12},0).from('.bq .sub',{y:24,opacity:0,duration:.12},.1)
   .from('.bq .q3l',{opacity:0,y:14,duration:.1},.24).from('.bq .q3 li',{x:-30,opacity:0,duration:.1,stagger:.08},.32)
   .from('.bq .q3c',{opacity:0,y:16,duration:.12},.6).from('.bq .q3a',{opacity:0,duration:.1},.68).to({},{duration:.2});
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
   .from('.b4 .sub',{y:24,opacity:0,duration:.12},.12)
   .from('.b4 .stk li',{x:-24,opacity:0,duration:.1,stagger:.06},.2)
   .from('.b4 .pcs-r',{y:16,opacity:0,duration:.12},.56)
   .to({},{duration:.22});
/* stepper: the active piece opens, its sample visual plays; scroll moves it on */
function stepper(sel){var r=$(sel),it=$$('.sp-i',r),sc=$$('.sp-s',r),o={v:0},c=-1;
  function set(k){if(k===c)return;c=k;it.forEach(function(e,i){e.classList.toggle('on',i===k);});sc.forEach(function(e,i){e.classList.toggle('on',i===k);});}
  return {o:o,upd:function(){set(Math.max(0,Math.min(it.length-1,Math.floor(o.v))));}};}
var spc=stepper('.bsc');
T().from('.bsc .sp-l',{opacity:0,duration:.06},0).from('.bsc .sp-i',{x:-24,duration:.06,stagger:.025},0)
   .from('.bsc .sp-v',{y:40,opacity:0,duration:.08},.03)
   .fromTo(spc.o,{v:0},{v:3.999,duration:.82,ease:'none',onUpdate:spc.upd},.12).to({},{duration:.06});
/* finish with volume: the red word, the order reaches its last step */
T().from('.bf .h2 .ln',{y:50,opacity:0,duration:.16,stagger:.08},0)
   .from('.bf .fsub',{y:24,opacity:0,duration:.12},.18)
   .from('.bf .lw',{y:16,opacity:0,duration:.08,stagger:.08},.3)
   .from('.bf .chev path',{strokeDashoffset:24,duration:.08,stagger:.08},.36)
   .from('.bf .lad .on',{'--bar':0,duration:.18},.52).to({},{duration:.25});
/* volume is scale: gold dots pile up, then turn to dirt */
var dirt=(function(){var gd=$('.bk2 .gd'),cs=$$('.bk2 .gd i'),cv=D.createElement('canvas'),x=cv.getContext('2d'),o={p:0},W0=0,H0=0,pos=[],P=[],N=12,last=-1;
  cv.className='dirt';cv.setAttribute('aria-hidden','true');gd.appendChild(cv);
  function rnd(s){return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}
  var ord=cs.map(function(_,i){return i;}),R=rnd(7);for(var i=ord.length-1;i>0;i--){var k=Math.floor(R()*(i+1)),t=ord[i];ord[i]=ord[k];ord[k]=t;}
  var st=[];ord.forEach(function(ci,r){st[ci]=r/cs.length*.62;});
  function size(){var w=gd.clientWidth,h=gd.clientHeight;if(w===W0&&h===H0&&pos.length)return;W0=w;H0=h;var d=Math.min(2,W.devicePixelRatio||1);cv.width=w*d;cv.height=h*d;x.setTransform(d,0,0,d,0,0);
    var g0=gd.getBoundingClientRect();pos=cs.map(function(c){var b=c.getBoundingClientRect();return [b.left-g0.left+b.width/2,b.top-g0.top+b.height/2,b.width/2];});
    P=[];cs.forEach(function(c,ci){var R2=rnd(ci+11),p=pos[ci];for(var n=0;n<N;n++){var a=R2()*6.283,rr=R2()*p[2]*.8;P.push({c:ci,x:p[0]+Math.cos(a)*rr,y:p[1]+Math.sin(a)*rr,vx:(R2()-.5)*40,s:1.5+R2()*2.6,l:R2(),tx:0,col:R2()});}});
    P.forEach(function(q,i){q.tx=Math.max(4,Math.min(W0-4,W0/2+(q.x-W0/2)*.75+(q.l-.5)*30));});}
  function gy(){return H0-10;}
  function mound(xx,f){var c=W0/2,s=W0*.36,u=(xx-c)/s;return Math.max(0,f*(H0*.13)*Math.exp(-u*u*1.6));}
  function draw(){size();var p=o.p;if(Math.abs(p-last)<.0005)return;last=p;x.clearRect(0,0,W0,H0);var G=gy(),landed=0,tot=P.length;
    var lf=[];cs.forEach(function(c,ci){var u=Math.max(0,Math.min(1,(p-st[ci])/.38));lf[ci]=u;
      c.style.setProperty('--dirt',Math.min(1,u/.3).toFixed(3));c.style.boxShadow=u>0?'none':'';c.style.visibility=u>=.42?'hidden':'';});
    P.forEach(function(q){var u=lf[q.c];if(u>=.42+(.58*.85)*(.3+.7*q.l)*.9)landed++;});
    var f=landed/tot;
    /* ground line and mound */
    x.strokeStyle='rgba(238,232,221,.18)';x.lineWidth=1;x.beginPath();x.moveTo(0,G+.5);x.lineTo(W0,G+.5);x.stroke();
    if(f>0){x.beginPath();x.moveTo(0,G);for(var xx=0;xx<=W0;xx+=4)x.lineTo(xx,G-mound(xx,f));x.lineTo(W0,G);x.closePath();
      var gr=x.createLinearGradient(0,G-H0*.13,0,G);gr.addColorStop(0,'#5a4632');gr.addColorStop(1,'#2a2017');x.fillStyle=gr;x.fill();}
    /* cracks, then falling grains */
    cs.forEach(function(c,ci){var u=lf[ci],pp=pos[ci];if(u>.24&&u<.42){var R3=rnd(ci+5),k=(u-.24)/.18;x.strokeStyle='rgba(20,14,8,.9)';x.lineWidth=1.4;
      for(var m=0;m<3;m++){var a=R3()*6.283;x.beginPath();x.moveTo(pp[0],pp[1]);x.lineTo(pp[0]+Math.cos(a)*pp[2]*k,pp[1]+Math.sin(a)*pp[2]*k);x.stroke();}}});
    P.forEach(function(q){var u=lf[q.c];if(u<.42)return;var d0=.3+.7*q.l,t=Math.min(1,(u-.42)/(.58*.85)/d0*1.1);
      var ty=G-mound(q.tx,f)-q.s/2,yy=q.y+(ty-q.y)*t*t,xx=q.x+(q.tx-q.x)*t+q.vx*Math.sin(t*3.14)*.3;
      x.fillStyle=q.col<.5?'#6b5442':(q.col<.8?'#4a3a2b':'#8a6a4a');x.globalAlpha=t>=1?.0:1;x.fillRect(xx-q.s/2,yy-q.s/2,q.s,q.s);x.globalAlpha=1;});
  }
  W.addEventListener('resize',function(){W0=0;last=-1;});
  return {o:o,draw:draw};})();
T().from('.bk2 .h2',{y:40,opacity:0,duration:.12},0).from('.bk2 .sub',{y:24,opacity:0,duration:.12},.08)
   .from('.bk2 .gd i',{scale:0,opacity:0,duration:.1,stagger:{each:.012,from:'random'}},.08)
   .from('.bk2 .vl li',{y:16,opacity:0,duration:.1,stagger:.1},.24)
   .fromTo(dirt.o,{p:0},{p:1,duration:.5,ease:'none',onUpdate:dirt.draw},.36)
   .from('.bk2 .q3c',{opacity:0,y:16,duration:.12},.8).to({},{duration:.14});
/* get found: the same stepper as get chosen */
var spf=stepper('.bsf');
T().from('.bsf .h2',{y:40,opacity:0,duration:.06},0).from('.bsf .sub',{y:20,opacity:0,duration:.06},.03)
   .from('.bsf .sp-l',{opacity:0,duration:.05},.06).from('.bsf .sp-i',{x:-24,duration:.05,stagger:.02},.06)
   .from('.bsf .sp-v',{y:40,opacity:0,duration:.07},.06)
   .fromTo(spf.o,{v:0},{v:3.999,duration:.74,ease:'none',onUpdate:spf.upd},.16)
   .from('.bsf .pcs-r',{y:16,opacity:0,duration:.06},.84).to({},{duration:.06});
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
   .from('.cta-note',{opacity:0,y:10,duration:.12},.5).from('.ftr',{opacity:0,duration:.14},.54).to({},{duration:.2});

/* ---------- layout + render ---------- */
var track=$('#track');
function layout(){vh=H.clientHeight;W_=.42*vh;var y=0;starts=[];ends=[];
  LEN.forEach(function(l){starts.push(y);y+=l*vh;ends.push(y);});total=y;track.style.height=(total+vh)+'px';}
function render(y){if(paused)return;var n=stages.length;
  for(var i=0;i<n;i++){
    var h2=W_/2,en=i===0?1:sm((y-starts[i])/h2),ex=i===n-1?1:1-sm((y-(ends[i]-h2))/h2);
    var o=Math.min(en,ex),s=en<1?.94+.06*en:(ex<1?1+.06*(1-ex):1),st=stages[i];
    if(o<=.001){if(st._v!==0){st.style.visibility='hidden';st.style.opacity=0;st._v=0;}fx.forEach(function(f){if(f.i===i&&f.on){f.on=false;f.t.pause(0);}});continue;}
    st.style.visibility='visible';st.style.opacity=o;st.style.transform=s===1?'':'scale('+s+')';st._v=1;
    tls[i].progress(clamp((y-starts[i])/((ends[i]-starts[i])*.86)));
    if(o>.5){cur=i;fx.forEach(function(f){if(f.i===i&&!f.on){f.on=true;f.t.restart();}});}}
}
function startLenis(){lenis=new Lenis({lerp:.1,smoothWheel:true,wheelMultiplier:1});
  lenis.on('scroll',function(e){render(e.scroll);hdr(e.direction,e.scroll);});}
var hd=$('#hdr');function hdr(){hd.classList.remove('up');}
/* r34a16: publish the header's real rendered height so stages clear it (the button can change height with fonts and width) */
(function(){function setH(){H.style.setProperty('--hdrH',Math.ceil(hd.getBoundingClientRect().height)+'px');}setH();addEventListener('resize',setH,{passive:true});addEventListener('load',setH);document.fonts&&document.fonts.ready.then(setH);if('ResizeObserver' in window)new ResizeObserver(setH).observe(hd);})();
/* r34a16: on short phone screens each beat's content scales down just enough to sit between the header and the Pause button (never below 0.72); the booking button itself never scales */
(function(){var mq=matchMedia('(max-width:760px)'),ss=[].slice.call(document.querySelectorAll('.stage'));
function nat(st){var top=1e9,bot=-1e9;[].forEach.call(st.children,function(c){var cs=getComputedStyle(c);if(cs.position==='absolute'||cs.position==='fixed'||cs.display==='none')return;var t=c.offsetTop,b=t+Math.max(c.offsetHeight,c.scrollHeight);if(t<top)top=t;if(b>bot)bot=b;});return bot>top?bot-top:0;}
function fit(){ss.forEach(function(st){st.style.removeProperty('--fz');});if(!mq.matches)return;
 ss.forEach(function(st){var cs=getComputedStyle(st),av=(H.classList.contains('static')?innerHeight:st.clientHeight)-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),n=nat(st);
  var fx=0;[].forEach.call(st.querySelectorAll(':scope > .cta-wrap'),function(c){fx+=c.offsetHeight;});if(n>av&&av>fx){st.style.setProperty('--fz',Math.max(.72,Math.floor((av-fx)/(n-fx)*98)/100));}});}
window.__fit=fit;var tm;function q(){clearTimeout(tm);tm=setTimeout(fit,60);}
fit();addEventListener('resize',q,{passive:true});addEventListener('load',fit);document.fonts&&document.fonts.ready.then(fit);if('ResizeObserver' in window)new ResizeObserver(q).observe(hd);
var pb=document.getElementById('pause');pb&&pb.addEventListener('click',function(){setTimeout(fit,30)});})();/* r34a11: header and its booking button float, always visible */
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
    g.globalTimeline.pause();heroIn.progress(1);tls.forEach(function(t){t.progress(1);});fx.forEach(function(f){f.on=true;f.t.progress(1).pause();});
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
