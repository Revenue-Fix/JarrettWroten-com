(function () {
  "use strict";

  var root = document.documentElement;
  var videos = document.querySelectorAll("video");
  var motionOn = root.getAttribute("data-motion") !== "off";
  var scheduled = 0;
  var nearMargin = 240;

  function mediaState(video) {
    var rect = video.getBoundingClientRect();
    var style = window.getComputedStyle(video);
    var rendered = rect.width > 0 && rect.height > 0 && style.display !== "none" &&
      style.visibility !== "hidden" && style.visibility !== "collapse";
    var available = motionOn && !document.hidden && rendered;
    return {
      rendered: rendered,
      near: available && rect.bottom > -nearMargin && rect.top < window.innerHeight + nearMargin &&
        rect.right > 0 && rect.left < window.innerWidth,
      visible: available && rect.bottom > 0 && rect.top < window.innerHeight &&
        rect.right > 0 && rect.left < window.innerWidth
    };
  }

  function sourceFor(video) {
    var sources = video.querySelectorAll("source[data-src]");
    for (var i = 0; i < sources.length; i++) {
      var media = sources[i].getAttribute("media");
      if (!media || window.matchMedia(media).matches) return sources[i].getAttribute("data-src");
    }
    return "";
  }

  function syncVideos() {
    scheduled = 0;
    for (var i = 0; i < videos.length; i++) {
      var video = videos[i];
      var state = mediaState(video);
      if (!state.visible) video.pause();
      // Disconnect a responsive hidden carrier, including any outstanding media load.
      if (!state.rendered && video.hasAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
      if (!state.near) continue;
      var source = sourceFor(video);
      if (source && video.getAttribute("src") !== source) {
        video.src = source;
        video.preload = "auto";
        video.load();
      }
      if (source && state.visible && video.paused && !video.ended) playVideo(video);
    }
  }

  function playVideo(video) {
    var playing = video.play();
    if (playing && typeof playing.then === "function") {
      playing.then(function () {
        if (!mediaState(video).visible) video.pause();
      }, function () {});
    }
  }

  function scheduleSync() {
    if (!scheduled) scheduled = window.requestAnimationFrame(syncVideos);
  }

  function applyMotion(on) {
    motionOn = !!on;
    root.setAttribute("data-case-motion", motionOn ? "on" : "off");
    syncVideos();
  }

  window.addEventListener("jw-motion-change", function (event) {
    applyMotion(!!(event.detail && event.detail.on));
  });
  window.addEventListener("scroll", scheduleSync, { passive: true });
  window.addEventListener("resize", scheduleSync);
  window.addEventListener("pageshow", scheduleSync);
  document.addEventListener("visibilitychange", syncVideos);

  if (typeof IntersectionObserver === "function") {
    var observer = new IntersectionObserver(scheduleSync, { rootMargin: nearMargin + "px 0px" });
    for (var i = 0; i < videos.length; i++) observer.observe(videos[i]);
  }

  applyMotion(motionOn);
})();
