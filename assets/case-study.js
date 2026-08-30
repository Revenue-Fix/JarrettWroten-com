(function () {
  "use strict";

  var root = document.documentElement;
  var button = document.querySelector(".case-motion-toggle");
  var videos = document.querySelectorAll("video");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var stored = null;
  try { stored = localStorage.getItem("jw-motion"); } catch (e) {}
  var motionOn = stored === "on" ? true : stored === "off" ? false : !reduce.matches;

  function setMotionUI() {
    if (!button) return;
    button.setAttribute("aria-pressed", motionOn ? "true" : "false");
    button.textContent = motionOn ? "Motion on" : "Motion off";
    button.setAttribute(
      "aria-label",
      motionOn ? "Motion is on. Activate to turn motion off." : "Motion is off. Activate to turn motion on."
    );
  }

  function applyMotion(on, persist) {
    motionOn = !!on;
    root.setAttribute("data-case-motion", motionOn ? "on" : "off");
    setMotionUI();
    for (var i = 0; i < videos.length; i++) {
      if (motionOn) {
        var playing = videos[i].play();
        if (playing && typeof playing.catch === "function") playing.catch(function () {});
      } else {
        videos[i].pause();
      }
    }
    if (persist) {
      try { localStorage.setItem("jw-motion", motionOn ? "on" : "off"); } catch (e) {}
    }
  }

  if (button) {
    button.addEventListener("click", function () {
      applyMotion(!motionOn, true);
    });
  }

  function onReducedMotionChange(event) {
    if (stored === "on" || stored === "off") return;
    applyMotion(!event.matches, false);
  }
  if (typeof reduce.addEventListener === "function") reduce.addEventListener("change", onReducedMotionChange);
  else if (typeof reduce.addListener === "function") reduce.addListener(onReducedMotionChange);

  applyMotion(motionOn, false);
})();
