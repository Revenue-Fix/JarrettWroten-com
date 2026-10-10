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
    h.innerHTML=words.map(function(w){return '<span class="w" aria-hidden="true" style="overflow:hidden;display:inline-block;vertical-align:top;padding:.1em 0 .14em;margin:-.1em 0 -.14em"><span class="wi" style="display:inline-block">'+w+'</span></span>';}).join(" ");
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

  /* lower films: paint their poster as a backdrop well before they enter view, so no black band shows while the film loads */
  var bgs=$$(".walk__bg");
  if(bgs.length){ if("IntersectionObserver" in window){ var bio=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("has-poster"); bio.unobserve(en.target);} });},{rootMargin:"1600px 0px"}); bgs.forEach(function(b){bio.observe(b);}); } else bgs.forEach(function(b){b.classList.add("has-poster");}); }

  /* motion toggle */
  var mt=d.getElementById("motionBtn");
  function setPaused(p){
    paused=p; html.classList.toggle("is-paused",p);
    if(mt){ mt.setAttribute("aria-pressed",p?"true":"false"); mt.setAttribute("aria-label",p?"Play Motion":"Pause Motion"); mt.querySelector(".motion__txt").textContent=p?"Play":"Pause"; }
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
    /* floating concept cards (kept from live): placed around the measured hero text so they never overlap it (desktop);
       phone uses the CSS fanned row under the buttons. Entrance + float are the live values. */
    var hc=$$(".hcard"), head=d.querySelector(".hero__head");
    if(hc.length===3&&head){
      var offIn=function(el){ var x=0,y=0,e=el; while(e&&e!==head){ x+=e.offsetLeft; y+=e.offsetTop; e=e.offsetParent; } return {x:x,y:y,w:el.offsetWidth,h:el.offsetHeight}; };
      var textW=function(el){ var r=d.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
      var cardH=function(w){ return 28+w*0.625; };
      var place=function(){
        head.style.paddingBottom="";
        if(window.innerWidth<=900){ hc.forEach(function(c){ c.style.left=c.style.top=c.style.width=""; c.classList.add("is-placed"); }); return; }
        var cs=getComputedStyle(head), padL=parseFloat(cs.paddingLeft), R=head.clientWidth-parseFloat(cs.paddingRight);
        var G=Math.max(24,Math.min(40,window.innerWidth*0.025));
        var kick=d.querySelector(".hero__kicker"), words=$$(".hero__l1 .w"), l1=d.querySelector(".hero__l1"), l2=d.querySelector(".hero__l2"), sub=d.querySelector(".hero__sub"), ctas=d.querySelector(".hero__ctas");
        var k=offIn(kick), kRight=k.x+textW(kick), lw=words[words.length-1], t=offIn(l1), lo=offIn(lw), tRight=lo.x+lw.offsetWidth;
        var hdr=d.getElementById("hdr"), hdrH=hdr?hdr.offsetHeight:72, headTop=head.getBoundingClientRect().top+window.scrollY;
        /* B: right of the period after Quietly. */
        var bL=tRight+G, bW=Math.min(R-bL, 360), bH=cardH(bW), bT=t.y+t.h/2-bH/2;
        /* A: above/right of the eyebrow, in the band between the header and the headline */
        var bandTop=hdrH+16-headTop, bandBot=t.y-30-parseFloat(getComputedStyle(l1).fontSize)*0.15, aH=Math.max(90,bandBot-bandTop), aW=Math.min(300,(aH-28)/0.625);
        var aR=Math.min(tRight-40, bL-G), aL=Math.max(kRight+G, aR-aW); aW=aR-aL; aH=cardH(aW); var aT=bandBot-aH;
        /* C: right of the body copy under the subhead */
        var l2o=offIn(l2), so=offIn(sub), co=offIn(ctas), sRight=so.x+Math.min(sub.offsetWidth,textW(sub)), cRight=co.x;
        $$("a",ctas).forEach(function(a){ cRight=Math.max(cRight,co.x+a.offsetLeft+a.offsetWidth); });
        var l2Right=l2o.x+textW(l2);
        var cL=Math.max(sRight,cRight)+G*1.6, cW=Math.min(R-cL,380), cTop=Math.max(l2o.y+l2o.h+14, bT+bH+G);
        if(cL<l2Right+G) cTop=Math.max(cTop,l2o.y+l2o.h+14);
        var cH=cardH(cW);
        [[aL,aT,aW],[bL,bT,bW],[cL,cTop,cW]].forEach(function(v,i){ var c=hc[i]; if(v[2]<120){ c.style.display="none"; return; } c.style.display=""; c.style.left=v[0].toFixed(1)+"px"; c.style.top=v[1].toFixed(1)+"px"; c.style.width=v[2].toFixed(1)+"px"; c.classList.add("is-placed"); });
        var textBottom=co.y+co.h, need=cTop+cH+G-textBottom;
        if(need>0) head.style.paddingBottom=need.toFixed(0)+"px";
        if(window.ScrollTrigger) ScrollTrigger.refresh();
      };
      place();
      if(d.fonts&&d.fonts.ready) d.fonts.ready.then(place);
      var rT=0; window.addEventListener("resize",function(){ clearTimeout(rT); rT=setTimeout(place,120); });
      var rot=[-3,2.5,-1.5];
      if(window.innerWidth>900) hc.forEach(function(c,i){ gsap.set(c,{rotation:rot[i]}); });
      if(window.innerWidth>900){
        tl.from(hc,{opacity:0,y:120,duration:1.6,ease:E,stagger:.12},0.2);
        hc.forEach(function(c,i){ gsap.fromTo(c,{y:-(6+i*2)},{y:(6+i*2),x:(i%2?-8:8),rotation:"+="+(i%2?-1.2:1),duration:4.5+i*1.1,ease:"sine.inOut",yoyo:true,repeat:-1,delay:1.6+i*.3,immediateRender:false}); });
      }
    }
    /* film hero: the plate opens from an inset rounded frame to full bleed as the hero scrolls away (scrubbed, ease none) */
    var pf=d.getElementById("plateFrame"), hh=d.querySelector(".hero__head");
    if(pf&&hh&&window.ScrollTrigger){
      var st={p:0};
      var apply=function(){ var px=parseFloat(getComputedStyle(hh).paddingLeft)||0, r=(window.innerWidth<=900?14:18), k=1-st.p;
        pf.style.clipPath="inset(0 "+(px*k).toFixed(1)+"px 0 "+(px*k).toFixed(1)+"px round "+(r*k).toFixed(1)+"px)"; };
      var hdrH=function(){ var h=d.getElementById("hdr"); return h?h.offsetHeight:72; };
      var top0=function(){ return pf.getBoundingClientRect().top+window.scrollY; };
      apply();
      gsap.to(st,{p:1,ease:"none",onUpdate:apply,scrollTrigger:{trigger:pf,start:function(){return 0;},end:function(){return Math.max(1,top0()-hdrH());},scrub:true,invalidateOnRefresh:true,onRefresh:apply}});
      window.addEventListener("resize",apply);
    }
    if(window.ScrollTrigger){
      /* headings */
      $$("[data-split]").forEach(function(h){
        gsap.from($$(".wi",h),{yPercent:110,duration:1.1,ease:E,stagger:.06,clearProps:"transform",scrollTrigger:{trigger:h,start:"top 86%"}});
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
      var wv=d.querySelector(".walk__bg");
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


  /* land deep links (e.g. /portfolio/#c-rana) after fonts and layout settle */
  if(location.hash.length>1){
    var tgt=d.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(tgt){
      var userMoved=false;
      ["wheel","touchstart","keydown"].forEach(function(ev){ window.addEventListener(ev,function(){userMoved=true;},{passive:true,once:true}); });
      var land=function(){
        if(userMoved) return;
        var shift=0, el=tgt;
        while(el&&el!==d.body){ var t=getComputedStyle(el).transform; if(t&&t!=="none"){ var m=t.match(/matrix(3d)?\(([^)]+)\)/); if(m){ var v=m[2].split(",").map(parseFloat); shift+= m[1]? v[13] : v[5]; } } el=el.parentElement; }
        var y=Math.max(0,tgt.getBoundingClientRect().top-shift+window.scrollY-(window.innerWidth<=900?84:96));
        if(lenis) lenis.scrollTo(y,{immediate:true,force:true}); else window.scrollTo(0,y);
      };
      window.addEventListener("load",function(){ (d.fonts&&d.fonts.ready?d.fonts.ready:Promise.resolve()).then(function(){ [120,600,1300,2200].forEach(function(ms,i){ setTimeout(function(){ if(i===1&&window.ScrollTrigger) ScrollTrigger.refresh(); land(); },ms); }); }); });
    }
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

  /* film hero caption follows the montage (6 cuts x 2.2s from the concept loops; raw, no filters) */
  var pv=d.getElementById("plateVideo");
  if(pv){
    var segs=[["Wrapstar","Wraps, Ceramic Coating And Tint","https://wrapstar.jarrettwroten.com/"],["Stirling Club","Wedding And Event Venue","https://stirling.jarrettwroten.com/"],["Starbase Wraps","Tesla Wraps And PPF","https://starbase.jarrettwroten.com/"],["Rana Levy","Fine Jewelry And Lapidary","https://rana.jarrettwroten.com/"],["Dylan Prorok","Japanese Tattoo Artist","https://prorok.jarrettwroten.com/"],["Rainbow Gardens","Wedding Venue","https://rainbow.jarrettwroten.com/"]];
    var pn=d.getElementById("plateName"), pc=d.getElementById("plateCat"), pl=d.getElementById("plateLink"), cur=0;
    pv.addEventListener("timeupdate",function(){ var i=Math.min(segs.length-1,Math.floor(pv.currentTime/2.2)); if(i===cur) return; cur=i;
      pn.textContent=segs[i][0]; pc.textContent=segs[i][1]; pl.href=segs[i][2]; pl.setAttribute("aria-label","Open the "+segs[i][0]+" concept in a new tab"); });
  }
})();
