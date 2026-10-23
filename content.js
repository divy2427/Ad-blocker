(() => {
  if (window.__spotifyAdHelperLoaded) return;
  window.__spotifyAdHelperLoaded = true;

  const SELECTORS = {
    title: '[data-testid="context-item-info-title"]',
    artist: '[data-testid="context-item-info-artist"]',
    playPause: 'button[data-testid="control-button-playpause"]'
  };

  function readText(selector) {
    const node = document.querySelector(selector);
    return node?.textContent?.trim() || "";
  }

  function getStatus() {
    const title = readText(SELECTORS.title);
    const artist = readText(SELECTORS.artist);
    const playPause = document.querySelector(SELECTORS.playPause);
    const aria = playPause?.getAttribute("aria-label") || "";

    return {
      title,
      artist,
      controlLabel: aria,
      observedAt: new Date().toISOString(),
      note: title
        ? "Track metadata visible. This does not prove whether an ad is playing."
        : "No track title detected. This may be loading, an unsupported layout, or an ad."
    };
  }

  function renderPanel() {
    let panel = document.getElementById("spotify-ad-helper-panel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "spotify-ad-helper-panel";
      panel.setAttribute("role", "status");
      panel.innerHTML = `
        <div class="sah-heading">Spotify Ad Helper</div>
        <div class="sah-status">Checking player…</div>
        <div class="sah-meta"></div>
        <div class="sah-note"></div>
      `;
      document.body.appendChild(panel);
    }

    const data = getStatus();
    panel.querySelector(".sah-status").textContent =
      data.title ? "Player metadata detected" : "Waiting for player metadata";
    panel.querySelector(".sah-meta").textContent =
      [data.title, data.artist].filter(Boolean).join(" — ") || "Track details unavailable";
    panel.querySelector(".sah-note").textContent = data.note;

    try {
      sessionStorage.setItem("spotifyAdHelperStatus", JSON.stringify(data));
    } catch (_) {
      // Storage may be unavailable in some browser contexts; the panel still works.
    }
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      renderPanel();
    }, 250);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-label"]
  });

  renderPanel();
})();