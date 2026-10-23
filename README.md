# Spotify Ad Helper

A small Manifest V3 browser-extension prototype for learning and diagnosing the Spotify Web Player interface.

## Current features

- Adds a small status panel to `https://open.spotify.com/*`.
- Reads visible track title and artist metadata when available.
- Observes player UI changes and refreshes the panel.
- Includes a simple extension popup.

## Important limitations

- Missing track metadata does **not** reliably mean an advertisement is playing.
- This project does not bypass or circumvent Spotify advertisements.
- It does not guarantee automatic ad skipping; Spotify may restrict player controls during ads.
- Spotify may change its page structure, so selectors can stop working.
- Test only in browsers that support Manifest V3 extensions.

## Install in desktop Chrome

1. Download and unzip this project.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the `spotify-ad-helper` folder.
6. Open `https://open.spotify.com/` and check for the diagnostic panel.

## Files

- `manifest.json` — extension configuration.
- `content.js` — visible metadata diagnostics.
- `styles.css` — status panel styling.
- `popup.html` — extension popup.

## Roadmap

1. Verify compatibility in the target browser.
2. Improve diagnostics with careful, testable UI signals.
3. Add error handling and a user-controlled enable/disable setting.
4. Document test results and browser limitations.
5. Publish the repository and a short demo.

## Privacy

This prototype does not send Spotify data to a server. It only reads visible page elements and uses session storage for the latest local status when available.
