(function () {
  "use strict";

  var root = document.documentElement;
  var query = "";
  var stored = "";
  var storageKey = "jw-motion-choice-v1";
  try {
    var requested = new URLSearchParams(window.location.search).get("motion");
    if (requested === "on" || requested === "off") query = requested;
    localStorage.removeItem("jw-motion");
    stored = localStorage.getItem(storageKey) || "";
  } catch (error) {}

  var explicit = !!query;
  var current = query || (stored === "off" ? "off" : "on");

  function publish(value, source) {
    current = value === "off" ? "off" : "on";
    root.setAttribute("data-motion", current);
    root.setAttribute("data-motion-source", source);
    window.dispatchEvent(new CustomEvent("jw-motion-change", {
      detail: { on: current === "on", source: source }
    }));
  }

  root.setAttribute("data-motion", current);
  root.setAttribute("data-motion-source", query ? "query" : stored ? "stored" : "default");

  window.JW_MOTION = {
    get value() { return current; },
    get explicit() { return explicit; },
    set: function (on, source, persist) {
      if (persist) {
        explicit = true;
        try { localStorage.setItem(storageKey, on ? "on" : "off"); } catch (error) {}
      }
      publish(on ? "on" : "off", source || "runtime");
    }
  };
})();
