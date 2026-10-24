(() => {
  if (window.__musicAdHelperV1) {
    window.__musicAdHelperV1.refresh();
    return;
  }

  const PANEL_ID = "music-ad-helper-panel";
  const CHECK_MS = 500;

  let lastAction = "Waiting for player";
  let lastAd = false;
  let lastClickAt = 0;
  let observer = null;

  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
      s.display !== "none" &&
      s.visibility !== "hidden";
  };

  const text = (el) => (el?.innerText || el?.textContent || "").trim();

  function findAdIndicators() {
    const selectors = [
      ".ytp-ad-player-overlay",
      ".ytp-ad-text",
      ".ytp-ad-preview-container",
      ".ytp-ad-image-overlay",
      ".ytp-ad-skip-button",
      ".ytp-ad-skip-button-modern"
    ];

    const found = [];

    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (visible(el)) found.push(el);
      }
    }

    return [...new Set(found)];
  }

  function findSkipButton() {
    const selectors = [
      ".ytp-ad-skip-button-modern",
      ".ytp-ad-skip-button",
      "button.ytp-ad-skip-button-modern",
      "button.ytp-ad-skip-button",
      "[role='button'].ytp-ad-skip-button-modern",
      "[role='button'].ytp-ad-skip-button"
    ];

    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (visible(el) && !el.disabled &&
            el.getAttribute("aria-disabled") !== "true") {
          return el;
        }
      }
    }

    // Fallback: search visible player controls by their accessible text.
    const candidates = document.querySelectorAll(
      ".html5-video-player button, " +
      ".html5-video-player [role='button'], " +
      "ytmusic-player button, " +
      "ytmusic-player [role='button']"
    );

    for (const el of candidates) {
      const label = [
        text(el),
        el.getAttribute("aria-label"),
        el.getAttribute("title")
      ].filter(Boolean).join(" ");

      if (/\bskip\b/i.test(label) &&
          visible(el) &&
          !el.disabled &&
          el.getAttribute("aria-disabled") !== "true") {
        return el;
      }
    }

    return null;
  }

  function getPlayerInfo() {
    const video = document.querySelector("video");

    const title =
      document.querySelector(
        "ytmusic-player-bar .title, .title.style-scope.ytmusic-player-bar"
      );

    const artist =
      document.querySelector(
        "ytmusic-player-bar .byline, .byline.style-scope.ytmusic-player-bar"
      );

    return {
      title: text(title) || document.title || "Unknown track",
      artist: text(artist),
      playback: !video ? "Media element not found" :
        video.ended ? "Ended" :
        video.paused ? "Paused" : "Playing"
    };
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="mah-heading">Music Ad Helper</div>
      <div class="mah-status"></div>
      <div class="mah-track"></div>
      <div class="mah-playback"></div>
      <div class="mah-ad"></div>
      <div class="mah-action"></div>
      <div class="mah-footnote">Only available Skip controls can be clicked.</div>
    `;

    (document.body || document.documentElement).appendChild(panel);
    return panel;
  }

  function render(info, adDetected, skipAvailable) {
    const panel = ensurePanel();
    panel.querySelector(".mah-status").textContent =
      "Extension active";

    panel.querySelector(".mah-track").textContent =
      [info.title, info.artist].filter(Boolean).join(" — ");

    panel.querySelector(".mah-playback").textContent =
      `Playback: ${info.playback}`;

    panel.querySelector(".mah-ad").textContent =
      `Ad detection: ${adDetected ? "Possible ad detected" : "No known ad indicator"}`;

    panel.querySelector(".mah-action").textContent =
      lastAction;
  }

  function check() {
    if (!document.body) return;

    const indicators = findAdIndicators();
    const skipButton = findSkipButton();

    // Ad UI indicators are required before attempting a click.
    const adDetected = indicators.length > 0;
    const skipAvailable = !!skipButton;

    if (adDetected && skipAvailable &&
        Date.now() - lastClickAt > 1500) {
      lastClickAt = Date.now();

      try {
        skipButton.click();
        lastAction = "Clicked an available Skip control";
      } catch (error) {
        lastAction = "Could not click Skip: " + error.message;
      }
    } else if (adDetected && !skipAvailable) {
      lastAction = "Ad detected; waiting for Skip to become available";
    } else if (!adDetected) {
      lastAction = "No ad indicators detected";
    }

    lastAd = adDetected;
    render(getPlayerInfo(), adDetected, skipAvailable);
  }

  function refresh() {
    check();
  }

  window.__musicAdHelperV1 = { refresh };

  // Popup can request the current state through extension messaging.
  chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    if (message?.type === "MAH_GET_STATUS") {
      const info = getPlayerInfo();
      sendResponse({
        active: true,
        title: info.title,
        artist: info.artist,
        playback: info.playback,
        adDetected: findAdIndicators().length > 0,
        lastAction
      });
    }
    return true;
  });

  check();
  setInterval(check, CHECK_MS);

  observer = new MutationObserver(() => check());
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "aria-disabled", "disabled"]
  });
})();
