(() => {
  if (window.__spotifyAdHelperLoaded) return;
  window.__spotifyAdHelperLoaded = true;

  const PANEL_ID = "spotify-ad-helper-panel";
  const CHECK_INTERVAL = 1000;

  const SELECTORS = {
    title: [
      '[data-testid="context-item-info-title"]',
      '[data-testid="context-item-link"]'
    ],
    artist: [
      '[data-testid="context-item-info-artist"]'
    ],
    ad: '[data-testid="context-item-info-ad-subtitle"]',
    next: 'button[data-testid="control-button-skip-forward"]',
    playPause: 'button[data-testid="control-button-playpause"]',
    volume: 'button[data-testid="volume-bar-toggle"]'
  };

  let timer = null;
  let previousAd = false;
  let skipStatus = "Waiting for player";
  let note = "Monitoring Spotify controls.";

  function readText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = node?.textContent?.trim();

      if (value) return value;
    }

    return "";
  }

  function isVisible(node) {
    if (!node) return false;

    const rect = node.getBoundingClientRect();

    return rect.width > 0 &&
      rect.height > 0 &&
      getComputedStyle(node).visibility !== "hidden";
  }

  function getVisibleAd() {
    return [...document.querySelectorAll(SELECTORS.ad)]
      .some(node => {
        const text = node.textContent?.trim() || "";

        return isVisible(node) &&
          /^advertisement\b/i.test(text);
      });
  }

  function getButtonState(selector) {
    const button = document.querySelector(selector);

    if (!button) return "Not found";
    if (!isVisible(button)) return "Hidden";

    return button.disabled ||
      button.getAttribute("aria-disabled") === "true"
      ? "Disabled"
      : "Enabled";
  }

  function getPlaybackState() {
    const button = document.querySelector(SELECTORS.playPause);
    const label = button?.getAttribute("aria-label") || "";

    if (/pause/i.test(label)) return "Playing";
    if (/play/i.test(label)) return "Paused";

    return "Unknown";
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.setAttribute("role", "status");

    const fields = [
      ["sah-heading", "Spotify Ad Helper"],
      ["sah-status", "Checking player…"],
      ["sah-meta", ""],
      ["sah-playback", ""],
      ["sah-ad-status", ""],
      ["sah-controls", ""],
      ["sah-skip-status", ""],
      ["sah-note", ""],
      ["sah-updated", ""]
    ];

    for (const [className, value] of fields) {
      const element = document.createElement("div");
      element.className = className;
      element.textContent = value;
      panel.appendChild(element);
    }

    (document.body || document.documentElement)
      .appendChild(panel);

    return panel;
  }

  function updatePanel(data) {
    const panel = ensurePanel();

    panel.querySelector(".sah-status").textContent =
      data.title
        ? "Player metadata detected"
        : "Waiting for metadata";

    panel.querySelector(".sah-meta").textContent =
      [data.title, data.artist].filter(Boolean).join(" — ") ||
      "Track details unavailable";

    panel.querySelector(".sah-playback").textContent =
      `Playback: ${data.playback}`;

    panel.querySelector(".sah-ad-status").textContent =
      `Ad status: ${data.adStatus}`;

    panel.querySelector(".sah-controls").textContent =
      `Controls — Play/Pause: ${data.playPauseState} | ` +
      `Next: ${data.nextState} | Volume: ${data.volumeState}`;

    panel.querySelector(".sah-skip-status").textContent =
      `Skip status: ${data.skipStatus}`;

    panel.querySelector(".sah-note").textContent = data.note;

    panel.querySelector(".sah-updated").textContent =
      `Last checked: ${data.observedAt}`;
  }

  function checkPlayer() {
    if (!document.body) return;

    const adDetected = getVisibleAd();
    const title = readText(SELECTORS.title);
    const artist = readText(SELECTORS.artist);

    const playPauseState =
      getButtonState(SELECTORS.playPause);

    const nextState =
      getButtonState(SELECTORS.next);

    const volumeState =
      getButtonState(SELECTORS.volume);

    const playback = getPlaybackState();

    if (adDetected) {
      skipStatus = nextState === "Disabled"
        ? "Skip unavailable"
        : nextState === "Enabled"
          ? "Skip not attempted"
          : "Skip control not available";

      note = nextState === "Disabled"
        ? "Spotify has disabled Next. No click was attempted."
        : "Monitoring the ad and playback state. No automatic clicks.";

    } else if (previousAd) {
      skipStatus = "Ad label disappeared";
      note = "The visible ad label disappeared; this alone does not prove a skip.";

    } else {
      skipStatus = "No ad detected";
      note = "No visible advertisement label was found.";
    }

    previousAd = adDetected;

    updatePanel({
      title,
      artist,
      playback,
      adStatus: adDetected
        ? "Possible advertisement (text match)"
        : "No visible ad label",
      playPauseState,
      nextState,
      volumeState,
      skipStatus,
      note,
      observedAt: new Date().toLocaleTimeString()
    });
  }

  function start() {
    if (timer) clearInterval(timer);

    checkPlayer();
    timer = setInterval(checkPlayer, CHECK_INTERVAL);
  }

  start();
})();
