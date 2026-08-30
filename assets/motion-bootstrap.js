(function () {
  "use strict";

  var root = document.documentElement;
  var media = window.matchMedia("(prefers-reduced-motion: reduce)");
  var query = "";
  var stored = "";
  try {
    var requested = new URLSearchParams(window.location.search).get("motion");
    if (requested === "on" || requested === "off") query = requested;
    var saved = localStorage.getItem("jw-motion");
    if (saved === "on" || saved === "off") stored = saved;
  } catch (error) {}

  var explicit = !!(query || stored);
  var current = query || stored || (media.matches ? "off" : "on");

  function publish(value, source, persist) {
    current = value === "off" ? "off" : "on";
    root.setAttribute("data-motion", current);
    root.setAttribute("data-motion-source", source);
    if (persist) {
      explicit = true;
      stored = current;
      try { localStorage.setItem("jw-motion", current); } catch (error) {}
      root.setAttribute("data-motion-user", current);
    }
    window.dispatchEvent(new CustomEvent("jw-motion-change", {
      detail: { on: current === "on", source: source }
    }));
  }

  root.setAttribute("data-motion", current);
  root.setAttribute("data-motion-source", query ? "query" : stored ? "stored" : "os");
  if (stored) root.setAttribute("data-motion-user", stored);

  window.JW_MOTION = {
    get value() { return current; },
    get explicit() { return explicit; },
    set: function (on, source, persist) {
      publish(on ? "on" : "off", source || "control", persist !== false);
    }
  };

  function onPreferenceChange(event) {
    if (explicit) return;
    publish(event.matches ? "off" : "on", "os", false);
  }
  if (typeof media.addEventListener === "function") media.addEventListener("change", onPreferenceChange);
  else if (typeof media.addListener === "function") media.addListener(onPreferenceChange);
})();
