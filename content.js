(() => {
  if (window.__spotifyAdHelperLoaded) return;
  window.__spotifyAdHelperLoaded = true;

  const PANEL_ID = "spotify-ad-helper-panel";

  const SELECTORS = {
    title: [
      '[data-testid="context-item-info-title"]',
      '[data-testid="now-playing-widget"] a[href*="/track/"]',
      'footer [data-testid="context-item-link"]'
    ],
    artist: [
      '[data-testid="context-item-info-artist"]',
      'footer [data-testid="context-item-info-artist"]'
    ],
    playPause: [
      'button[data-testid="control-button-playpause"]'
    ]
  };

  function readText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = node?.textContent?.trim();
      if (text) return text;
    }
    return "";
  }

  function visibleAdText() {
  const nodes = [
    ...document.querySelectorAll(
      '[data-testid="context-item-info-ad-subtitle"]'
    )
  ];

  return nodes.some((node) => {
    const text = node.textContent?.trim() || "";
    const rect = node.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0;

    return visible &&
      /^advertisement\b/i.test(text);
  });
}

    return nodes.some((node) => {
      if (node.children.length !== 0) return false;

      const text = node.textContent?.trim() || "";
      const rect = node.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0;

      return visible &&
        /\badvertisement\b|\bsponsored\b/i.test(text);
    });
  }

  function getStatus() {
    const title = readText(SELECTORS.title);
    const artist = readText(SELECTORS.artist);
    const button = document.querySelector(SELECTORS.playPause);
    const label = button?.getAttribute("aria-label") || "";

    const playback = /pause/i.test(label)
      ? "Playing"
      : /play/i.test(label)
        ? "Paused"
        : "Unknown";

    const adDetected = visibleAdText();

    return {
      title,
      artist,
      playback,
      adStatus: adDetected
        ? "Possible advertisement (text match)"
        : "Unconfirmed",
      note: adDetected
        ? "Visible advertisement-related text found. This is a heuristic."
        : title
          ? "Track metadata visible. Ad status is unconfirmed."
          : "Track metadata unavailable. Spotify may use a different page layout.",
      observedAt: new Date().toLocaleTimeString()
    };
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.setAttribute("role", "status");

    for (const [className, text] of [
      ["sah-heading", "Spotify Ad Helper"],
      ["sah-status", "Checking player…"],
      ["sah-meta", ""],
      ["sah-playback", ""],
      ["sah-ad-status", ""],
      ["sah-note", ""],
      ["sah-updated", ""]
    ]) {
      const item = document.createElement("div");
      item.className = className;
      item.textContent = text;
      panel.appendChild(item);
    }

    (document.body || document.documentElement).appendChild(panel);
    return panel;
  }

  function renderPanel() {
    scheduled = false;
    if (!document.body) return;

    const data = getStatus();
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

    panel.querySelector(".sah-note").textContent = data.note;
    panel.querySelector(".sah-updated").textContent =
      `Last checked: ${data.observedAt}`;

    try {
      sessionStorage.setItem(
        "spotifyAdHelperStatus",
        JSON.stringify(data)
      );
    } catch (_) {
      // Storage may be unavailable.
    }
  }

  let scheduled = false;

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(renderPanel, 500);
  }

  const observer = new MutationObserver(scheduleUpdate);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-label"]
  });

  renderPanel();
})();
