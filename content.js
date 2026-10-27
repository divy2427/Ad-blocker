(() => {
  "use strict";
  const DEFAULTS = { enabled:true, adaptiveSpeed:true, autoMute:true, autoSkip:true, targetSeconds:0.15, maxSpeed:256 };
  let settings = {...DEFAULTS}, adWasActive = false, timer = null, observer = null, poller = null;
  const saved = new WeakMap();
  let lastSkip = 0, lastRateAttempt = 0;

  const AD_MARKERS = [
    ".ytp-ad-player-overlay", ".ytp-ad-text", ".ytp-ad-preview-container",
    ".ytp-ad-skip-button", ".ytp-ad-skip-button-modern", ".ytp-skip-ad-button", ".ytp-skip-ad-button-modern", ".ytp-ad-overlay-container"
  ];
  const SKIP_SELECTORS = [
    ".ytp-skip-ad-button:not([disabled])",
    ".ytp-skip-ad-button-modern:not([disabled])",
    ".ytp-skip-ad-button-container button:not([disabled])",
    ".ytp-ad-skip-button:not([disabled])",
    ".ytp-ad-skip-button-modern:not([disabled])",
    ".ytp-ad-skip-button-container button:not([disabled])",
    "button[aria-label*='Skip ad' i]:not([disabled])",
    "button[aria-label*='Skip ads' i]:not([disabled])",
    "button[title*='Skip ad' i]:not([disabled])",
    "[role='button'][aria-label*='Skip ad' i]:not([aria-disabled='true'])",
    "[role='button'][title*='Skip ad' i]:not([aria-disabled='true'])"
  ];

  function visible(el) {
    if (!el) return false;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) !== 0 && r.width > 0 && r.height > 0;
  }
  function playerRoots() {
    return [...new Set([
      document.querySelector("#movie_player"),
      document.querySelector(".html5-video-player"),
      document.querySelector("ytmusic-player"),
      document.querySelector("ytmusic-player-page")
    ].filter(Boolean))];
  }
  function isAd() {
    // YouTube's explicit player state is the strongest signal.
    for (const root of playerRoots()) {
      const cls = typeof root.className === "string" ? root.className : (root.getAttribute("class") || "");
      if (/\bad-showing\b|\bad-interrupting\b/i.test(cls) || root.matches(".ad-showing,.ad-interrupting")) return true;
    }
    // Fall back to visible ad-specific UI; do not treat the generic .video-ads container alone as proof.
    for (const sel of AD_MARKERS) {
      for (const el of document.querySelectorAll(sel)) if (visible(el)) return true;
    }
    return false;
  }
  function mediaItems() {
    // YouTube Music may place the active media element outside a queried player root.
    return [...document.querySelectorAll("video,audio")];
  }
  function save(m) {
    if (!saved.has(m)) saved.set(m, { rate:m.playbackRate || 1, muted:!!m.muted, volume:Number.isFinite(m.volume) ? m.volume : 1 });
  }
  function speed(m) {
    if (!settings.adaptiveSpeed || !m.isConnected) return;
    save(m);
    const remaining = Number.isFinite(m.duration) && m.duration > 0 && Number.isFinite(m.currentTime)
      ? Math.max(0.1, m.duration - m.currentTime) : null;
    const target = Math.max(0.15, Math.min(1.5, Number(settings.targetSeconds) || 0.15));
    const cap = Math.max(1, Math.min(256, Number(settings.maxSpeed) || 16));
    const desired = remaining === null ? Math.min(cap, 16) : Math.max(1, Math.min(cap, remaining / target));
    // Avoid repeated writes when the browser has accepted the rate; retry if the player resets it.
    if (Math.abs((m.playbackRate || 1) - desired) < 0.05) return;
    try { m.playbackRate = desired; lastRateAttempt = Date.now(); } catch (_) {}
  }
  function mute(m) {
    if (!settings.autoMute) return;
    save(m);
    try { m.muted = true; } catch (_) {}
  }
  function skip() {
    if (!settings.autoSkip || Date.now() - lastSkip < 300) return;
    for (const sel of SKIP_SELECTORS) {
      for (const button of document.querySelectorAll(sel)) {
        if (!visible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") continue;
        // Only click an actual visible skip control; never attempt to bypass an unskippable ad.
        lastSkip = Date.now();
        try { button.click(); } catch (_) {}
        return;
      }
    }
  }
  function restore() {
    for (const m of mediaItems()) {
      const prior = saved.get(m);
      if (!prior) continue;
      try { m.playbackRate = prior.rate; } catch (_) {}
      try { m.muted = prior.muted; } catch (_) {}
      try { m.volume = prior.volume; } catch (_) {}
      saved.delete(m);
    }
  }
  function scan() {
    if (!settings.enabled) {
      if (adWasActive) restore();
      adWasActive = false;
      return;
    }
    const active = isAd();
    // A visible, explicit skip control is sufficient evidence to try skipping, even if ad-state detection missed it.
    skip();
    if (active) {
      for (const media of mediaItems()) { speed(media); mute(media); }
    } else if (adWasActive) {
      restore();
    }
    adWasActive = active;
  }
  function schedule() {
    if (timer !== null) return;
    timer = setTimeout(() => { timer = null; scan(); }, 120);
  }
  function apply(next) {
    // Keep unchanged preferences when storage reports only the keys that changed.
    settings = {...settings, ...next};
    if (!settings.enabled) { restore(); adWasActive = false; }
    schedule();
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" && area !== "local") return;
    const next = {};
    for (const key of Object.keys(DEFAULTS)) {
      if (changes[key]) next[key] = changes[key].newValue === undefined ? DEFAULTS[key] : changes[key].newValue;
    }
    apply(next);
  });
  chrome.storage.sync.get(DEFAULTS, stored => {
    apply(stored);
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:["class","aria-label","title","disabled","style"]});
    for (const eventName of ["play","playing","loadedmetadata","timeupdate","durationchange","ratechange","emptied"]) {
      document.addEventListener(eventName, schedule, true);
    }
    // Some player builds overwrite playbackRate after it is set; periodically re-check during an ad.
    // Keep checking for a visible skip button even if YouTube Music does not expose its ad state reliably.
    poller = setInterval(() => { if (settings.enabled) scan(); }, 300);
    schedule();
  });
})();
