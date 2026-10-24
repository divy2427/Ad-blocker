(() => {
  if (window.__musicAdHelperSafe) return;
  window.__musicAdHelperSafe = true;

  const PANEL_ID = "music-ad-helper-panel";
  let timer;

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function check() {
    if (!document.body) return;

    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.style.cssText =
        "position:fixed;top:90px;right:15px;z-index:999999;" +
        "background:#171717;color:white;padding:12px;" +
        "border:1px solid #555;border-radius:8px;" +
        "font:13px Arial;max-width:280px;pointer-events:none;";
      document.body.appendChild(panel);
    }

    const video = document.querySelector("video");
    const ad = !!document.querySelector(
      ".ytp-ad-player-overlay, .ytp-ad-text"
    );

    panel.textContent =
      "Music Ad Helper — Safe Mode\n" +
      "Playback: " +
      (!video ? "No video" : video.paused ? "Paused" : "Playing") +
      "\nAd indicator: " + (ad ? "Detected" : "Not detected") +
      "\nAutomatic actions: Off";
  }

  check();
  timer = setInterval(check, 2000);

  window.__musicAdHelperSafeStop = () => {
    clearInterval(timer);
    document.getElementById(PANEL_ID)?.remove();
    delete window.__musicAdHelperSafe;
  };
})();
