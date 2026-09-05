(function () {
  "use strict";

  function init() {
    var root = document.documentElement;
    var reading = document.querySelector("#process-no-js-route, #no-js-route");
    var visual = document.querySelector("#site-content, #passage");
    var motion = window.JW_MOTION;
    var controls = [];
    var shortScreen = window.matchMedia("(max-width:900px) and (max-height:36rem)");
    var explicitReading = new URLSearchParams(location.search).get("view") === "read";
    var savedMotion = motion && motion.value === "on";
    var inReadingView = false;
    var overflowReading = false;

    function updateControls() {
      controls.forEach(function (button) {
        button.textContent = motion.value === "on" ? "Pause motion" : "Resume motion";
      });
    }

    if (motion && document.querySelector("video")) {
      document.querySelectorAll(".portfolio-header-tools, #process-journey .header-tools, #passage .header-tools, .case-header nav").forEach(function (nav) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "jw-pause-motion";
        button.addEventListener("click", function () {
          var url = new URL(location.href);
          url.searchParams.delete("motion");
          history.replaceState(history.state, "", url.href);
          motion.set(motion.value !== "on", "visitor", true);
        });
        nav.appendChild(button);
        controls.push(button);
      });
      window.addEventListener("jw-motion-change", updateControls);
      updateControls();
    }

    function syncSvgMotion() {
      if (!motion) return;
      document.querySelectorAll("svg").forEach(function (svg) {
        var method = motion.value === "off" ? "pauseAnimations" : "unpauseAnimations";
        if (typeof svg[method] === "function") svg[method]();
      });
    }
    window.addEventListener("jw-motion-change", syncSvgMotion);
    syncSvgMotion();

    var main = visual || document.querySelector("main");
    if (main) {
      if (!main.id) main.id = "site-content";
      main.tabIndex = -1;
      var skip = document.createElement("a");
      skip.className = "jw-skip-link";
      skip.href = "#" + main.id;
      skip.textContent = "Skip to content";
      document.body.insertBefore(skip, document.body.firstChild);
      if (reading) {
        var readLink = document.createElement("a");
        var readUrl = new URL(location.href);
        readUrl.searchParams.set("view", "read");
        readUrl.hash = "";
        readLink.href = readUrl.href;
        readLink.className = "jw-skip-link";
        readLink.textContent = "Read page without animation";
        skip.after(readLink);
        if (explicitReading) {
          var returnLink = document.createElement("a");
          readUrl.searchParams.delete("view");
          returnLink.href = readUrl.href;
          returnLink.textContent = "Back to the visual portfolio";
          var returnLine = document.createElement("p");
          returnLine.appendChild(returnLink);
          reading.querySelector(".no-js-stack").prepend(returnLine);
        }
      }
    }

    function applyReadingView() {
      if (!reading || !visual) return;
      var on = explicitReading || shortScreen.matches || overflowReading;
      if (on === inReadingView) return;
      if (on) savedMotion = motion && motion.value === "on";
      inReadingView = on;
      root.classList.toggle("jw-readable", on);
      visual.inert = on;
      reading.setAttribute("aria-label", "Portfolio and services");
      reading.tabIndex = -1;
      if (motion) motion.set(on ? false : savedMotion, "reading");
      if (skip) skip.href = "#" + (on ? reading.id : main.id);
      window.scrollTo(0, 0);
    }
    shortScreen.addEventListener("change", applyReadingView);
    applyReadingView();
    if (reading && visual && typeof ResizeObserver === "function") {
      var copy = [...document.querySelectorAll(".portfolio-scene-copy, .scene-copy")];
      function checkFit() {
        if (explicitReading) return;
        var wasReading = inReadingView;
        if (wasReading) root.classList.remove("jw-readable");
        var height = window.innerHeight;
        var oversized = copy.some(function (el) {
          if (el.className.indexOf("--terminal") !== -1) {
            var parts = el.querySelectorAll(".portfolio-terminal-book, .portfolio-terminal-process, .terminal-book, .terminal-process");
            return [...parts].reduce(function (sum,part) { return sum + part.offsetHeight; }, 0) > height - 128;
          }
          return el.offsetHeight > height - 112 || el.scrollWidth > el.clientWidth + 1;
        });
        if (wasReading) root.classList.add("jw-readable");
        overflowReading = oversized;
        applyReadingView();
      }
      var observer = new ResizeObserver(checkFit);
      copy.forEach(function (el) { observer.observe(el); });
      observer.observe(reading);
      window.addEventListener("resize", checkFit);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
