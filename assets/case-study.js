(function () {
  "use strict";

  var root = document.documentElement;
  var videos = document.querySelectorAll("video");
  var motionOn = root.getAttribute("data-motion") !== "off";

  function applyMotion(on) {
    motionOn = !!on;
    root.setAttribute("data-case-motion", motionOn ? "on" : "off");
    for (var i = 0; i < videos.length; i++) {
      if (motionOn) {
        var playing = videos[i].play();
        if (playing && typeof playing.catch === "function") playing.catch(function () {});
      } else {
        videos[i].pause();
      }
    }
  }

  window.addEventListener("jw-motion-change", function (event) {
    applyMotion(!!(event.detail && event.detail.on));
  });

  applyMotion(motionOn);
})();
