
# 🎧 Spotify Ad Helper

A lightweight **Manifest V3 browser-extension prototype** for monitoring visible Spotify Web Player metadata and playback-interface changes.

Built as a learning project to explore JavaScript, DOM observation, browser extensions, and frontend diagnostics.

> **Project status:** Experimental prototype. Ad detection and automatic ad skipping are not implemented.

## ✨ Features

- **Track metadata:** Reads visible track title and artist information when available.
- **Playback diagnostics:** Displays the player control's visible playback label when available.
- **Live UI monitoring:** Uses `MutationObserver` to respond to changes in the player interface.
- **On-page status panel:** Shows metadata and diagnostic messages directly on Spotify Web Player.
- **Compact popup:** Provides project information and a link to Spotify Web Player.
- **Minimal permissions:** Does not request special browser permissions for the current implementation.

## 🛠️ Built With

- JavaScript (ES6+)
- HTML5
- CSS3
- Chrome Extensions Manifest V3
- DOM APIs and `MutationObserver`

## 📁 Project Structure

```text
spotify-ad-helper/
├── manifest.json   # Extension configuration
├── content.js      # Player metadata and UI diagnostics
├── styles.css      # On-page panel styling
├── popup.html      # Extension popup interface
└── README.md       # Project documentation
```

## 🚀 Installation

### Requirements

A desktop browser that supports Chrome Manifest V3 extensions.

### Steps for desktop Chrome

1. Download or clone this repository.
2. If downloaded as a ZIP, extract the folder.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Select **Load unpacked**.
6. Choose the extracted `spotify-ad-helper` folder.
7. Open [Spotify Web Player](https://open.spotify.com/).

The diagnostic panel should appear if the content script loads successfully and the expected page elements are available.

## 🧪 What to Test

- Does the panel appear when Spotify Web Player loads?
- Are the track title and artist displayed when available?
- Does the panel update when the track changes?
- Does the playback label reflect the visible player control?
- Does the extension behave sensibly when metadata is unavailable?
- Does the extension continue working after navigating around Spotify?

Record the browser version, test date, observed behavior, and any errors. Do not describe tests as successful until you have actually run them.

## ⚠️ Limitations

- Missing track metadata does not reliably indicate an advertisement.
- **Ad detection is not implemented.**
- Automatic advertisement skipping is not implemented or guaranteed.
- Spotify may change its DOM structure and selectors.
- The extension depends on visible page elements being available.
- Actual compatibility must be verified in a supported desktop browser.

## 🔒 Privacy

The current prototype reads visible elements from the Spotify Web Player page.

It does not intentionally send track information to an external server. It may store the latest diagnostic status in the browser's session storage.

The extension does not currently include analytics or a remote backend.

## 🗺️ Roadmap

- [ ] Test the extension in a supported desktop browser.
- [ ] Improve handling of missing or changing page elements.
- [ ] Add a user-controlled panel enable/disable option.
- [ ] Reduce unnecessary DOM updates.
- [ ] Document verified browser compatibility.
- [ ] Add screenshots and a short demonstration.
- [ ] Add automated checks for code quality.

## 🎯 Learning Goals

This project explores:

- Browser extension architecture
- DOM inspection and mutation observation
- Defensive JavaScript programming
- Accessible interface design
- Debugging and reproducible testing
- Technical documentation

## 🤝 Contributing

Suggestions, bug reports, and improvements are welcome. Please describe the browser environment and steps to reproduce any issue.

## 📄 License

No license has been specified yet. Add a license file before presenting the project as open source for reuse.
