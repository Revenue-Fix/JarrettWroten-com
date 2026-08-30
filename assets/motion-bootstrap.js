(function () {
  "use strict";

  var root = document.documentElement;
  var media = window.matchMedia("(prefers-reduced-motion: reduce)");
  var query = "";
  try {
    var requested = new URLSearchParams(window.location.search).get("motion");
    if (requested === "on" || requested === "off") query = requested;
    localStorage.removeItem("jw-motion");
  } catch (error) {}

  var explicit = !!query;
  var current = query || (media.matches ? "off" : "on");

  function publish(value, source) {
    current = value === "off" ? "off" : "on";
    root.setAttribute("data-motion", current);
    root.setAttribute("data-motion-source", source);
    window.dispatchEvent(new CustomEvent("jw-motion-change", {
      detail: { on: current === "on", source: source }
    }));
  }

  root.setAttribute("data-motion", current);
  root.setAttribute("data-motion-source", query ? "query" : "os");

  window.JW_MOTION = {
    get value() { return current; },
    get explicit() { return explicit; },
    set: function (on, source) {
      publish(on ? "on" : "off", source || "runtime");
    }
  };

  function onPreferenceChange(event) {
    if (explicit) return;
    publish(event.matches ? "off" : "on", "os");
  }
  if (typeof media.addEventListener === "function") media.addEventListener("change", onPreferenceChange);
  else if (typeof media.addListener === "function") media.addListener(onPreferenceChange);
})();
