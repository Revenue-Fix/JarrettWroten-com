/* Homepage portfolio controller derived from the approved /work/ oracle.
   It owns only #portfolio-passage and coordinates only the shared motion preference. */
(function () {
  "use strict";

  var TAU = 0.41;
  var EPSILON = 0.0006;
  var root = document.documentElement;
  var passage = document.getElementById("portfolio-passage");
  var viewport = document.getElementById("portfolio-viewport");
  var motionToggle = document.getElementById("portfolio-motion-toggle");
  var copyGenerations = document.getElementById("portfolio-copy-generations");
  var copyPaina = document.getElementById("portfolio-copy-paina");
  var copyRana = document.getElementById("portfolio-copy-rana");
  var copyProrok = document.getElementById("portfolio-copy-prorok");
  var copyTerminal = document.getElementById("portfolio-copy-terminal");

  var generationsVideo = document.getElementById("portfolio-generations-video");
  var painaVideo = document.getElementById("portfolio-paina-video");
  var studioVideo = document.getElementById("portfolio-rana-studio-video");
  var ringVideo = document.getElementById("portfolio-rana-ring-video");
  var inkVideo = document.getElementById("portfolio-prorok-ink-video");
  var generationsPoster = document.getElementById("portfolio-generations-poster");
  var painaPoster = document.getElementById("portfolio-paina-poster");
  var ringPoster = document.getElementById("portfolio-ring-poster");
  var prorokPortrait = document.getElementById("portfolio-prorok-portrait");
  var terminalReturn = document.getElementById("portfolio-terminal-return");
  var mobileScenePlate = document.getElementById("portfolio-mobile-scene-plate");
  var layerPaina = document.getElementById("portfolio-layer-paina");
  var layerRana = document.getElementById("portfolio-layer-rana");
  var layerProrok = document.getElementById("portfolio-layer-prorok");
  var layerTerminal = document.getElementById("portfolio-layer-terminal");

  var motionOn = root.getAttribute("data-motion") !== "off";
  var progressTarget = 0;
  var progressCurrent = 0;
  var renderRaf = 0;
  var lastFrameTs = 0;
  var videosArmed = false;

  /* The new food passage occupies the first 30%; the inherited tail keeps its
     internal timing through a local 0–1 clock. */
  var TAIL_START = 0.30;
  var INTRO = {
    generationsOut: { a: 0.12, b: 0.27 },
    painaOpen:       { a: 0.12, b: 0.27 },
    painaSide:       { a: 0.18, b: 0.30 },
    painaHold:       { a: 0.22, b: 0.27, c: 0.33, d: 0.40 }
  };
  var MAP = {
    ranaOpen:     { a: 0.10, b: 0.28 },
    ranaHold:     { a: 0.22, b: 0.30, c: 0.44, d: 0.56 },
    ring:         { a: 0.26, b: 0.34, c: 0.46, d: 0.56 },
    prorokOpen:   { a: 0.46, b: 0.64 },
    prorokHold:   { a: 0.58, b: 0.66, c: 0.73, d: 0.79 },
    terminalHold: { a: 0.81, b: 0.93 }
  };

  var STILL = {
    generations: 0.04,
    paina: 0.26,
    rana: 0.566,
    prorok: 0.79,
    process: 0.958
  };

  var MOBILE_BREAKPOINT_PX = 720;
  var MOBILE_SWIPE_THRESHOLD_PX = 24;
  var MOBILE_WHEEL_THRESHOLD_PX = 18;
  var MOBILE_WHEEL_IDLE_MS = 180;
  var MOBILE_SECTION_GLIDE_MS = 960;
  var MOBILE_READINESS_MS = 8000;
  var MOBILE_FRAME_ADVANCE_S = 0.05;
  var MOBILE_CUT_PHASE = 0.5;
  var MOBILE_COPY_OUT_END = 0.34;
  var MOBILE_COPY_IN_START = 0.64;
  var MOBILE_STOPS = [
    { id: "generations", progress: STILL.generations },
    { id: "paina", progress: STILL.paina },
    { id: "rana", progress: STILL.rana },
    { id: "prorok", progress: STILL.prorok },
    { id: "process", progress: STILL.process }
  ];
  var mobileMq = window.matchMedia("(max-width:" + MOBILE_BREAKPOINT_PX + "px)");
  var mobileGlideLocked = false;
  var mobileScrollRaf = 0;
  var mobileTouchActive = false;
  var mobileTouchVertical = false;
  var mobileTouchStartX = 0;
  var mobileTouchStartY = 0;
  var mobileTouchLastX = 0;
  var mobileTouchLastY = 0;
  var mobileWheelActive = false;
  var mobileWheelTriggered = false;
  var mobileWheelDelta = 0;
  var mobileWheelIdleTimer = 0;
  var mobileDestinationId = "";
  var mobileTransition = null;
  var mobileWaiting = false;
  var mobileRequestedStopId = "";
  var mobileRequestGeneration = 0;
  var mobileReadinessTimer = 0;
  var mobileReadinessInterval = 0;
  var mobileReadinessPulse = null;
  var hiddenFrameCanvas = null;
  var hiddenFrameCtx = null;
  var mobilePlateCtx = null;
  var mobileSceneBuffer = null;
  var mobileSceneBufferCtx = null;
  var mobileMaskBuffer = null;
  var mobileMaskBufferCtx = null;
  var mobilePlateWidth = 0;
  var mobilePlateHeight = 0;
  var lastMobileContainGeometry = null;
  var mobilePlateActive = false;
  var breakpointModeMobile = !!mobileMq.matches;
  var breakpointSwapActive = false;
  var breakpointFallbackActive = false;
  var breakpointFallbackOwnerIndex = -1;
  var breakpointSwapTargetMobile = breakpointModeMobile;
  var breakpointSwapGeneration = 0;
  var breakpointSwapInterval = 0;
  var breakpointSwapTimer = 0;
  var breakpointSwapStopIndex = 0;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function smoothstep(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function isMobile() {
    return !!(mobileMq && mobileMq.matches);
  }
  function range(p, a, b) {
    return smoothstep((p - a) / Math.max(0.0001, b - a));
  }
  function plateau(p, a, b, c, d) {
    if (p < a) return 0;
    if (p < b) return range(p, a, b);
    if (p < c) return 1;
    if (p < d) return 1 - range(p, c, d);
    return 0;
  }
  function span(t, a, b) {
    return clamp((t - a) / Math.max(0.0001, b - a), 0, 1);
  }
  function mobilePairClock(elapsed) {
    elapsed = clamp(elapsed, 0, 1);
    return elapsed;
  }

  function setMotionUI() {
    if (!motionToggle) return;
    motionToggle.setAttribute("aria-pressed", motionOn ? "true" : "false");
    motionToggle.textContent = motionOn ? "Motion on" : "Motion off";
    motionToggle.setAttribute(
      "aria-label",
      motionOn
        ? "Motion is on. Activate to turn motion off."
        : "Motion is off. Activate to enable full motion."
    );
  }

  function applyMotionPreference(on, persist) {
    cancelMobileGlide();
    motionOn = !!on;
    root.setAttribute("data-motion", motionOn ? "on" : "off");
    if (persist) {
      if (window.JW_MOTION) window.JW_MOTION.set(motionOn, "portfolio", true);
    }
    setMotionUI();
    if (!motionOn) {
      progressCurrent = progressTarget;
      paint(progressCurrent);
      syncVideos(progressCurrent);
    } else {
      startRenderLoop();
      if (isMobile()) warmMobileBeatVideos();
      syncVideos(progressCurrent);
    }
  }

  function computeProgress() {
    if (!passage || !viewport) return 0;
    var rect = passage.getBoundingClientRect();
    var total = Math.max(1, passage.offsetHeight - viewport.offsetHeight);
    var scrolled = clamp(-rect.top, 0, total);
    return scrolled / total;
  }

  function portfolioOwnsViewport() {
    if (!passage || !viewport) return false;
    var rect = passage.getBoundingClientRect();
    var viewportHeight = Math.max(1, window.innerHeight || viewport.offsetHeight || 1);
    return rect.top <= viewportHeight * 0.35 && rect.bottom >= viewportHeight * 0.65;
  }

  function sceneValuesFromMap(p) {
    p = clamp(p, 0, 1);
    var tailP = clamp((p - TAIL_START) / (1 - TAIL_START), 0, 1);
    return {
      generationsHold: 1 - range(p, INTRO.generationsOut.a, INTRO.generationsOut.b),
      painaOpen: range(p, INTRO.painaOpen.a, INTRO.painaOpen.b),
      painaSide: range(p, INTRO.painaSide.a, INTRO.painaSide.b),
      painaHold: plateau(p, INTRO.painaHold.a, INTRO.painaHold.b, INTRO.painaHold.c, INTRO.painaHold.d),
      ranaOpen: range(tailP, MAP.ranaOpen.a, MAP.ranaOpen.b),
      ranaHold: plateau(tailP, MAP.ranaHold.a, MAP.ranaHold.b, MAP.ranaHold.c, MAP.ranaHold.d),
      ring: plateau(tailP, MAP.ring.a, MAP.ring.b, MAP.ring.c, MAP.ring.d),
      prorokOpen: range(tailP, MAP.prorokOpen.a, MAP.prorokOpen.b),
      prorokHold: plateau(tailP, MAP.prorokHold.a, MAP.prorokHold.b, MAP.prorokHold.c, MAP.prorokHold.d),
      terminalHold: range(tailP, MAP.terminalHold.a, MAP.terminalHold.b)
    };
  }

  function completeSceneValuesForRest(index) {
    index = clamp(index, 0, MOBILE_STOPS.length - 1);
    var values;
    if (index === 0) {
      values = { generationsHold:1, painaOpen:0, painaSide:0, painaHold:0, ranaOpen:0, ranaHold:0, ring:0, prorokOpen:0, prorokHold:0, terminalHold:0 };
    } else if (index === 1) {
      values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:1, ranaOpen:0, ranaHold:0, ring:0, prorokOpen:0, prorokHold:0, terminalHold:0 };
    } else if (index === 2) {
      values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:0, ranaOpen:1, ranaHold:1, ring:1, prorokOpen:0, prorokHold:0, terminalHold:0 };
    } else if (index === 3) {
      values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:0, ranaOpen:1, ranaHold:.12, ring:0, prorokOpen:1, prorokHold:1, terminalHold:0 };
    } else {
      values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:0, ranaOpen:1, ranaHold:0, ring:0, prorokOpen:1, prorokHold:0, terminalHold:1 };
    }
    return withCopy(values, copyValuesFromWorld(values));
  }

  function copyValuesFromWorld(v) {
    return {
      copyGenerations: Math.max(0, v.generationsHold * (1 - v.painaOpen * 1.2)),
      copyPaina: Math.max(0, v.painaHold * (1 - v.ranaOpen * 1.2)),
      copyRana: Math.max(0, v.ranaHold * (1 - v.prorokOpen * 1.15)),
      copyProrok: v.prorokHold * Math.max(0, 1 - v.terminalHold * 2),
      copyTerminal: v.terminalHold
    };
  }

  function withCopy(values, copy) {
    values.copyGenerations = copy.copyGenerations;
    values.copyPaina = copy.copyPaina;
    values.copyRana = copy.copyRana;
    values.copyProrok = copy.copyProrok;
    values.copyTerminal = copy.copyTerminal;
    return values;
  }

  function mobileSceneValuesForRest(index) {
    var stop = MOBILE_STOPS[clamp(index, 0, MOBILE_STOPS.length - 1)];
    var values = sceneValuesFromMap(stop.progress);
    values.plateScale = 1;
    values.plateShift = 0;
    return withCopy(values, copyValuesFromWorld(values));
  }

  function mobileCopyWeights(t) {
    t = clamp(t, 0, 1);
    return {
      outgoing: 1 - smoothstep(span(t, 0, MOBILE_COPY_OUT_END)),
      incoming: smoothstep(span(t, MOBILE_COPY_IN_START, 1))
    };
  }

  function mobilePlateCamera() {
    return { plateScale: 1, plateShift: 0 };
  }

  function mobileAuthoritativeIndex(fromIndex, toIndex, t) {
    return clamp(t, 0, 1) < MOBILE_CUT_PHASE ? fromIndex : toIndex;
  }

  function mobileSceneValuesForTransition(fromIndex, toIndex, t) {
    t = clamp(t, 0, 1);
    fromIndex = clamp(fromIndex, 0, MOBILE_STOPS.length - 1);
    toIndex = clamp(toIndex, 0, MOBILE_STOPS.length - 1);
    if (fromIndex === toIndex) return mobileSceneValuesForRest(fromIndex);
    var from = mobileSceneValuesForRest(fromIndex);
    var to = mobileSceneValuesForRest(toIndex);
    if (t <= 0) return from;
    if (t >= 1) return to;
    /* Single-plate match cut. One authored rest is authoritative: source
       before MOBILE_CUT_PHASE, destination at and after it. Copy leaves
       before the cut and enters after. The complete source plate stays
       geometrically fixed throughout. */
    var world = t < MOBILE_CUT_PHASE ? from : to;
    var copy = mobileCopyWeights(t);
    var camera = mobilePlateCamera(t, toIndex - fromIndex);
    return {
      generationsHold: world.generationsHold,
      painaOpen: world.painaOpen,
      painaSide: world.painaSide,
      painaHold: world.painaHold,
      ranaOpen: world.ranaOpen,
      ranaHold: world.ranaHold,
      ring: world.ring,
      prorokOpen: world.prorokOpen,
      prorokHold: world.prorokHold,
      terminalHold: world.terminalHold,
      copyGenerations: from.copyGenerations * copy.outgoing + to.copyGenerations * copy.incoming,
      copyPaina: from.copyPaina * copy.outgoing + to.copyPaina * copy.incoming,
      copyRana: from.copyRana * copy.outgoing + to.copyRana * copy.incoming,
      copyProrok: from.copyProrok * copy.outgoing + to.copyProrok * copy.incoming,
      copyTerminal: from.copyTerminal * copy.outgoing + to.copyTerminal * copy.incoming,
      plateScale: camera.plateScale,
      plateShift: camera.plateShift
    };
  }

  function applySceneValues(values) {
    var generationsHold = values.generationsHold;
    var painaOpen = values.painaOpen;
    var painaSide = values.painaSide;
    var painaHold = values.painaHold;
    var ranaOpen = values.ranaOpen;
    var ranaHold = values.ranaHold;
    var ring = values.ring;
    var prorokOpen = values.prorokOpen;
    var prorokHold = values.prorokHold;
    var terminalHold = values.terminalHold;
    root.style.setProperty("--portfolio-generations-hold", generationsHold.toFixed(4));
    root.style.setProperty("--portfolio-paina-open", painaOpen.toFixed(4));
    root.style.setProperty("--portfolio-paina-side", painaSide.toFixed(4));
    root.style.setProperty("--portfolio-paina-hold", painaHold.toFixed(4));
    root.style.setProperty("--portfolio-rana-open", ranaOpen.toFixed(4));
    root.style.setProperty("--portfolio-rana-hold", ranaHold.toFixed(4));
    root.style.setProperty("--portfolio-ring-presence", ring.toFixed(4));
    root.style.setProperty("--portfolio-prorok-open", prorokOpen.toFixed(4));
    root.style.setProperty("--portfolio-prorok-hold", prorokHold.toFixed(4));
    root.style.setProperty("--portfolio-terminal-hold", terminalHold.toFixed(4));
    var copyGenerationsValue = values.copyGenerations;
    var copyPainaValue = values.copyPaina;
    var copyRanaValue = values.copyRana;
    var copyProrokValue = values.copyProrok;
    var copyTerminalValue = values.copyTerminal;
    if (copyGenerationsValue == null) copyGenerationsValue = Math.max(0, generationsHold * (1 - painaOpen * 1.2));
    if (copyPainaValue == null) copyPainaValue = Math.max(0, painaHold * (1 - ranaOpen * 1.2));
    if (copyRanaValue == null) copyRanaValue = Math.max(0, ranaHold * (1 - prorokOpen * 1.15));
    if (copyProrokValue == null) copyProrokValue = prorokHold * Math.max(0, 1 - terminalHold * 2);
    if (copyTerminalValue == null) copyTerminalValue = terminalHold;
    root.style.setProperty("--portfolio-copy-generations", Number(copyGenerationsValue).toFixed(4));
    root.style.setProperty("--portfolio-copy-paina", Number(copyPainaValue).toFixed(4));
    root.style.setProperty("--portfolio-copy-rana", Number(copyRanaValue).toFixed(4));
    root.style.setProperty("--portfolio-copy-prorok", Number(copyProrokValue).toFixed(4));
    root.style.setProperty("--portfolio-copy-terminal", Number(copyTerminalValue).toFixed(4));
    var plateScale = values.plateScale == null ? 1 : values.plateScale;
    var plateShift = values.plateShift == null ? 0 : values.plateShift;
    root.style.setProperty("--portfolio-plate-scale", Number(plateScale).toFixed(4));
    root.style.setProperty("--portfolio-plate-shift", Number(plateShift).toFixed(4));

    /* Hard reveal gate: layers stay fully absent at open === 0 (visibility).
       Desktop unmasks spatially; mobile paints one rest plate at a time. */
    if (layerPaina) layerPaina.classList.toggle("portfolio-is-revealing", painaOpen > 0);
    if (layerRana) layerRana.classList.toggle("portfolio-is-revealing", ranaOpen > 0);
    if (layerProrok) layerProrok.classList.toggle("portfolio-is-revealing", prorokOpen > 0);
    if (layerTerminal) {
      layerTerminal.classList.toggle("portfolio-is-revealing", terminalHold > 0);
      layerTerminal.classList.toggle("portfolio-is-settled", terminalHold >= 1);
    }

    /* Focusability tracks authored visibility — hidden copy must not take Tab. */
    setCopyAccess(copyGenerations, copyGenerationsValue > 0.55);
    setCopyAccess(copyPaina, copyPainaValue > 0.55);
    setCopyAccess(copyRana, copyRanaValue > 0.55);
    setCopyAccess(copyProrok, copyProrokValue > 0.55);
    setCopyAccess(copyTerminal, copyTerminalValue > 0.55);
  }

  function imageHasRenderableFrame(image) {
    return !!(image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
  }

  function sourcePathEndsWith(element, suffix) {
    if (!element || !suffix) return false;
    var src = element.currentSrc || element.src || "";
    if (!src) return false;
    try { return new URL(src, window.location.href).pathname.endsWith(suffix); }
    catch (e) { return src.indexOf(suffix) >= 0; }
  }

  function expectedFoodVideoPath(video, mobile) {
    if (video === generationsVideo) {
      return mobile
        ? "/assets/work/generations/loco-moco-site-mobile-49849434.mp4"
        : "/assets/work/generations/loco-moco-site-desktop-3b1c9987.mp4";
    }
    if (video === painaVideo) {
      return mobile
        ? "/assets/work/paina/opening-mobile-from-2p4.mp4"
        : "/assets/work/paina/opening-desktop.mp4";
    }
    return "";
  }

  function expectedFoodPosterPath(image, mobile) {
    if (image === generationsPoster) {
      return mobile
        ? "/assets/work/generations/loco-moco-site-mobile-ea703ae1.jpg"
        : "/assets/work/generations/loco-moco-site-desktop-bf93bac9.jpg";
    }
    if (image === painaPoster) {
      return mobile
        ? "/assets/work/paina/opening-mobile-entry-2p4.jpg"
        : "/assets/work/paina/opening-desktop-poster.jpg";
    }
    return "";
  }

  function foodVideoMatchesMode(video, mobile) {
    return sourcePathEndsWith(video, expectedFoodVideoPath(video, mobile));
  }

  function foodPosterMatchesMode(image, mobile) {
    return sourcePathEndsWith(image, expectedFoodPosterPath(image, mobile));
  }

  function mobileSource(video, poster) {
    if (motionOn && videoHasRenderableFrame(video)) return video;
    if (imageHasRenderableFrame(poster)) return poster;
    if (videoHasRenderableFrame(video)) return video;
    return null;
  }

  function mobileSourceSize(source) {
    if (!source) return null;
    var width = source.videoWidth || source.naturalWidth || source.width || 0;
    var height = source.videoHeight || source.naturalHeight || source.height || 0;
    return width > 0 && height > 0 ? { width: width, height: height } : null;
  }

  function drawMobileContain(ctx, source) {
    var size = mobileSourceSize(source);
    if (!ctx || !size) return false;
    var scale = Math.min(mobilePlateWidth / size.width, mobilePlateHeight / size.height);
    var width = size.width * scale;
    var height = size.height * scale;
    var x = (mobilePlateWidth - width) * .5;
    var y = (mobilePlateHeight - height) * .5;
    lastMobileContainGeometry = {
      sourceWidth: size.width,
      sourceHeight: size.height,
      plateWidth: mobilePlateWidth,
      plateHeight: mobilePlateHeight,
      x: x,
      y: y,
      width: width,
      height: height
    };
    try {
      ctx.drawImage(source, x, y, width, height);
      return true;
    } catch (err) {
      return false;
    }
  }

  function fillMobileLinearGradient(ctx, x0, y0, x1, y1, stops) {
    var gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i++) gradient.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, mobilePlateWidth, mobilePlateHeight);
  }

  function fillMobileEllipseGradient(ctx, cx, cy, rx, ry, stops) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (var i = 0; i < stops.length; i++) gradient.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  function ensureMobilePlateSize() {
    if (!mobileScenePlate || !viewport || !mobilePlateCtx) return false;
    var rect = viewport.getBoundingClientRect();
    var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    var width = Math.max(1, Math.round(rect.width * dpr));
    var height = Math.max(1, Math.round(rect.height * dpr));
    if (width === mobilePlateWidth && height === mobilePlateHeight) return true;
    mobilePlateWidth = width;
    mobilePlateHeight = height;
    mobileScenePlate.width = width;
    mobileScenePlate.height = height;
    mobileSceneBuffer.width = width;
    mobileSceneBuffer.height = height;
    mobileMaskBuffer.width = width;
    mobileMaskBuffer.height = height;
    return true;
  }

  function initMobilePlate() {
    if ((!isMobile() && !breakpointSwapActive && !breakpointFallbackActive) || !mobileScenePlate || typeof mobileScenePlate.getContext !== "function") return false;
    if (!mobilePlateCtx) {
      try {
        mobilePlateCtx = mobileScenePlate.getContext("2d", { alpha: false, desynchronized: true });
      } catch (err) {
        mobilePlateCtx = mobileScenePlate.getContext("2d");
      }
      if (!mobilePlateCtx) return false;
      mobileSceneBuffer = document.createElement("canvas");
      mobileMaskBuffer = document.createElement("canvas");
      mobileSceneBufferCtx = mobileSceneBuffer.getContext("2d", { alpha: false });
      mobileMaskBufferCtx = mobileMaskBuffer.getContext("2d");
      if (!mobileSceneBufferCtx || !mobileMaskBufferCtx) return false;
    }
    return ensureMobilePlateSize();
  }

  function setMobilePlateActive(active) {
    active = !!active && (isMobile() || breakpointSwapActive || breakpointFallbackActive);
    if (active === mobilePlateActive) return;
    mobilePlateActive = active;
    root.classList.toggle("portfolio-mobile-plate-active", active);
  }

  function drawMobileGenerationsScene(ctx, sourceOverride) {
    var source = sourceOverride || mobileSource(generationsVideo, generationsPoster);
    if (!source) return false;
    ctx.filter = "saturate(1.04) contrast(1.04) brightness(.98)";
    var drawn = drawMobileContain(ctx, source);
    ctx.filter = "none";
    if (!drawn) return false;
    fillMobileLinearGradient(ctx, 0, 0, 0, mobilePlateHeight, [
      [0, "rgba(8,6,4,.12)"],
      [.5, "rgba(8,6,4,0)"],
      [1, "rgba(8,6,4,.66)"]
    ]);
    fillMobileLinearGradient(ctx, 0, 0, mobilePlateWidth, 0, [
      [0, "rgba(8,6,4,.34)"],
      [.62, "rgba(8,6,4,0)"],
      [1, "rgba(8,6,4,.08)"]
    ]);
    return true;
  }

  function drawMobilePainaScene(ctx, sourceOverride) {
    var source = sourceOverride || mobileSource(painaVideo, painaPoster);
    if (!source) return false;
    ctx.filter = "saturate(1.05) contrast(1.04) brightness(.98)";
    var drawn = drawMobileContain(ctx, source);
    ctx.filter = "none";
    if (!drawn) return false;
    fillMobileLinearGradient(ctx, 0, 0, 0, mobilePlateHeight, [
      [0, "rgba(4,12,11,.12)"],
      [.5, "rgba(4,12,11,0)"],
      [1, "rgba(4,12,11,.68)"]
    ]);
    fillMobileLinearGradient(ctx, 0, 0, mobilePlateWidth, 0, [
      [0, "rgba(4,12,11,.34)"],
      [.62, "rgba(4,12,11,0)"],
      [1, "rgba(4,12,11,.08)"]
    ]);
    return true;
  }

  function drawMobileRanaScene(ctx) {
    var source = mobileSource(ringVideo, ringPoster);
    if (!source) return false;
    ctx.filter = "saturate(1.1) contrast(1.06) brightness(1.03)";
    var drawn = drawMobileContain(ctx, source);
    ctx.filter = "none";
    if (!drawn) return false;
    fillMobileLinearGradient(ctx, 0, 0, 0, mobilePlateHeight, [
      [0, "rgba(4,10,12,.18)"],
      [.5, "rgba(4,10,12,.03)"],
      [1, "rgba(4,10,12,.72)"]
    ]);
    fillMobileLinearGradient(ctx, 0, 0, mobilePlateWidth, 0, [
      [0, "rgba(4,10,12,.36)"],
      [.58, "rgba(4,10,12,0)"],
      [1, "rgba(4,10,12,.12)"]
    ]);
    return true;
  }

  function drawMobileProrokScene(ctx) {
    var portrait = imageHasRenderableFrame(prorokPortrait) ? prorokPortrait : null;
    if (!portrait) return false;
    var ink = null;
    if (ink) {
      ctx.filter = "saturate(.9) contrast(1.08) brightness(.72)";
      ctx.globalAlpha = .72;
      drawMobileContain(ctx, ink);
      ctx.globalAlpha = 1;
      ctx.filter = "none";
    } else {
      ctx.fillStyle = "#0b0807";
      ctx.fillRect(0, 0, mobilePlateWidth, mobilePlateHeight);
    }

    mobileMaskBufferCtx.setTransform(1, 0, 0, 1, 0, 0);
    mobileMaskBufferCtx.clearRect(0, 0, mobilePlateWidth, mobilePlateHeight);
    mobileMaskBufferCtx.filter = "saturate(.94) contrast(1.14) brightness(1.06)";
    var portraitDrawn = drawMobileContain(mobileMaskBufferCtx, portrait);
    mobileMaskBufferCtx.filter = "none";
    if (!portraitDrawn) return false;
    ctx.drawImage(mobileMaskBuffer, 0, 0);
    fillMobileLinearGradient(ctx, 0, 0, 0, mobilePlateHeight, [
      [0, "rgba(11,8,7,.12)"],
      [.55, "rgba(11,8,7,.08)"],
      [1, "rgba(11,8,7,.76)"]
    ]);
    return true;
  }

  function drawMobileTerminalScene(ctx) {
    if (!imageHasRenderableFrame(terminalReturn)) return false;
    ctx.filter = "saturate(1) brightness(1) contrast(1.04)";
    var drawn = drawMobileContain(ctx, terminalReturn);
    ctx.filter = "none";
    if (!drawn) return false;
    fillMobileLinearGradient(ctx, 0, 0, 0, mobilePlateHeight, [
      [0, "rgba(4,10,12,.22)"],
      [.48, "rgba(4,10,12,0)"],
      [1, "rgba(4,10,12,.78)"]
    ]);
    fillMobileLinearGradient(ctx, 0, 0, mobilePlateWidth, 0, [
      [0, "rgba(4,10,12,.34)"],
      [.62, "rgba(4,10,12,.04)"],
      [1, "rgba(4,10,12,.1)"]
    ]);
    return true;
  }

  function composeMobileScene(index, sourceOverride) {
    var ctx = mobileSceneBufferCtx;
    if (!ctx) return false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.fillStyle = "#040a0c";
    ctx.fillRect(0, 0, mobilePlateWidth, mobilePlateHeight);
    if (index === 0) return drawMobileGenerationsScene(ctx, sourceOverride);
    if (index === 1) return drawMobilePainaScene(ctx, sourceOverride);
    if (index === 2) return drawMobileRanaScene(ctx);
    if (index === 3) return drawMobileProrokScene(ctx);
    return drawMobileTerminalScene(ctx);
  }

  function renderMobilePlate(index, values, sourceOverride) {
    if (!initMobilePlate()) {
      setMobilePlateActive(false);
      return false;
    }
    if (!composeMobileScene(index, sourceOverride)) return false;
    mobilePlateCtx.setTransform(1, 0, 0, 1, 0, 0);
    mobilePlateCtx.globalAlpha = 1;
    mobilePlateCtx.globalCompositeOperation = "source-over";
    mobilePlateCtx.filter = "none";
    mobilePlateCtx.fillStyle = "#040a0c";
    mobilePlateCtx.fillRect(0, 0, mobilePlateWidth, mobilePlateHeight);
    mobilePlateCtx.drawImage(mobileSceneBuffer, 0, 0);
    setMobilePlateActive(true);
    return true;
  }

  function breakpointRawSource(video, poster) {
    if (video && !video.error && video.readyState >= 2) return video;
    if (imageHasRenderableFrame(poster)) return poster;
    return null;
  }

  function preserveBreakpointPlate(index) {
    var heldCanvas = null;
    if (mobilePlateActive && mobileScenePlate && mobileScenePlate.width > 0 && mobileScenePlate.height > 0) {
      heldCanvas = document.createElement("canvas");
      heldCanvas.width = mobileScenePlate.width;
      heldCanvas.height = mobileScenePlate.height;
      var heldContext = heldCanvas.getContext("2d");
      if (heldContext) heldContext.drawImage(mobileScenePlate, 0, 0);
      else heldCanvas = null;
    }
    var source = null;
    if (index === 0) source = breakpointRawSource(generationsVideo, generationsPoster);
    if (index === 1) source = breakpointRawSource(painaVideo, painaPoster);
    if (!source) source = heldCanvas;
    return renderMobilePlate(index, mobileSceneValuesForRest(index), source);
  }

  function paintMobileRest(index) {
    var values = mobileSceneValuesForRest(index);
    var rendered = renderMobilePlate(index, values);
    if (rendered || !mobilePlateActive) applySceneValues(values);
  }

  function paintMobileTransition(fromIndex, toIndex, t) {
    var values = mobileSceneValuesForTransition(fromIndex, toIndex, t);
    var index = mobileAuthoritativeIndex(fromIndex, toIndex, t);
    var rendered = renderMobilePlate(index, values);
    if (rendered || !mobilePlateActive) applySceneValues(values);
  }

  function paint(p) {
    if (breakpointSwapActive) return;
    p = clamp(p, 0, 1);
    root.style.setProperty("--portfolio-progress", p.toFixed(5));

    /* Mobile Motion On: visible scene comes from the local rest/pair renderer.
       Global MAP windows stay the desktop path. Scroll may still travel
       underneath for rest ownership. */
    if (isMobile() && motionOn && mobileTransition) {
      paintMobileTransition(mobileTransition.fromIndex, mobileTransition.toIndex, mobileTransition.t);
      return;
    }
    if (isMobile() && motionOn) {
      paintMobileRest(mobileStopIndexAtProgress(p));
      return;
    }
    if (isMobile() && !motionOn) {
      paintMobileRest(mobileStopIndexAtProgress(p));
      return;
    }

    var values = sceneValuesFromMap(p);

    if (breakpointFallbackActive && !isMobile() && breakpointFallbackOwnerIndex >= 0) {
      var semanticIndex = mobileStopIndexAtProgress(p);
      var semanticStop = MOBILE_STOPS[semanticIndex];
      var showHeldFallback = semanticIndex === breakpointFallbackOwnerIndex ||
        !semanticStop || !mobileDestinationReady(semanticStop.id);
      if (showHeldFallback) {
        setMobilePlateActive(true);
        values = completeSceneValuesForRest(breakpointFallbackOwnerIndex);
      } else {
        setMobilePlateActive(false);
        values = completeSceneValuesForRest(semanticIndex);
      }
      applySceneValues(values);
      return;
    }

    /* Motion-off snaps to five authored full-screen rests. */
    if (!motionOn) {
      if (p < 0.15) {
        values = { generationsHold:1, painaOpen:0, painaSide:0, painaHold:0, ranaOpen:0, ranaHold:0, ring:0, prorokOpen:0, prorokHold:0, terminalHold:0 };
      } else if (p < 0.42) {
        values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:1, ranaOpen:0, ranaHold:0, ring:0, prorokOpen:0, prorokHold:0, terminalHold:0 };
      } else if (p < 0.68) {
        values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:0, ranaOpen:1, ranaHold:1, ring:1, prorokOpen:0, prorokHold:0, terminalHold:0 };
      } else if (p < 0.89) {
        values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:0, ranaOpen:1, ranaHold:.12, ring:0, prorokOpen:1, prorokHold:1, terminalHold:0 };
      } else {
        values = { generationsHold:0, painaOpen:1, painaSide:1, painaHold:0, ranaOpen:1, ranaHold:0, ring:0, prorokOpen:1, prorokHold:0, terminalHold:1 };
      }
    }

    applySceneValues(withCopy(values, copyValuesFromWorld(values)));
  }

  function setCopyAccess(el, active) {
    if (!el) return;
    el.style.pointerEvents = active ? "auto" : "none";
    var nodes = el.querySelectorAll("a, button");
    for (var i = 0; i < nodes.length; i++) {
      /* Descendants have explicit pointer-events:auto in the authored CSS, so
         disabling only their parent still leaves invisible later-scene actions
         on top of the visible link. Gate each interactive node at the same
         visibility threshold as keyboard access. */
      nodes[i].style.pointerEvents = active ? "auto" : "none";
      if (active) nodes[i].removeAttribute("tabindex");
      else nodes[i].setAttribute("tabindex", "-1");
    }
  }

  function startRenderLoop() {
    if (renderRaf) return;
    lastFrameTs = 0;
    renderRaf = window.requestAnimationFrame(renderTick);
  }

  function renderTick(ts) {
    renderRaf = 0;
    var dt = lastFrameTs ? Math.min(0.048, (ts - lastFrameTs) / 1000) : 0.016;
    lastFrameTs = ts;
    if (!motionOn) {
      progressCurrent = progressTarget;
      paint(progressCurrent);
      lastFrameTs = 0;
      return;
    }
    if (isMobile()) {
      progressCurrent = progressTarget;
      paint(progressCurrent);
      renderRaf = window.requestAnimationFrame(renderTick);
      return;
    }
    var alpha = 1 - Math.exp(-dt / Math.max(0.001, TAU));
    progressCurrent += (progressTarget - progressCurrent) * alpha;
    paint(progressCurrent);
    if (Math.abs(progressTarget - progressCurrent) > EPSILON) {
      renderRaf = window.requestAnimationFrame(renderTick);
    } else {
      progressCurrent = progressTarget;
      paint(progressCurrent);
      lastFrameTs = 0;
    }
  }

  function sampleScroll() {
    if (breakpointSwapActive) return;
    progressTarget = computeProgress();
    if (!motionOn || isMobile()) {
      progressCurrent = progressTarget;
      paint(progressCurrent);
      syncVideos(progressCurrent);
      return;
    }
    startRenderLoop();
    syncVideos(progressTarget);
  }

  function armVideos() {
    videosArmed = true;
  }

  function playSafe(video) {
    if (!video) return;
    if (video.hasAttribute("data-once") && video.ended) return;
    var p = video.play();
    if (p && typeof p.catch === "function") p.catch(function () {});
  }
  function pauseSafe(video) {
    if (!video) return;
    try { video.pause(); } catch (e) {}
  }

  function bindPosterFallback(video, posterEl) {
    if (!video) return;
    function fail() {
      video.classList.remove("portfolio-is-ready");
      video.style.opacity = "0";
      if (posterEl) posterEl.style.opacity = "1";
    }
    video.addEventListener("error", fail);
    video.addEventListener("stalled", function () {
      if (video.readyState < 2) fail();
    });
    video.addEventListener("loadeddata", function () {
      if ((video === generationsVideo || video === painaVideo) && !foodVideoMatchesMode(video, isMobile())) {
        fail();
        return;
      }
      video.classList.add("portfolio-is-ready");
      video.style.opacity = "";
    });
    if (video.readyState >= 2 && (!(video === generationsVideo || video === painaVideo) || foodVideoMatchesMode(video, isMobile()))) {
      video.classList.add("portfolio-is-ready");
      video.style.opacity = "";
    }
  }

  function videosForMobileStop(id) {
    if (id === "generations") return [generationsVideo];
    if (id === "paina") return [painaVideo];
    if (id === "rana") return [ringVideo];
    if (id === "prorok") return [];
    /* Process is image-backed; image readiness is checked separately. */
    return [];
  }

  function imagesForMobileStop(id) {
    if (id === "generations") return [generationsPoster];
    if (id === "paina") return [painaPoster];
    if (id === "rana") return [ringPoster];
    if (id === "prorok") return [prorokPortrait];
    if (id === "process") return [terminalReturn];
    return [];
  }

  function requestMobileVideo(video, shouldPlay) {
    if (!video) return;
    try { video.preload = "auto"; } catch (e) {}
    if (shouldPlay) {
      playSafe(video);
    } else if (video.readyState < 1) {
      try { video.load(); } catch (e2) {}
    }
  }

  function resetVideoReadinessState(video) {
    if (!video) return;
    video.jwCallbackGeneration = (video.jwCallbackGeneration || 0) + 1;
    var handle = video.jwFrameCallbackHandle;
    video.jwFrameCallbackHandle = null;
    video.jwDecodedFrame = false;
    video.jwSawDataEvent = false;
    video.jwFrameCallbackArmed = false;
    video.jwPlayBaseline = null;
    if (handle != null && typeof video.cancelVideoFrameCallback === "function") {
      try { video.cancelVideoFrameCallback(handle); } catch (err) {}
    }
  }

  function videoIsSameOrigin(video) {
    if (!video) return false;
    var src = video.currentSrc || video.src || "";
    if (!src) return false;
    if (src.indexOf("blob:") === 0 || src.indexOf("data:") === 0) return false;
    try {
      if (typeof window === "undefined" || !window.location) {
        return src.charAt(0) === "." || src.charAt(0) === "/";
      }
      var resolved = new URL(src, window.location.href);
      return resolved.origin === window.location.origin;
    } catch (err) {
      return src.indexOf("://") < 0;
    }
  }

  function getHiddenFrameProbe() {
    if (hiddenFrameCtx) return hiddenFrameCtx;
    try {
      if (typeof document === "undefined" || !document.createElement) return null;
      var canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      hiddenFrameCanvas = canvas;
      hiddenFrameCtx = ctx;
      return ctx;
    } catch (err) {
      return null;
    }
  }

  function probeHiddenVideoFrame(video, ctx) {
    if (!video || video.error || video.readyState < 2) return false;
    if (!videoIsSameOrigin(video)) return false;
    if (!ctx) ctx = getHiddenFrameProbe();
    if (!ctx) return false;
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.drawImage(video, 0, 0, 1, 1);
      var px = ctx.getImageData(0, 0, 1, 1).data;
      return !!(px && px.length >= 4 && px[3] > 0);
    } catch (err) {
      return false;
    }
  }

  function capturePlaybackBaseline(video) {
    if (!video || video.jwPlayBaseline != null) return;
    if (typeof video.currentTime !== "number") return;
    video.jwPlayBaseline = video.currentTime;
  }

  function videoHasPlaybackAdvance(video) {
    if (!video || video.error || video.readyState < 2) return false;
    if (video.paused !== false) return false;
    if (typeof video.currentTime !== "number" || video.jwPlayBaseline == null) return false;
    if (video.currentTime < video.jwPlayBaseline) return true;
    return video.currentTime - video.jwPlayBaseline >= MOBILE_FRAME_ADVANCE_S;
  }

  function noteDecodedVideoFrame(video) {
    if (!video || video.error || video.readyState < 2) return false;
    if ((video === generationsVideo || video === painaVideo) && !foodVideoMatchesMode(video, isMobile())) return false;
    video.jwDecodedFrame = true;
    if (typeof mobileReadinessPulse === "function") mobileReadinessPulse();
    if (typeof window !== "undefined" && isMobile()) {
      window.setTimeout(function () { syncVideos(progressCurrent); }, 0);
    }
    return true;
  }

  function proveHiddenVideoFrame(video) {
    if (!video || video.error || video.readyState < 2) return false;
    if (video.jwDecodedFrame === true) return true;
    if (typeof video.requestVideoFrameCallback !== "function") {
      return noteDecodedVideoFrame(video);
    }
    if (probeHiddenVideoFrame(video) || videoHasPlaybackAdvance(video)) {
      return noteDecodedVideoFrame(video);
    }
    return false;
  }

  function armVideoFrameCallback(video) {
    if (!video || typeof video.requestVideoFrameCallback !== "function") return;
    if (video.jwFrameCallbackArmed) return;
    var generation = video.jwCallbackGeneration || 0;
    video.jwFrameCallbackArmed = true;
    try {
      var handle = video.requestVideoFrameCallback(function () {
        if ((video.jwCallbackGeneration || 0) !== generation) return;
        video.jwFrameCallbackArmed = false;
        video.jwFrameCallbackHandle = null;
        noteDecodedVideoFrame(video);
      });
      if ((video.jwCallbackGeneration || 0) !== generation) return;
      video.jwFrameCallbackHandle = handle;
    } catch (err) {
      if ((video.jwCallbackGeneration || 0) !== generation) return;
      video.jwFrameCallbackArmed = false;
      video.jwFrameCallbackHandle = null;
      proveHiddenVideoFrame(video);
    }
  }

  function videoHasRenderableFrame(video) {
    if (!video || video.error) return false;
    if (video.readyState < 2) return false;
    if ((video === generationsVideo || video === painaVideo) && !foodVideoMatchesMode(video, isMobile())) return false;
    if (video.jwDecodedFrame === true) return true;
    if (typeof video.requestVideoFrameCallback !== "function") return true;
    return proveHiddenVideoFrame(video);
  }

  function imageHasFailed(image) {
    return !!(image && image.complete && image.naturalWidth === 0);
  }

  function destinationRepresentationReady(video, image) {
    return videoHasRenderableFrame(video) || imageHasRenderableFrame(image);
  }

  function destinationRepresentationFailed(video, image) {
    var videoFailed = !video || !!video.error;
    var imageFailed = !image || imageHasFailed(image);
    return videoFailed && imageFailed;
  }

  function mobileDestinationReady(id) {
    if (id === "generations") return destinationRepresentationReady(generationsVideo, generationsPoster);
    if (id === "paina") return destinationRepresentationReady(painaVideo, painaPoster);
    if (id === "rana") return destinationRepresentationReady(ringVideo, ringPoster);
    if (id === "prorok") return imageHasRenderableFrame(prorokPortrait);
    if (id === "process") return imageHasRenderableFrame(terminalReturn);
    return false;
  }

  function mobileDestinationFailed(id) {
    if (id === "generations") return destinationRepresentationFailed(generationsVideo, generationsPoster);
    if (id === "paina") return destinationRepresentationFailed(painaVideo, painaPoster);
    if (id === "rana") return destinationRepresentationFailed(ringVideo, ringPoster);
    if (id === "prorok") return imageHasFailed(prorokPortrait);
    if (id === "process") return imageHasFailed(terminalReturn);
    return false;
  }

  function mobileReadinessStatus(spec) {
    if (!spec) return "pending";
    if (spec.token !== spec.generation) return "stale";
    if (spec.failed) return "error";
    if (spec.ready) return "ready";
    if (spec.elapsedMs >= spec.ceilingMs) return "timeout";
    return "pending";
  }

  function applyMobileReadinessResult(result, token, generation, startPassage, abortRequest) {
    if (token !== generation) return "stale";
    if (result !== "ready") {
      if (typeof abortRequest === "function") abortRequest();
      return result;
    }
    if (typeof startPassage === "function") startPassage();
    return "started";
  }

  function bindVideoReadiness(video) {
    if (!video) return;
    function onDataSignal() {
      if (video.error) {
        resetVideoReadinessState(video);
        if (typeof mobileReadinessPulse === "function") mobileReadinessPulse();
        return;
      }
      if (video.readyState < 2) return;
      video.jwSawDataEvent = true;
      capturePlaybackBaseline(video);
      armVideoFrameCallback(video);
      proveHiddenVideoFrame(video);
      if (typeof mobileReadinessPulse === "function") mobileReadinessPulse();
    }
    function onResetSignal() {
      resetVideoReadinessState(video);
      if (typeof mobileReadinessPulse === "function") mobileReadinessPulse();
    }
    function onTimeSignal() {
      if (video.jwDecodedFrame === true) return;
      if (proveHiddenVideoFrame(video) && typeof mobileReadinessPulse === "function") {
        mobileReadinessPulse();
      }
    }
    video.addEventListener("loadeddata", onDataSignal);
    video.addEventListener("canplay", onDataSignal);
    video.addEventListener("playing", onDataSignal);
    video.addEventListener("timeupdate", onTimeSignal);
    video.addEventListener("loadstart", onResetSignal);
    video.addEventListener("emptied", onResetSignal);
    video.addEventListener("error", onResetSignal);
    if (video.readyState >= 2) onDataSignal();
  }

  function bindImageReadiness(image) {
    if (!image) return;
    function signal() {
      if (typeof mobileReadinessPulse === "function") mobileReadinessPulse();
      if (isMobile()) paint(progressCurrent);
    }
    image.addEventListener("load", signal);
    image.addEventListener("error", signal);
  }

  function warmMobileBeatVideos() {
    if (!motionOn || !isMobile()) return;
    requestMobileVideo(generationsVideo, true);
  }

  function prepareMobileDestination(index) {
    if (!motionOn) {
      mobileDestinationId = "";
      return;
    }
    var stop = MOBILE_STOPS[clamp(index, 0, MOBILE_STOPS.length - 1)];
    mobileDestinationId = stop ? stop.id : "";
    var videos = videosForMobileStop(mobileDestinationId);
    var i;
    for (i = 0; i < videos.length; i++) requestMobileVideo(videos[i], false);
  }

  function clearMobileDestination() {
    mobileDestinationId = "";
  }

  function syncVideos(p) {
    if (breakpointSwapActive) {
      pauseSafe(generationsVideo);
      pauseSafe(painaVideo);
      return;
    }
    if (!motionOn) {
      pauseSafe(generationsVideo);
      pauseSafe(painaVideo);
      pauseSafe(studioVideo);
      pauseSafe(ringVideo);
      pauseSafe(inkVideo);
      return;
    }
    armVideos();
    if (isMobile()) {
      var activeIndex = mobileTransition
        ? mobileAuthoritativeIndex(mobileTransition.fromIndex, mobileTransition.toIndex, mobileTransition.t)
        : mobileStopIndexAtProgress(p);
      var activeId = MOBILE_STOPS[activeIndex].id;
      var activeVideos = videosForMobileStop(activeId);
      function isActive(video) {
        for (var i = 0; i < activeVideos.length; i++) if (activeVideos[i] === video) return true;
        return false;
      }
      if (isActive(generationsVideo)) playSafe(generationsVideo);
      else pauseSafe(generationsVideo);
      if (isActive(painaVideo)) playSafe(painaVideo);
      else pauseSafe(painaVideo);
      pauseSafe(studioVideo);
      if (isActive(ringVideo)) playSafe(ringVideo);
      else pauseSafe(ringVideo);
      pauseSafe(inkVideo);
      return;
    }
    if (p < 0.28) playSafe(generationsVideo);
    else pauseSafe(generationsVideo);
    if (p > 0.08 && p < 0.45) playSafe(painaVideo);
    else pauseSafe(painaVideo);
    if (p > 0.39 && p < 0.74) playSafe(studioVideo);
    else pauseSafe(studioVideo);
    if (p > 0.48 && p < 0.70) playSafe(ringVideo);
    else pauseSafe(ringVideo);
    pauseSafe(inkVideo);
  }

  function isInteractiveOrigin(e) {
    var t = e && e.target;
    if (!t) return false;
    if (t.nodeType !== 1) t = t.parentElement;
    if (!t || !t.closest) return false;
    return !!t.closest("a, button, input, select, textarea, [contenteditable], [contenteditable=\"true\"]");
  }

  function isOpenOverlay() {
    return !!document.querySelector(".lightbox.is-open, .modal.is-open, [aria-modal=\"true\"]:not([hidden])");
  }

  function passageGestureAvailable() {
    return !!passage && !!viewport && portfolioOwnsViewport() && !isOpenOverlay();
  }

  function mobileNavigationBusy() {
    return mobileGlideLocked || mobileWaiting || breakpointSwapActive;
  }

  function nowMs() {
    return window.performance && typeof performance.now === "function" ? performance.now() : Date.now();
  }

  function clearMobileReadinessWatch() {
    if (mobileReadinessTimer) {
      window.clearTimeout(mobileReadinessTimer);
      mobileReadinessTimer = 0;
    }
    if (mobileReadinessInterval) {
      window.clearInterval(mobileReadinessInterval);
      mobileReadinessInterval = 0;
    }
    mobileReadinessPulse = null;
  }

  function abortMobileReadinessRequest() {
    mobileWaiting = false;
    mobileRequestedStopId = "";
    clearMobileDestination();
    clearMobileReadinessWatch();
  }

  function waitForMobileDestinationReady(id, token, onDone) {
    var startedAt = nowMs();
    var settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      clearMobileReadinessWatch();
      if (typeof onDone === "function") onDone(result);
    }

    function pulse() {
      if (settled) return;
      var status = mobileReadinessStatus({
        token: token,
        generation: mobileRequestGeneration,
        failed: mobileDestinationFailed(id),
        ready: mobileDestinationReady(id),
        elapsedMs: nowMs() - startedAt,
        ceilingMs: MOBILE_READINESS_MS
      });
      if (status === "pending") return;
      finish(status);
    }

    pulse();
    if (settled) return;

    mobileReadinessPulse = pulse;
    mobileReadinessInterval = window.setInterval(pulse, 50);
    mobileReadinessTimer = window.setTimeout(pulse, MOBILE_READINESS_MS);
  }

  function cancelMobileReadiness() {
    mobileRequestGeneration += 1;
    mobileWaiting = false;
    mobileRequestedStopId = "";
    if (typeof mobileReadinessPulse === "function") mobileReadinessPulse();
    else clearMobileReadinessWatch();
  }

  function cancelVisibleMobileGlide() {
    if (mobileScrollRaf) window.cancelAnimationFrame(mobileScrollRaf);
    mobileScrollRaf = 0;
    mobileGlideLocked = false;
    mobileTransition = null;
  }

  function cancelMobileGlide() {
    cancelMobileReadiness();
    cancelVisibleMobileGlide();
    clearMobileDestination();
  }

  function resetMobileTouch() {
    mobileTouchActive = false;
    mobileTouchVertical = false;
    mobileTouchStartX = mobileTouchStartY = 0;
    mobileTouchLastX = mobileTouchLastY = 0;
  }

  function resetMobileWheel() {
    if (mobileWheelIdleTimer) window.clearTimeout(mobileWheelIdleTimer);
    mobileWheelIdleTimer = 0;
    mobileWheelActive = false;
    mobileWheelTriggered = false;
    mobileWheelDelta = 0;
  }

  function passageScrollTotal() {
    if (!passage || !viewport) return 1;
    return Math.max(1, passage.offsetHeight - viewport.offsetHeight);
  }

  function glideScrollTo(top) {
    cancelVisibleMobileGlide();
    var start = window.scrollY || window.pageYOffset || 0;
    var distance = top - start;
    if (!motionOn || Math.abs(distance) < 0.5) {
      window.scrollTo(0, top);
      sampleScroll();
      return;
    }
    var started = performance.now();
    var duration = MOBILE_SECTION_GLIDE_MS;
    var fromIndex = mobileStopIndexAtProgress(start / passageScrollTotal());
    var toIndex = mobileStopIndexAtProgress(top / passageScrollTotal());
    prepareMobileDestination(toIndex);
    mobileGlideLocked = true;
    mobileTransition = { fromIndex: fromIndex, toIndex: toIndex, t: 0 };
    paintMobileTransition(fromIndex, toIndex, 0);

    function glide(now) {
      var elapsed = clamp((now - started) / duration, 0, 1);
      /* Scroll travel keeps cubic smoothstep — zero-velocity departure,
         continuous travel, and a zero-velocity landing. The pair renderer
         uses a local linear clock so the named cut and copy windows stay
         on wall time and are not smoothstepped twice. Global MAP bands
         do not author the mobile glide. */
      var eased = smoothstep(elapsed);
      var pairT = mobilePairClock(elapsed);
      mobileTransition = { fromIndex: fromIndex, toIndex: toIndex, t: pairT };
      window.scrollTo(0, start + distance * eased);
      var glideProgress = computeProgress();
      progressTarget = progressCurrent = glideProgress;
      paint(glideProgress);
      syncVideos(glideProgress);
      if (elapsed < 1) mobileScrollRaf = window.requestAnimationFrame(glide);
      else {
        window.scrollTo(0, top);
        mobileScrollRaf = 0;
        mobileTransition = null;
        progressTarget = progressCurrent = computeProgress();
        paint(progressCurrent);
        syncVideos(progressCurrent);
        mobileGlideLocked = false;
        clearMobileDestination();
      }
    }

    mobileScrollRaf = window.requestAnimationFrame(glide);
  }

  function mobileStopIndexAtProgress(p) {
    var best = 0;
    var bestDistance = Infinity;
    for (var i = 0; i < MOBILE_STOPS.length; i++) {
      var distance = Math.abs(p - MOBILE_STOPS[i].progress);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return best;
  }

  function scrollToMobileStopIndex(index) {
    if (!passage || !viewport) return Promise.resolve(false);
    var bounded = clamp(index, 0, MOBILE_STOPS.length - 1);
    var top = MOBILE_STOPS[bounded].progress * passageScrollTotal();
    if (!motionOn) {
      cancelMobileGlide();
      window.scrollTo({ top: top, left: 0, behavior: "auto" });
      sampleScroll();
      return Promise.resolve(true);
    }
    var start = window.scrollY || window.pageYOffset || 0;
    if (Math.abs(top - start) < 0.5) {
      window.scrollTo(0, top);
      sampleScroll();
      return Promise.resolve(true);
    }
    if (mobileNavigationBusy()) return Promise.resolve(false);

    var stop = MOBILE_STOPS[bounded];
    var token = ++mobileRequestGeneration;
    mobileWaiting = true;
    mobileRequestedStopId = stop.id;
    prepareMobileDestination(bounded);

    function startPassage() {
      mobileWaiting = false;
      mobileRequestedStopId = "";
      glideScrollTo(top);
    }

    function settle(result) {
      return applyMobileReadinessResult(
        result,
        token,
        mobileRequestGeneration,
        startPassage,
        abortMobileReadinessRequest
      ) === "started";
    }

    if (mobileDestinationReady(stop.id)) {
      return Promise.resolve(settle("ready"));
    }

    return new Promise(function (resolve) {
      waitForMobileDestinationReady(stop.id, token, function (result) {
        resolve(settle(result));
      });
    });
  }

  function glideToProcessArrival() {
    var processJourney = document.getElementById("process-journey");
    if (!processJourney) return false;
    cancelVisibleMobileGlide();
    var start = window.scrollY || window.pageYOffset || 0;
    var top = start + processJourney.getBoundingClientRect().top;
    if (!motionOn || Math.abs(top - start) < 0.5) {
      window.scrollTo(0, top);
      return true;
    }
    var started = performance.now();
    mobileGlideLocked = true;
    function glide(now) {
      var elapsed = clamp((now - started) / MOBILE_SECTION_GLIDE_MS, 0, 1);
      window.scrollTo(0, start + (top - start) * smoothstep(elapsed));
      if (elapsed < 1) mobileScrollRaf = window.requestAnimationFrame(glide);
      else {
        window.scrollTo(0, top);
        mobileScrollRaf = 0;
        mobileGlideLocked = false;
      }
    }
    mobileScrollRaf = window.requestAnimationFrame(glide);
    return true;
  }

  function advanceMobileStop(direction) {
    if (mobileNavigationBusy() || !direction) return false;
    if (isOpenOverlay()) return false;
    var current = mobileStopIndexAtProgress(computeProgress());
    if (direction > 0 && current === MOBILE_STOPS.length - 1) return glideToProcessArrival();
    var next = clamp(current + (direction > 0 ? 1 : -1), 0, MOBILE_STOPS.length - 1);
    if (next === current) return false;
    return scrollToMobileStopIndex(next);
  }

  function onMobileTouchStart(e) {
    resetMobileTouch();
    if (!passageGestureAvailable() || mobileNavigationBusy() || !e.touches || e.touches.length !== 1) return;
    if (isInteractiveOrigin(e)) return;
    var touch = e.touches[0];
    mobileTouchActive = true;
    mobileTouchStartX = mobileTouchLastX = touch.clientX;
    mobileTouchStartY = mobileTouchLastY = touch.clientY;
  }

  function onMobileTouchMove(e) {
    if (mobileNavigationBusy() && passageGestureAvailable()) {
      e.preventDefault();
      return;
    }
    if (!mobileTouchActive || !passageGestureAvailable()) return;
    if (!e.touches || e.touches.length !== 1) {
      resetMobileTouch();
      return;
    }
    var touch = e.touches[0];
    mobileTouchLastX = touch.clientX;
    mobileTouchLastY = touch.clientY;
    var dx = mobileTouchLastX - mobileTouchStartX;
    var dy = mobileTouchLastY - mobileTouchStartY;
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);

    if (!mobileTouchVertical) {
      if (absX < 7 && absY < 7) return;
      if (absX > absY) {
        resetMobileTouch();
        return;
      }
      mobileTouchVertical = true;
    }
    e.preventDefault();
  }

  function onMobileTouchEnd(e) {
    if (!mobileTouchActive) return;
    if (e.touches && e.touches.length) {
      resetMobileTouch();
      return;
    }
    if (e.changedTouches && e.changedTouches.length) {
      mobileTouchLastX = e.changedTouches[0].clientX;
      mobileTouchLastY = e.changedTouches[0].clientY;
    }
    var dy = mobileTouchLastY - mobileTouchStartY;
    var qualifies = mobileTouchVertical && Math.abs(dy) >= MOBILE_SWIPE_THRESHOLD_PX;
    resetMobileTouch();
    if (qualifies) advanceMobileStop(dy < 0 ? 1 : -1);
  }

  function onMobileTouchCancel() {
    resetMobileTouch();
  }

  function closeMobileWheelGestureSoon() {
    if (mobileWheelIdleTimer) window.clearTimeout(mobileWheelIdleTimer);
    mobileWheelIdleTimer = window.setTimeout(function () {
      mobileWheelActive = false;
      mobileWheelTriggered = false;
      mobileWheelDelta = 0;
      mobileWheelIdleTimer = 0;
    }, MOBILE_WHEEL_IDLE_MS);
  }

  function onMobileWheel(e) {
    if (!passageGestureAvailable()) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (!mobileWheelActive) {
      mobileWheelActive = true;
      mobileWheelTriggered = false;
      mobileWheelDelta = 0;
    }
    mobileWheelDelta += e.deltaY;
    closeMobileWheelGestureSoon();
    if (mobileWheelTriggered || Math.abs(mobileWheelDelta) < MOBILE_WHEEL_THRESHOLD_PX) return;
    mobileWheelTriggered = true;
    if (!mobileNavigationBusy()) advanceMobileStop(mobileWheelDelta > 0 ? 1 : -1);
  }

  function clearBreakpointSwapWatch() {
    if (breakpointSwapInterval) window.clearInterval(breakpointSwapInterval);
    if (breakpointSwapTimer) window.clearTimeout(breakpointSwapTimer);
    breakpointSwapInterval = 0;
    breakpointSwapTimer = 0;
  }

  function breakpointWorldReady(video, poster, targetMobile) {
    var videoReady = foodVideoMatchesMode(video, targetMobile) && videoHasRenderableFrame(video);
    var posterReady = foodPosterMatchesMode(poster, targetMobile) && imageHasRenderableFrame(poster);
    return videoReady || posterReady;
  }

  function breakpointFoodReady(targetMobile) {
    return breakpointWorldReady(generationsVideo, generationsPoster, targetMobile) &&
      breakpointWorldReady(painaVideo, painaPoster, targetMobile);
  }

  function reloadFoodVideoForBreakpoint(video) {
    pauseSafe(video);
    resetVideoReadinessState(video);
    video.classList.remove("portfolio-is-ready");
    video.style.opacity = "0";
    try { video.load(); } catch (e) {}
  }

  function requestFoodPosterForBreakpoint(image, pulse) {
    if (!image || typeof image.decode !== "function") return;
    try {
      var decoded = image.decode();
      if (decoded && typeof decoded.then === "function") decoded.then(pulse, pulse);
    } catch (e) {}
  }

  function setBreakpointProgress(index) {
    var stop = MOBILE_STOPS[clamp(index, 0, MOBILE_STOPS.length - 1)];
    var progress = stop ? stop.progress : 0;
    window.scrollTo(0, progress * passageScrollTotal());
    progressTarget = progressCurrent = progress;
    return progress;
  }

  function finishBreakpointSwap(token, targetMobile, index, targetReady) {
    if (token !== breakpointSwapGeneration) return false;
    if (targetMobile !== isMobile()) {
      beginBreakpointSwap(isMobile());
      return false;
    }

    clearBreakpointSwapWatch();
    var progress = setBreakpointProgress(index);
    breakpointModeMobile = targetMobile;
    breakpointSwapTargetMobile = targetMobile;
    breakpointFallbackActive = !targetReady;
    breakpointFallbackOwnerIndex = targetReady ? -1 : index;
    breakpointSwapActive = false;

    if (targetReady) {
      if (targetMobile) {
        paintMobileRest(index);
        setMobilePlateActive(true);
      } else {
        paint(progress);
        setMobilePlateActive(false);
      }
    } else if (!mobilePlateActive && targetMobile) {
      preserveBreakpointPlate(index);
    }

    root.classList.remove("portfolio-source-swap-active");
    syncVideos(progressCurrent);
    if (motionOn) startRenderLoop();
    return true;
  }

  function beginBreakpointSwap(targetMobile) {
    targetMobile = !!targetMobile;
    if (breakpointSwapActive && breakpointSwapTargetMobile === targetMobile) return;
    if (!breakpointSwapActive && breakpointModeMobile === targetMobile && !breakpointFallbackActive) return;

    var token = ++breakpointSwapGeneration;
    clearBreakpointSwapWatch();
    breakpointSwapActive = true;
    breakpointSwapTargetMobile = targetMobile;
    breakpointSwapStopIndex = mobileStopIndexAtProgress(progressCurrent);
    cancelMobileGlide();
    resetMobileTouch();
    resetMobileWheel();
    pauseSafe(generationsVideo);
    pauseSafe(painaVideo);

    /* Preserve a complete prior rest while target representations load. */
    preserveBreakpointPlate(breakpointSwapStopIndex);
    if (mobilePlateActive) root.classList.add("portfolio-source-swap-active");
    breakpointFallbackActive = false;
    breakpointFallbackOwnerIndex = -1;

    reloadFoodVideoForBreakpoint(generationsVideo);
    reloadFoodVideoForBreakpoint(painaVideo);

    function pulse() {
      if (token !== breakpointSwapGeneration) return;
      if (targetMobile !== isMobile()) {
        beginBreakpointSwap(isMobile());
        return;
      }
      if (breakpointFoodReady(targetMobile)) {
        finishBreakpointSwap(token, targetMobile, breakpointSwapStopIndex, true);
      }
    }

    requestFoodPosterForBreakpoint(generationsPoster, pulse);
    requestFoodPosterForBreakpoint(painaPoster, pulse);
    breakpointSwapInterval = window.setInterval(pulse, 40);
    breakpointSwapTimer = window.setTimeout(function () {
      if (token !== breakpointSwapGeneration) return;
      finishBreakpointSwap(token, targetMobile, breakpointSwapStopIndex, false);
    }, MOBILE_READINESS_MS);
    pulse();
  }

  function onMobileViewportChange() {
    if (isMobile() !== breakpointModeMobile || breakpointSwapActive || breakpointFallbackActive) {
      beginBreakpointSwap(isMobile());
      return;
    }
    cancelMobileGlide();
    resetMobileTouch();
    resetMobileWheel();
    if (!isMobile() && !breakpointFallbackActive) setMobilePlateActive(false);
    if (motionOn && isMobile()) {
      paintMobileRest(mobileStopIndexAtProgress(progressCurrent));
      warmMobileBeatVideos();
      startRenderLoop();
    }
    sampleScroll();
  }

  function onMobileBreakpointChange(event) {
    beginBreakpointSwap(!!event.matches);
  }

  /* One deliberate keypress advances one locked portfolio world. */
  document.addEventListener("keydown", function (e) {
    if (isInteractiveOrigin(e)) return;
    var isSpace = e.key === " " || e.key === "Spacebar";
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "PageDown" && e.key !== "PageUp" && e.key !== "Home" && e.key !== "End" && !isSpace) return;
    if (!passage || !viewport || !portfolioOwnsViewport()) return;
    e.preventDefault();
    if (e.repeat) return;
    if (mobileNavigationBusy()) return;
    var direction = e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Home" || (isSpace && e.shiftKey) ? -1 : 1;
    advanceMobileStop(direction);
  });

  if (motionToggle) {
    motionToggle.addEventListener("click", function () {
      applyMotionPreference(!motionOn, true);
    });
  }

  window.addEventListener("jw-motion-change", function (event) {
    if (!event.detail || event.detail.source === "portfolio") return;
    if (motionOn !== !!event.detail.on) applyMotionPreference(!!event.detail.on, false);
  });

  window.addEventListener("scroll", function () {
    sampleScroll();
  }, { passive: true });

  window.addEventListener("resize", onMobileViewportChange);

  window.addEventListener("pageshow", function () {
    cancelMobileGlide();
    resetMobileTouch();
    resetMobileWheel();
    if (isMobile() !== breakpointModeMobile) {
      beginBreakpointSwap(isMobile());
      return;
    }
    if (motionOn && isMobile()) warmMobileBeatVideos();
    sampleScroll();
  });

  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", onMobileBreakpointChange);
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(onMobileBreakpointChange);
  }

  window.addEventListener("touchstart", onMobileTouchStart, { passive: true });
  window.addEventListener("touchmove", onMobileTouchMove, { passive: false });
  window.addEventListener("touchend", onMobileTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onMobileTouchCancel, { passive: true });
  window.addEventListener("wheel", onMobileWheel, { passive: false });

  bindPosterFallback(generationsVideo, generationsPoster);
  bindPosterFallback(painaVideo, painaPoster);
  bindPosterFallback(studioVideo, document.getElementById("portfolio-rana-poster"));
  bindPosterFallback(ringVideo, document.getElementById("portfolio-ring-poster"));
  bindPosterFallback(inkVideo, document.getElementById("portfolio-prorok-poster"));
  bindVideoReadiness(generationsVideo);
  bindVideoReadiness(painaVideo);
  bindVideoReadiness(studioVideo);
  bindVideoReadiness(ringVideo);
  bindVideoReadiness(inkVideo);
  bindImageReadiness(generationsPoster);
  bindImageReadiness(painaPoster);
  bindImageReadiness(ringPoster);
  bindImageReadiness(prorokPortrait);
  bindImageReadiness(terminalReturn);

  /* Enter from homepage exit: a brief veil, then Generations is already moving. */
  var enterFromHome = root.getAttribute("data-work-enter") === "1";
  if (enterFromHome && motionOn) {
    root.style.setProperty("--portfolio-enter-veil", "1");
    window.requestAnimationFrame(function () {
      root.style.transition = "--portfolio-enter-veil 0.01s linear";
      var start = performance.now();
      function fade(now) {
        var t = clamp((now - start) / 480, 0, 1);
        root.style.setProperty("--portfolio-enter-veil", (1 - smoothstep(t)).toFixed(4));
        if (t < 1) requestAnimationFrame(fade);
        else root.style.setProperty("--portfolio-enter-veil", "0");
      }
      requestAnimationFrame(fade);
    });
  } else {
    root.style.setProperty("--portfolio-enter-veil", "0");
  }

  var noJsRoute = document.getElementById("portfolio-no-js-route");
  if (noJsRoute && noJsRoute.parentNode) noJsRoute.parentNode.removeChild(noJsRoute);

  applyMotionPreference(motionOn, false);
  progressCurrent = progressTarget = computeProgress();
  paint(progressCurrent);
  if (motionOn) {
    armVideos();
    if (isMobile()) warmMobileBeatVideos();
    syncVideos(progressCurrent);
  }

  window.ROOT_PORTFOLIO_PASSAGE = {
    get progress() { return progressCurrent; },
    get target() { return progressTarget; },
    get motion() { return motionOn; },
    get mobile() { return isMobile(); },
    get mobileStopIndex() { return mobileStopIndexAtProgress(progressCurrent); },
    get mobileStop() { return MOBILE_STOPS[mobileStopIndexAtProgress(progressCurrent)].id; },
    get mobileGliding() { return mobileGlideLocked; },
    get mobileWaiting() { return mobileWaiting; },
    get mobileRequestedStop() { return mobileRequestedStopId; },
    get mobileDestination() { return mobileDestinationId; },
    get mobilePlateActive() { return mobilePlateActive; },
    get mobilePlateSize() { return { width: mobilePlateWidth, height: mobilePlateHeight }; },
    get mobileContainGeometry() { return lastMobileContainGeometry; },
    get breakpointSwapActive() { return breakpointSwapActive; },
    get breakpointFallbackActive() { return breakpointFallbackActive; },
    get breakpointFallbackOwnerIndex() { return breakpointFallbackOwnerIndex; },
    get breakpointFallbackOwner() {
      return breakpointFallbackOwnerIndex >= 0 && MOBILE_STOPS[breakpointFallbackOwnerIndex]
        ? MOBILE_STOPS[breakpointFallbackOwnerIndex].id
        : "";
    },
    get navigationBusy() { return mobileNavigationBusy(); },
    get breakpointMode() { return breakpointModeMobile ? "mobile" : "desktop"; },
    get breakpointTarget() { return breakpointSwapTargetMobile ? "mobile" : "desktop"; },
    get foodSources() {
      return {
        generations: { src: generationsVideo.currentSrc, width: generationsVideo.videoWidth, height: generationsVideo.videoHeight },
        paina: { src: painaVideo.currentSrc, width: painaVideo.videoWidth, height: painaVideo.videoHeight }
      };
    },
    get mobileTransition() {
      return mobileTransition
        ? { fromIndex: mobileTransition.fromIndex, toIndex: mobileTransition.toIndex, t: mobileTransition.t }
        : null;
    },
    get videoReadiness() {
      return {
        generations: videoHasRenderableFrame(generationsVideo),
        paina: videoHasRenderableFrame(painaVideo),
        studio: videoHasRenderableFrame(studioVideo),
        ring: videoHasRenderableFrame(ringVideo),
        ink: videoHasRenderableFrame(inkVideo)
      };
    },
    tau: TAU,
    still: STILL,
    map: MAP,
    stops: MOBILE_STOPS,
    goMobileStop: scrollToMobileStopIndex,
    sceneValuesForRest: mobileSceneValuesForRest,
    sceneValuesForTransition: mobileSceneValuesForTransition,
    authoritativeIndex: mobileAuthoritativeIndex,
    tuning: {
      mobileBreakpointPx: MOBILE_BREAKPOINT_PX,
      swipeThresholdPx: MOBILE_SWIPE_THRESHOLD_PX,
      wheelThresholdPx: MOBILE_WHEEL_THRESHOLD_PX,
      wheelIdleMs: MOBILE_WHEEL_IDLE_MS,
      glideMs: MOBILE_SECTION_GLIDE_MS,
      readinessMs: MOBILE_READINESS_MS,
      cutPhase: MOBILE_CUT_PHASE,
      copyOutEnd: MOBILE_COPY_OUT_END,
      copyInStart: MOBILE_COPY_IN_START
    }
  };
})();
