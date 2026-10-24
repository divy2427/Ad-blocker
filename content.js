(() => {
  if (window.__musicAdHelperLoaded) return;
  window.__musicAdHelperLoaded = true;

  const PANEL_ID = "music-ad-helper-panel";
  const CHECK_INTERVAL = 1000;

  const SELECTORS = {
    title: [
      ".title.style-scope.ytmusic-player-bar",
      "ytmusic-player-bar .title"
    ],
    artist: [
      ".byline.style-scope.ytmusic-player-bar",
      "ytmusic-player-bar .byline"
    ],
    video: "video",
    playPause: [
      "ytmusic-player-bar #play-pause-button",
      "ytmusic-player-bar tp-yt-paper-icon-button[title]"
    ],
    next: [
      "ytmusic-player-bar #next-button",
      "ytmusic-player-bar .next-button"
    ]
  };

  let timer = null;

  function firstVisible(selectors) {
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);

      for (const node of nodes) {
        if (isVisible(node)) return node;
      }
    }

    return null;
  }

  function isVisible(node) {
    if (!node) return false;

    const rect = node.getBoundingClientRect();

    return rect.width > 0 &&
      rect.height > 0 &&
      getComputedStyle(node).visibility !== "hidden";
  }

  function readText(selectors) {
    return firstVisible(selectors)?.textContent?.trim() || "";
  }

  function getButtonLabel(selectors) {
    const button = firstVisible(selectors);
    if (!button) return "Not found";

    const label = [
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.getAttribute("aria-disabled")
    ].filter(Boolean).join(" ");

    return label || "Found";
  }

  function getPlaybackState() {
    const video = document.querySelector("video");

    if (!video) return "No video element found";
    if (video.ended) return "Ended";
    if (video.paused) return "Paused";

    return "Playing";
  }

  function getAdState() {
  const visible = (selector) =>
    [...document.querySelectorAll(selector)].filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 &&
        rect.height > 0 &&
        getComputedStyle(node).visibility !== "hidden";
    });

  const adOverlays = visible(
    ".ytp-ad-player-overlay, .ytp-ad-text"
  );

  const skipButtons = visible(
    ".ytp-ad-skip-button, .ytp-ad-skip-button-modern"
  );

  const adText = adOverlays
    .map((node) => node.innerText?.trim())
    .filter(Boolean);

  const hasAd = adOverlays.length > 0;

  const skipAvailable = skipButtons.some((button) =>
    !button.disabled &&
    button.getAttribute("aria-disabled") !== "true"
  );

  if (hasAd && skipAvailable) {
    return `Ad detected — skip control enabled. ${adText.join(" | ")}`;
  }

  if (hasAd) {
    return `Ad detected — skip unavailable. ${adText.join(" | ")}`;
  }

  return "No known ad indicator detected";
}

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.setAttribute("role", "status");

    const fields = [
      ["mah-heading", "Music Ad Helper"],
      ["mah-status", ""],
      ["mah-meta", ""],
      ["mah-playback", ""],
      ["mah-ad", ""],
      ["mah-controls", ""],
      ["mah-note", ""],
      ["mah-updated", ""]
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

    panel.querySelector(".mah-status").textContent = data.status;
    panel.querySelector(".mah-meta").textContent = data.meta;
    panel.querySelector(".mah-playback").textContent =
      `Playback: ${data.playback}`;
    panel.querySelector(".mah-ad").textContent =
      `Ad detection: ${data.ad}`;
    panel.querySelector(".mah-controls").textContent =
      `Play/Pause: ${data.playPause} | Next: ${data.next}`;
    panel.querySelector(".mah-note").textContent = data.note;
    panel.querySelector(".mah-updated").textContent =
      `Last checked: ${data.updated}`;
  }

  function checkPlayer() {
    if (!document.body) return;

    const title = readText(SELECTORS.title);
    const artist = readText(SELECTORS.artist);
    const video = document.querySelector(SELECTORS.video);
    const ad = getAdState();

    updatePanel({
      status: video ? "Media element detected" : "Waiting for media element",
      meta: [title, artist].filter(Boolean).join(" — ") ||
        "Track details unavailable",
      playback: getPlaybackState(),
      ad,
      playPause: getButtonLabel(SELECTORS.playPause),
      next: getButtonLabel(SELECTORS.next),
      note: "Diagnostics only. No buttons clicked and no ads skipped.",
      updated: new Date().toLocaleTimeString()
    });
  }

  function start() {
    if (timer) clearInterval(timer);
    checkPlayer();
    timer = setInterval(checkPlayer, CHECK_INTERVAL);
  }

  start();
})();
