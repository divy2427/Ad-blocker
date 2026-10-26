YouTube Adaptive Ad Controller v2.1.3

Targets YouTube and YouTube Music webpages.


Install


Extract the ZIP.

In a supported desktop Chromium browser, open chrome://extensions.

Enable Developer mode, select Load unpacked, and choose this folder.

Reload YouTube or YouTube Music.


For Yandex Browser on Android, unpacked-extension support varies by version. If your browser has no load/unpacked option, this project cannot be installed through the standard extension workflow on that version.


Features


Best-effort ad-state detection using YouTube page markers.

Adaptive playback rate based on media duration and current time.

Auto-mute while an ad is detected.

Preserves v2.0's adaptive speed approach, with a 0.15-second minimum target.

Improves detection of common visible, enabled skip-button variants.

Attempts to restore the previous rate, mute state, and volume after the ad.

Popup controls for 0.15–1.5 second target and maximum rate 16×, 32×, or attempted 64×.


Limitations

A 0.15-second target is only a calculation target, not a guarantee. YouTube may ignore or cap playback-rate changes; high rates may not work. Ad markers can change, some audio ads expose no controllable media element, and unskippable ads cannot be made skippable by this extension. This is experimental starter code.


Privacy

No external network calls. Settings are stored with Chrome sync storage.


Version 2.2.0 experimental reliability build

This build broadens media-element discovery, prioritizes YouTube player ad-state classes, checks visible skip controls, and periodically retries playback-rate changes during detected ads. It is experimental and has not been verified against a live YouTube Music ad. Playback-rate changes may be restricted by the site/browser, and unskippable ads cannot be skipped.

