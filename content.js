(() => {
  if (window.__spotifyAdHelperLoaded) return;
  window.__spotifyAdHelperLoaded = true;

  const PANEL_ID = "spotify-ad-helper-panel";
  const CHECK_INTERVAL = 1000;
  const VERIFY_AFTER_MS = 4000;

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
    playPause: 'button[data-testid="control-button-playpause"]'
  };

  let timer = null;
  let previousAd = false;
  let pendingTest = null;
  let skipStatus = "Not tested";
  let note = "Waiting for a visible advertisement.";

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
    const title = readText(SELECTORS.title);
    const artist = readText(SELECTORS.artist);
    const nextButton = document.querySelector(SELECTORS.next);
    const playPause = document.querySelector(SELECTORS.playPause);
    const label = playPause?.getAttribute("aria-label") || "";

    const playback = /pause/i.test(label)
      ? "Playing"
      : /play/i.test(label)
        ? "Paused"
        : "Unknown";

    // Verify the result of a single manual test without clicking again.
    if (pendingTest && Date.now() >= pendingTest.verifyAt) {
      const currentSignature = `${title}|${artist}`;
      const adEnded = !adDetected;
      const trackChanged =
        currentSignature !== pendingTest.signature &&
        currentSignature !== "|";

      if (adEnded || trackChanged) {
        skipStatus = "Player state changed";
        note = "The ad label or track details changed. This does not prove the ad was skipped.";
      } else {
        skipStatus = "Skip unconfirmed";
        note = "No visible ad or track change was detected after the test.";
      }

      pendingTest = null;
    }

    if (adDetected && !previousAd) {
      skipStatus = nextButton?.disabled
        ? "Next unavailable"
        : "Ready for manual test";
      note = nextButton?.disabled
        ? "Spotify has disabled Next. No automatic click was attempted."
        : "Ad detected. No automatic click was attempted.";
    }

    if (!adDetected) {
      if (previousAd) {
        skipStatus = "Ad label disappeared";
        note = "The advertisement label is no longer visible.";
      } else if (!pendingTest) {
        skipStatus = "No ad detected";
        note = "No visible advertisement label was found.";
      }
    }

    previousAd = adDetected;

    updatePanel({
      title,
      artist,
      playback,
      adStatus: adDetected
        ? "Possible advertisement (text match)"
        : "No visible ad label",
      skipStatus,
      note,
      observedAt: new Date().toLocaleTimeString()
    });
  }

  // Expose a diagnostic function for the DevTools Console.
  // It does not click or modify Spotify controls.
  window.spotifyAdHelperStatus = function () {
    const button = document.querySelector(SELECTORS.next);

    return {
      adDetected: getVisibleAd(),
      nextButtonFound: !!button,
      nextButtonDisabled: button ? button.disabled : null,
      playbackLabel:
        document.querySelector(SELECTORS.playPause)
          ?.getAttribute("aria-label") || null,
      skipStatus
    };
  };

  function start() {
    checkPlayer();
    if (timer) clearInterval(timer);
    timer = setInterval(checkPlayer, CHECK_INTERVAL);
  }

  start();
})();
