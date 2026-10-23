(() => {
  if (window.__spotifyAdHelperLoaded) return;
  window.__spotifyAdHelperLoaded = true;

  const PANEL_ID = "spotify-ad-helper-panel";
  const CHECK_INTERVAL = 1000;
  const SKIP_COOLDOWN = 5000;

  const SELECTORS = {
    title: [
      '[data-testid="context-item-info-title"]',
      '[data-testid="context-item-link"]'
    ],
    artist: [
      '[data-testid="context-item-info-artist"]'
    ],
    ad: '[data-testid="context-item-info-ad-subtitle"]',
    next: [
      'button[data-testid="control-button-skip-forward"]',
      'button[aria-label*="Next"]'
    ],
    playPause: 'button[data-testid="control-button-playpause"]'
  };

  let lastAttempt = 0;
  let lastAdState = false;
  let timer = null;

  function readText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = node?.textContent?.trim();
      if (value) return value;
    }
    return "";
  }

  function getVisibleAd() {
    return [...document.querySelectorAll(SELECTORS.ad)].some(node => {
      const text = node.textContent?.trim() || "";
      const rect = node.getBoundingClientRect();

      return rect.width > 0 &&
        rect.height > 0 &&
        /^advertisement\b/i.test(text);
    });
  }

  function getNextButton() {
    for (const selector of SELECTORS.next) {
      const button = document.querySelector(selector);
      if (button) return button;
    }
    return null;
  }

  function isButtonEnabled(button) {
    if (!button) return false;

    return !button.disabled &&
      button.getAttribute("aria-disabled") !== "true" &&
      !button.classList.contains("disabled");
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

    (document.body || document.documentElement).appendChild(panel);
    return panel;
  }

  function updatePanel(data) {
    const panel = ensurePanel();

    panel.querySelector(".sah-status").textContent =
      data.title ? "Player metadata detected" : "Waiting for metadata";

    panel.querySelector(".sah-meta").textContent =
      [data.title, data.artist].filter(Boolean).join(" — ") ||
      "Track details unavailable";

    panel.querySelector(".sah-playback").textContent =
      `Playback: ${data.playback}`;

    panel.querySelector(".sah-ad-status").textContent =
      `Ad status: ${data.adStatus}`;

    panel.querySelector(".sah-skip-status").textContent =
      `Skip test: ${data.skipStatus}`;

    panel.querySelector(".sah-note").textContent = data.note;
    panel.querySelector(".sah-updated").textContent =
      `Last checked: ${data.observedAt}`;
  }

  function checkPlayer() {
    if (!document.body) return;

    const adDetected = getVisibleAd();
    const nextButton = getNextButton();
    const enabled = isButtonEnabled(nextButton);
    const title = readText(SELECTORS.title);
    const artist = readText(SELECTORS.artist);
    const playPause = document.querySelector(SELECTORS.playPause);
    const label = playPause?.getAttribute("aria-label") || "";

    const playback = /pause/i.test(label)
      ? "Playing"
      : /play/i.test(label)
        ? "Paused"
        : "Unknown";

    let skipStatus = "Not attempted";
    let note = "Waiting for player state.";

    if (adDetected) {
      if (!lastAdState) {
        lastAttempt = 0;
      }

      if (!nextButton) {
        skipStatus = "Next button not found";
        note = "Spotify's Next control could not be located.";
      } else if (!enabled) {
        skipStatus = "Unavailable: button disabled";
        note = "Spotify has disabled the Next control. No click was attempted.";
      } else if (Date.now() - lastAttempt >= SKIP_COOLDOWN) {
        lastAttempt = Date.now();

        // Test only the normal, enabled player control.
        nextButton.click();

        skipStatus = "Click attempted";
        note = "A click was attempted on the enabled Next control. Verify whether playback changed.";
      } else {
        skipStatus = "Cooldown";
        note = "Waiting before another skip attempt.";
      }
    } else {
      skipStatus = "No ad detected";
      note = "No visible Spotify advertisement label was found.";
      lastAttempt = 0;
    }

    lastAdState = adDetected;

    updatePanel({
      title,
      artist,
      playback,
      adStatus: adDetected
        ? "Possible advertisement (text match)"
        : "Unconfirmed",
      skipStatus,
      note,
      observedAt: new Date().toLocaleTimeString()
    });
  }

  function start() {
    checkPlayer();

    if (timer) clearInterval(timer);
    timer = setInterval(checkPlayer, CHECK_INTERVAL);
  }

  start();
})();
