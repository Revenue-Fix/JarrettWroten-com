/* Jarrett Wroten site motion. Motion is part of the design and runs regardless of OS motion settings.
   The only control is the Pause / Play button (WCAG 2.2.2). */
(function(){
  var d=document, html=d.documentElement, paused=false;
  var hasG = typeof window.gsap!=="undefined";
  function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s));}
  function revealAll(){ $$("[data-reveal],[data-hero],[data-hero-w]").forEach(function(el){el.style.opacity=1;el.style.transform="none";}); }
  if(!hasG){ revealAll(); }

  /* split headings into words */
  $$("[data-split]").forEach(function(h){
    var words=h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label",h.textContent.trim());
    h.innerHTML=words.map(function(w){return '<span class="w" aria-hidden="true" style="overflow:hidden;display:inline-block;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em"><span class="wi" style="display:inline-block">'+w+'</span></span>';}).join(" ");
  });

  /* smooth scroll */
  var lenis=null;
  if(window.Lenis){
    lenis=new Lenis({lerp:0.1,wheelMultiplier:1,smoothWheel:true});
    if(hasG&&window.ScrollTrigger){ lenis.on("scroll",ScrollTrigger.update); gsap.ticker.add(function(t){lenis.raf(t*1000);}); gsap.ticker.lagSmoothing(0); }
    else { (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(0); }
    $$('a[href^="#"]').forEach(function(a){a.addEventListener("click",function(e){var id=a.getAttribute("href");if(id.length<2)return;var t=d.querySelector(id);if(!t)return;e.preventDefault();lenis.scrollTo(t,{offset:-10,duration:1.2});history.replaceState(null,"",id);});});
  }

  /* header */
  var hdr=d.getElementById("hdr");
  function onScroll(){ if(hdr) hdr.classList.toggle("is-solid", window.scrollY>24); }
  window.addEventListener("scroll",onScroll,{passive:true}); onScroll();

  /* menu */
  var mb=d.getElementById("menuBtn"), menu=d.getElementById("menu");
  if(mb&&menu){
    function setMenu(open){ mb.setAttribute("aria-expanded",open?"true":"false"); mb.textContent=open?"Close":"Menu"; menu.hidden=!open; if(lenis){open?lenis.stop():lenis.start();} d.body.style.overflow=open?"hidden":""; }
    mb.addEventListener("click",function(){setMenu(mb.getAttribute("aria-expanded")!=="true");});
    $$("a",menu).forEach(function(a){a.addEventListener("click",function(){setMenu(false);});});
    d.addEventListener("keydown",function(e){if(e.key==="Escape"&&!menu.hidden){setMenu(false);mb.focus();}});
  }

  /* looping concept films: play in view, pause out of view */
  var loops=$$("video[data-loop]");
  var vis=new Map();
  function tryPlay(v){ if(paused) return; var p=v.play(); if(p&&p.catch)p.catch(function(){}); }
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){vis.set(en.target,en.isIntersecting); if(en.isIntersecting){ if(en.target.preload==="none"){en.target.preload="auto";} tryPlay(en.target);} else en.target.pause();});},{rootMargin:"200px 0px"});
    loops.forEach(function(v){v.muted=true;io.observe(v);});
  } else loops.forEach(function(v){v.muted=true;tryPlay(v);});

  /* motion toggle */
  var mt=d.getElementById("motionBtn");
  function setPaused(p){
    paused=p; html.classList.toggle("is-paused",p);
    if(mt){ mt.setAttribute("aria-pressed",p?"true":"false"); mt.setAttribute("aria-label",p?"Play motion":"Pause motion"); mt.querySelector(".motion__txt").textContent=p?"Play":"Pause"; }
    if(hasG){ p?gsap.globalTimeline.pause():gsap.globalTimeline.resume(); }
    loops.forEach(function(v){ if(p) v.pause(); else if(vis.get(v)) tryPlay(v); });
  }
  if(mt) mt.addEventListener("click",function(){setPaused(!paused);});

  if(hasG){
    if(window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    var E="expo.out";
    /* hero entrance */
    var tl=gsap.timeline({delay:.15});
    tl.to("[data-hero-w]",{opacity:1,y:0,duration:1.25,ease:E,stagger:.09})
      .to("[data-hero]",{opacity:1,y:0,duration:1.1,ease:E,stagger:.1},"-=0.95");
    var cards=$$(".stage__card");
    if(cards.length){
      tl.from(cards,{opacity:0,y:120,rotate:function(i){return [-12,10,-8][i]||0;},duration:1.6,ease:E,stagger:.12},0.2);
      cards.forEach(function(c,i){ gsap.to(c,{y:"+="+(14+i*6),x:"+="+(i%2?-10:10),rotation:"+="+(i%2?-1.4:1.2),duration:4.5+i*1.1,ease:"sine.inOut",yoyo:true,repeat:-1,delay:1.6+i*.3}); });
      var stage=d.getElementById("stage");
      if(window.matchMedia("(pointer:fine)").matches&&stage){
        var qx=gsap.quickTo(stage,"x",{duration:1.2,ease:"power3"}), qy=gsap.quickTo(stage,"yPercent",{duration:1.2,ease:"power3"});
        window.addEventListener("pointermove",function(e){ qx((e.clientX/innerWidth-.5)*-26); qy(-46+(e.clientY/innerHeight-.5)*-3); });
      }
      if(window.ScrollTrigger&&stage) gsap.to(stage,{y:-140,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
    }
    if(window.ScrollTrigger){
      /* headings */
      $$("[data-split]").forEach(function(h){
        gsap.from($$(".wi",h),{yPercent:110,duration:1.1,ease:E,stagger:.06,scrollTrigger:{trigger:h,start:"top 86%"}});
      });
      ScrollTrigger.batch("[data-reveal]",{start:"top 90%",onEnter:function(b){gsap.to(b,{opacity:1,y:0,duration:1.1,ease:E,stagger:.12,overwrite:true});}});
      /* path line draw */
      var pl=d.getElementById("pathLine");
      if(pl){ var L=pl.getTotalLength(); pl.style.strokeDasharray=L; pl.style.strokeDashoffset=L;
        gsap.to(pl,{strokeDashoffset:0,ease:"none",scrollTrigger:{trigger:"#path",start:"top 80%",end:"bottom 55%",scrub:.6}}); }
      /* count up */
      $$("[data-count]").forEach(function(el){ var to=parseFloat(el.getAttribute("data-count")), o={v:0};
        ScrollTrigger.create({trigger:el,start:"top 85%",once:true,onEnter:function(){ gsap.to(o,{v:to,duration:2.2,ease:"power3.out",onUpdate:function(){el.textContent="$"+o.v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}}); }}); });
      /* portrait parallax */
      var ph=d.querySelector(".how__photo img");
      if(ph) gsap.fromTo(ph,{yPercent:-6},{yPercent:6,ease:"none",scrollTrigger:{trigger:ph,start:"top bottom",end:"bottom top",scrub:true}});
      /* card media drift */
      $$(".card__frame .media").forEach(function(m){ gsap.fromTo(m,{yPercent:3},{yPercent:-3,ease:"none",scrollTrigger:{trigger:m,start:"top bottom",end:"bottom top",scrub:true}}); });
      var wv=d.querySelector(".walk__v");
      if(wv) gsap.fromTo(wv,{scale:1.18},{scale:1,ease:"none",scrollTrigger:{trigger:".walk",start:"top bottom",end:"bottom bottom",scrub:true}});
    }
    /* magnetic buttons */
    if(window.matchMedia("(pointer:fine)").matches){
      $$(".magnetic").forEach(function(b){
        var x=gsap.quickTo(b,"x",{duration:.6,ease:"power3"}), y=gsap.quickTo(b,"y",{duration:.6,ease:"power3"});
        b.addEventListener("pointermove",function(e){var r=b.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.25);y((e.clientY-r.top-r.height/2)*.35);});
        b.addEventListener("pointerleave",function(){x(0);y(0);});
      });
    }
    setTimeout(function(){ $$("[data-hero],[data-hero-w]").forEach(function(el){ if(getComputedStyle(el).opacity==="0"&&!paused){el.style.opacity=1;el.style.transform="none";} }); },4000);
  }

  /* walkthrough (opt-in) */
  var wo=d.getElementById("walkOpen"), dlg=d.getElementById("walkDialog");
  if(wo&&dlg&&dlg.showModal){
    var v=d.getElementById("walkVideo"), sc=d.getElementById("walkScrub"), end=d.getElementById("walkEnd"), cl=d.getElementById("walkClose"), rp=d.getElementById("walkReplay");
    function start(){ end.hidden=true; v.currentTime=0; var p=v.play(); if(p&&p.catch)p.catch(function(){}); }
    wo.addEventListener("click",function(){ dlg.showModal(); if(lenis)lenis.stop(); v.preload="auto"; start(); cl.focus(); });
    function closeIt(){ v.pause(); if(dlg.open) dlg.close(); }
    cl.addEventListener("click",closeIt);
    dlg.addEventListener("close",function(){ v.pause(); if(lenis)lenis.start(); wo.focus(); });
    rp.addEventListener("click",start);
    v.addEventListener("timeupdate",function(){ if(v.duration) sc.value=Math.round(v.currentTime/v.duration*1000); });
    v.addEventListener("ended",function(){ end.hidden=false; });
    sc.addEventListener("input",function(){ if(v.duration){ v.pause(); v.currentTime=sc.value/1000*v.duration; end.hidden=true; } });
    sc.addEventListener("change",function(){ if(v.currentTime<v.duration-0.05){ var p=v.play(); if(p&&p.catch)p.catch(function(){}); } });
  } else if(wo&&dlg){ wo.addEventListener("click",function(){ window.location.href="/assets/golden-arrival/golden-arrival-approved.mp4"; }); }
})();
