# ![TTCP](https://raw.githubusercontent.com/ElectricArdvark/Tiktok-control-panel/main/extension/icons/icon32.png) TikTok Control Panel

[![Made with AI](https://img.shields.io/badge/Made%20with-AI-lightgrey?style=for-the-badge)](https://github.com/mefengl/made-by-ai)

A comprehensive control panel for TikTok on desktop: toggle minimalist cinema view, customize element visibility, enable background playback, configurable arrow seeking, spacebar pause, and custom player controls.

> [!NOTE]
> Do to TikTok constant UI changes somethings may not work as intended.

## Features

- **Minimalist Cinema Mode**: Clean full-viewport presentation that allows clean viewing for vertical monitors.
- **Element Visibility Customization**: Selectively hide or display, sidebar, action bar icons (avatar, like, comment, bookmark, share, music), progress bar, captions...
- **Background Playback**: Keeps TikTok audio and video playing uninterrupted when switching tabs or minimizing the window.
- **Configurable Arrow Seeking**: Left/Right arrow key seeking with customizable step duration in seconds.
- **Video Controls**: Hold spacebar to speed-up video, Press spacebar to Pause the active video rather than scrolling the page.
- **Extra Buttons**: Adds mute / fullscreen buttons.

## Installation

### UserScript:
1. Install a userscript manager browser extension:
    - [Violentmonkey](https://violentmonkey.github.io/) (Recommended)
    - [Tampermonkey](https://www.tampermonkey.net/)
2. Click **[this link](https://raw.githubusercontent.com/ElectricArdvark/Tiktok-control-panel/main/userscript/tiktok-control-panel.user.js)** — the extension will prompt you to install it. Enable auto-update (rerecommended).
4. To access the control panel, click the userscript manager icon → **Control Panel Settings**. Change settings as you see fit.
5. Done.

### Extension:
 - **Chromium:**
1. [Download the latest extension zip](https://github.com/ElectricArdvark/Tiktok-control-panel/releases/latest/download/tiktok-control-panel.zip) and extract it.
2. Navigate to the Extensions management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable **Developer mode** (toggle located in the top-right corner).
4. Click **Load unpacked** (top-left).
5. Select the extracted `extension` folder.
6. Click the extension icon in your toolbar to configure settings.

## Project Structure

- `manifest.json` — Manifest V3 definition with permissions, background worker, popup, and content script bindings.
- `background.js` — Service worker handling initial installation defaults and keyboard shortcut commands.
- `content.js` — Content script injecting minimalist CSS, floating HUD buttons, event listeners, and media handlers.
- `content.css` — Core styles for TikTok UI overrides and popup layout.
- `popup/` — Extension popup interface.
- `icons/` — Extension icons in 16px, 32px, 48px, and 128px formats.

## Preview
<table>
<tr>
<td><img src="https://i.ibb.co/j7yyDFy/1.png" width="180"></td>
<td><img src="https://i.ibb.co/NgsrPxkT/2.png" width="180"></td>
<td><img src="https://i.ibb.co/Kp6d505g/3.png" width="180"></td>
<td><img src="https://i.ibb.co/PZHvq4jK/6.png" width="180"></td>
</tr>
<tr>
<td><img src="https://i.ibb.co/4wkZYBrS/5.png" width="180"></td>
<td>Before<img src="https://i.ibb.co/Xf0dv5L9/Screenshot-112.png" width="180"></td>
<td>After<img src="https://i.ibb.co/Ldw1hFky/Screenshot-114.png" width="180"></td>
</tr>
</table>

### Issues:
- Photo navigation buttons in minimalist mode

**works in:**
- [x] FYP 
- [x] Following
- [x] Videos from a direct link
- [ ] Everything else: only playback settings

## Contributing

Suggestions and contributions are welcome. Feel free to open an [issue](https://github.com/ElectricArdvark/Tiktok-control-panel/issues) or submit a [pull request](https://github.com/ElectricArdvark/Tiktok-control-panel/pulls).