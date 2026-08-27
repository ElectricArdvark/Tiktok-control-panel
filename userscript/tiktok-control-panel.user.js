// ==UserScript==
// @name         TikTok Control Panel
// @namespace    https://tampermonkey.net/
// @version      1.2
// @description  Control panel for TikTok: customize element visibility (sidebar, action bar, captions, pills...), enable background playback, arrow seeking, spacebar to pause, minimalist mode...
// @author       ElectricArdvark https://github.com/ElectricArdvark
// @updateURL    https://raw.githubusercontent.com/ElectricArdvark/Tiktok-control-panel/main/userscript/tiktok-control-panel.user.js
// @match        https://www.tiktok.com/*
// @icon         https://www.tiktok.com/favicon.ico
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @noframes
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  /* ═══════════════
      CONFIGURATION
     ═══════════════ */
  const CONFIG = {
    enabledByDefault: false,    // start in minimalist mode
    routes: ['/', '/foryou', '/following', '/friends'],
    fullHeightVideo: false,    // video fills the viewport height
    actionBarRight: true,     // pin avatar/like/comment/fav/share/music to the right
    arrowsAboveStack: true,     // prev/next arrows sit right above actionbarRight
    captionScreenLeft: true,     // author and caption at the bottom-left of the screen
    progressFullWidth: true,     // progress bar stretches across the whole bottom
    hideScrollbar: true,
    toggleKey: 'c',      // C to toggle minimalist mode on/off
    muteKey: 'm',      // M to mute/unmute

    /* ─ Per-element visibility defaults ─ */
    show: {
      squareCorners: false,  // square corners on the player
      fullscreenButton: false,  // fullscreen button
      muteButton: false,  // Mute button
      closeButton: false,  // Close button
      spacebarPause: false,  // Spacebar pauses video instead of scrolling
      settingsButton: true,   // Settings Button icon visibility
      autoHideVideoList: false,  // Auto hide related videos and comments panel on video start
      // ─ UI Features ─
      hideAll: false,  // hides every ui element
      sidebar: true,   // Left Sidebar
      headerPills: true,   // Top Right Pills
      caption: true,   // author and caption
      progressBar: true,   // progress bar
      // ─ Action bar items ─
      navButtons: true,   // up/down buttons
      avatar: true,   // creator avatar and follow button
      likeButton: true,   // like button
      commentButton: true,   // comments button
      favoriteButton: true,   // favourites button
      shareButton: true,   // share button
      musicButton: true,   // spinning music disc
    },
  };

  const STORAGE_KEYS = {
    SETTINGS: 'tt-minimalist-feed:settings',
    AUTOSTART: 'tt-minimalist-feed:autostart',
    SEEK_DUR: 'tt-minimalist-feed:seekDur',
    SEEK_ENABLED: 'tt-minimalist-feed:seekEnabled',
    BG_PLAY: 'tt-minimalist-feed:bgPlayback',
    HOLD_SPEED_ENABLED: 'tt-minimalist-feed:holdSpeedEnabled',
    HOLD_SPEED_RATE: 'tt-minimalist-feed:holdSpeedRate',
  };

  const ROOT_CLS = 'tt-minimalist-feed';
  const COMMENTS_CLS = 'tt-iv-comments';
  const ACTIVE_CLS = 'tt-iv-active';
  const STYLE_ID = 'tt-minimalist-feed-style';
  const UI_ID = 'tt-minimalist-feed-ui';

  function getStorage(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return fallback;
      if (typeof fallback === 'boolean') return val === 'true';
      if (typeof fallback === 'number') {
        const num = parseFloat(val);
        return isNaN(num) ? fallback : num;
      }
      if (typeof fallback === 'object' && fallback !== null) {
        return { ...fallback, ...JSON.parse(val) };
      }
      return val;
    } catch (e) {
      return fallback;
    }
  }

  function setStorage(key, val) {
    try {
      if (typeof val === 'object' && val !== null) {
        localStorage.setItem(key, JSON.stringify(val));
      } else {
        localStorage.setItem(key, String(val));
      }
    } catch (e) { }
  }

  function buildCss() {
    const C = [];

    C.push(`
html.${ROOT_CLS} #app-header > [class*="DivHeaderWrapperMain"],
html.${ROOT_CLS} [class*="DivSideNavPlaceholderContainer"],
html.${ROOT_CLS} #fixed-top-container,
html.${ROOT_CLS} [class*="DivFixedBottomContainer"],
html.${ROOT_CLS} tiktok-cookie-banner { display: none !important; }
html.${ROOT_CLS} #app-header > div:has([data-e2e="search-box"]),
html.${ROOT_CLS} [class*="BaseBodyContainer"] > div:has([data-e2e="nav-foryou"]) { display: none !important; }
html.tt-opt-autoHideVideoList:not(.tt-show-video-list) [class*="DivVideoList"] { display: none !important; }
html[data-theme="dark"].${ROOT_CLS}, html[data-theme="dark"].${ROOT_CLS} body { background: #000 !important; }
html:not([data-theme="dark"]).${ROOT_CLS}, html:not([data-theme="dark"]).${ROOT_CLS} body { background: #fff !important; }
html.${ROOT_CLS} body { overflow-x: clip !important; }
html.${ROOT_CLS} #app-header { position: static !important; height: auto !important; padding: 0 !important; }
html.${ROOT_CLS} [class*="BaseBodyContainer"],
html.${ROOT_CLS} [class*="DivMainContainer"] {
  display: block !important;
  padding: 0 !important;
  margin: 0 !important;
}
html.${ROOT_CLS} main[id^="main-content-"],
html.${ROOT_CLS} #column-list-container {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
html[data-theme="dark"].${ROOT_CLS} main[id^="main-content-"],
html[data-theme="dark"].${ROOT_CLS} #column-list-container {
  background: #000 !important;
}
html:not([data-theme="dark"]).${ROOT_CLS} main[id^="main-content-"],
html:not([data-theme="dark"]).${ROOT_CLS} #column-list-container {
  background: #fff !important;
}

html.${ROOT_CLS}.tt-route-video [class*="BaseBodyContainer"],
html.${ROOT_CLS}.tt-route-video [class*="DivMainContainer"],
html.${ROOT_CLS}.tt-route-video main[id^="main-content-"] {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 auto !important;
}

html.${ROOT_CLS} [class*="DivFeedPageVideoItem"],
html.${ROOT_CLS} [class*="DivVideoWrapper"],
html.${ROOT_CLS} [class*="DivImmersiveVideoContainer"],
html.${ROOT_CLS} main[id^="main-content-"] {
  width: 100vw !important;
  max-width: 100vw !important;
  transition: width 0.3s ease, max-width 0.3s ease !important;
}
html.${ROOT_CLS}.${COMMENTS_CLS} #column-list-container,
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="DivContentContainer"],
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="DivColumnListContainer"] {
  margin: 0 !important;
  padding: 0 !important;
  max-width: none !important;
  width: 100% !important;
  flex-grow: 1 !important;
}
`);

    C.push(`
html.${ROOT_CLS} article[data-e2e="recommend-list-item-container"] {
  position: relative !important;
  width: 100% !important; height: 100vh !important;
  margin: 0 !important; padding: 0 !important; border: none !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  overflow: visible !important;
}
html.${ROOT_CLS} article[data-e2e="recommend-list-item-container"] [class*="DivContentFlexLayout"] {
  display: flex !important; align-items: center !important; justify-content: center !important;
  width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; gap: 0 !important;
}

html:not([data-theme="dark"]).${ROOT_CLS} [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"],
html:not([data-theme="dark"]).${ROOT_CLS} [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"] *,
html:not([data-theme="dark"]).${ROOT_CLS} article[data-e2e="recommend-list-item-container"] [class*="SectionActionBarContainer"],
html:not([data-theme="dark"]).${ROOT_CLS} article[data-e2e="recommend-list-item-container"] [class*="SectionActionBarContainer"] *,
html:not([data-theme="dark"]).${ROOT_CLS} [class*="AsideOneColumnSidebar"],
html:not([data-theme="dark"]).${ROOT_CLS} [class*="AsideOneColumnSidebar"] * {
  color: #121212 !important;
}
html:not([data-theme="dark"]).${ROOT_CLS} [class*="SectionMediaCardContainer"] [class*="DivVideoProgressContainer"] {
  filter: invert(1) hue-rotate(180deg) !important;
}
`);

    if (CONFIG.fullHeightVideo) {
      C.push(`
html.${ROOT_CLS} [class*="SectionMediaCardContainer"][shape="vertical"] {
  width: 100% !important; height: auto !important;
  max-width: calc(100vh * 0.5625) !important; max-height: 100vh !important;
  aspect-ratio: 0.5625 !important; min-width: 0 !important; min-height: 0 !important;
}
html.${ROOT_CLS} [class*="SectionMediaCardContainer"][shape="horizontal"] {
  width: 100% !important; height: auto !important;
  max-width: calc(100vh * 1.7778) !important; max-height: 100vh !important;
  aspect-ratio: 1.7778 !important; min-width: 0 !important; min-height: 0 !important;
}`);
    }

    C.push(`
html.${ROOT_CLS} [class*="SectionMediaCardContainer"],
html.${ROOT_CLS} [class*="SectionMediaCardContainer"] > [class*="BasePlayerContainer"] {
  overflow: visible !important;
}
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"],
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"] > [class*="BasePlayerContainer"],
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"] [class*="BasePlayerContainer"] > [class*="DivContainer"],
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"] [class*="BasePlayerContainer"] > [class*="DivContainer"] > [class*="Box"],
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlay"],
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"],
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottom"] {
  border-radius: 0 !important;
}
html.tt-opt-squareCorners [class*="SectionMediaCardContainer"] [class*="BasePlayerContainer"] > [class*="DivContainer"] {
  overflow: visible !important;
}
html.${ROOT_CLS} [class*="SectionMediaCardContainer"] [class*="BasePlayerContainer"],
html.${ROOT_CLS} [class*="SectionMediaCardContainer"] [class*="BasePlayerContainer"] * {
  filter: none !important;
  -webkit-filter: none !important;
  box-shadow: none !important;
  background-image: none !important;
}
`);

    if (CONFIG.actionBarRight || CONFIG.arrowsAboveStack) {
      C.push(`
html.${ROOT_CLS} [class*="DivLeftContainer"] {
  position: relative !important;
}
html.${ROOT_CLS} article[data-e2e="recommend-list-item-container"] [class*="SectionActionBarContainer"] {
  position: absolute !important;
  right: 24px !important;
  left: auto !important;
  inset-inline-end: 20px !important;
  top: auto !important;
  bottom: 40px !important;
  z-index: 6 !important;
}
html.${ROOT_CLS} [class*="AsideOneColumnSidebar"] {
  position: absolute !important;
  right: 24px !important;
  left: auto !important;
  inset-inline-end: 24px !important;
  top: auto !important;
  bottom: calc(55px + var(--tt-stack-h, 470px)) !important;
  transform: none !important;
  z-index: 7 !important;
  width: auto !important;
  height: auto !important;
}
html.${ROOT_CLS} [class*="DivFeedNavigationContainer"] {
  position: relative !important;
  right: auto !important;
  left: auto !important;
  transform: none !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}
`);
    }

    C.push(`
html.${ROOT_CLS} [class*="DivFeedPageVideoItemContainer"],
html.${ROOT_CLS} [class*="DivContentContainer"],
html.${ROOT_CLS} [class*="DivBodyContainer"] {
  display: flex !important;
  flex-direction: row !important;
  width: 100vw !important;
  max-width: 100vw !important;
  overflow: hidden !important;
}

html.${ROOT_CLS}.${COMMENTS_CLS}.tt-route-video [class*="BaseBodyContainer"],
html.${ROOT_CLS}.${COMMENTS_CLS}.tt-route-video [class*="DivMainContainer"],
html.${ROOT_CLS}.${COMMENTS_CLS}.tt-route-video main[id^="main-content-"],
html.${ROOT_CLS}.${COMMENTS_CLS}.tt-route-video [class*="DivLeftContainer"] {
  width: calc(100vw - var(--tt-comments-width, 350px)) !important;
  max-width: calc(100vw - var(--tt-comments-width, 350px)) !important;
  margin-right: auto !important;
  margin-left: 0 !important;
  float: none !important;
  transition: width 0.3s ease, max-width 0.3s ease !important;
}

html.${ROOT_CLS}.${COMMENTS_CLS}:not(.tt-route-video) main[id^="main-content-"],
html.${ROOT_CLS}.${COMMENTS_CLS}:not(.tt-route-video) [class*="DivMainContainer"] {
  width: calc(100vw - var(--tt-comments-width, 350px)) !important;
  max-width: calc(100vw - var(--tt-comments-width, 350px)) !important;
  margin: 0 !important;
  transition: width 0.3s ease, max-width 0.3s ease !important;
}

html.${ROOT_CLS}.${COMMENTS_CLS} [class*="SectionActionBarContainer"] {
  position: absolute !important;
  right: 20px !important;
  left: auto !important;
  z-index: 99 !important;
}
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="AsideOneColumnSidebar"] {
  position: absolute !important;
  right: 24px !important;
  left: auto !important;
  z-index: 99 !important;
}

@keyframes slideInFromRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

html.${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentContainer"],
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="AsideCommentSidebar"],
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentSidebar"],
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentSidebarTransitionWrapper"] {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  left: auto !important;
  max-width: var(--tt-comments-width, 350px) !important;
  height: 100vh !important;
  z-index: 9999 !important;
  animation: slideInFromRight 0.3s ease forwards !important;
}
html[data-theme="dark"].${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentContainer"],
html[data-theme="dark"].${ROOT_CLS}.${COMMENTS_CLS} [class*="AsideCommentSidebar"],
html[data-theme="dark"].${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentSidebar"],
html[data-theme="dark"].${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentSidebarTransitionWrapper"] {
  background: #121212 !important;
}
html:not([data-theme="dark"]).${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentContainer"],
html:not([data-theme="dark"]).${ROOT_CLS}.${COMMENTS_CLS} [class*="AsideCommentSidebar"],
html:not([data-theme="dark"]).${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentSidebar"],
html:not([data-theme="dark"]).${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentSidebarTransitionWrapper"] {
  background: #fff !important;
}
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="SectionCommentSidebarContainer"] {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  box-sizing: border-box !important;
}
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentContainer"] [class*="DivCommentSidebar"],
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="AsideCommentSidebar"] [class*="DivCommentSidebar"],
html.${ROOT_CLS}.${COMMENTS_CLS} [class*="DivCommentSidebarTransitionWrapper"] [class*="SectionCommentSidebarContainer"] {
  animation: none !important;
  position: static !important;
}
`);

    C.push(`
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"],
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"] * {
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  filter: none !important;
  -webkit-filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"]::before,
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"]::after,
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottom"]::before,
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottom"]::after,
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"] > div::before,
html.${ROOT_CLS} article [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"] > div::after {
  background: none !important;
  background-image: none !important;
  display: none !important;
  content: none !important;
}
html.${ROOT_CLS} [class*="SectionMediaCardContainer"] [class*="DivMediaCardOverlayBottomSection"] {
  transform: translate(var(--tt-cap-x, 0px), var(--tt-cap-y, 0px)) !important;
  transition: transform 0s !important;
  width: min(500px, 44vw) !important;
  z-index: 8 !important;
}
${CONFIG.progressFullWidth ? `
html.${ROOT_CLS} [class*="SectionMediaCardContainer"] [class*="DivVideoProgressContainer"] {
  transform: translate(var(--tt-prog-x, 0px), var(--tt-prog-y, 0px)) !important;
  transition: transform 0s !important;
  width: calc(var(--tt-art-width, 100vw) - 2vw) !important;
  max-width: none !important;
  z-index: 8 !important;
}` : ''}
`);

    if (CONFIG.hideScrollbar) {
      C.push(`
html.${ROOT_CLS} { scrollbar-width: none !important; }
html.${ROOT_CLS}::-webkit-scrollbar,
html.${ROOT_CLS} body::-webkit-scrollbar { display: none !important; }`);
    }

    C.push(`
html.tt-hide-sidebar [class*="BaseBodyContainer"] > div:has([data-e2e="nav-foryou"]),
html.tt-hide-sidebar [class*="DivSideNavPlaceholderContainer"],
html.tt-hide-sidebar [class*="DivSideNavContainer"] {
  visibility: hidden !important;
  pointer-events: none !important;
}
html.tt-route-profile [class*="BaseBodyContainer"] > div:has([data-e2e="nav-foryou"]),
html.tt-route-profile [class*="DivSideNavPlaceholderContainer"],
html.tt-route-profile [class*="DivSideNavContainer"] {
  visibility: visible !important;
  pointer-events: auto !important;
}
html.tt-hide-headerPills #top-right-action-bar,
html.tt-hide-headerPills #app-header [class*="DivHeaderRightContainer"],
html.tt-hide-headerPills #app-header > div:not(:has([data-e2e="tiktok-logo"])):not(:has([data-e2e="search-box"])):not(:has(form)),
html.tt-hide-headerPills #app-header > div > div:not(:has([data-e2e="tiktok-logo"])):not(:has([data-e2e="search-box"])):not(:has(form)),
html.tt-hide-headerPills #app-header > [class*="DivHeaderWrapperMain"] > div:last-child:not(:first-child),
html.tt-hide-headerPills #app-header > div:last-child:not(:first-child):not(:has(form)),
html.tt-hide-headerPills [class*="VideoDetailContentPanelSpacer"],
html.tt-hide-caption [class*="DivMediaCardOverlayBottomSection"],
html.tt-hide-progressBar [class*="DivVideoProgressContainer"] {
  display: none !important;
}
html.tt-hide-navButtons [class*="DivFeedNavigationContainer"],
html.tt-hide-avatar [class*="DivAvatarActionItemContainer"],
html.tt-hide-likeButton [data-e2e="like-icon"], html.tt-hide-likeButton [data-e2e="like-count"],
html.tt-hide-commentButton [data-e2e="comment-icon"], html.tt-hide-commentButton [data-e2e="comment-count"],
html.tt-hide-favoriteButton [data-e2e="favorite-icon"], html.tt-hide-favoriteButton [data-e2e="favorite-count"],
html.tt-hide-shareButton [data-e2e="share-icon"], html.tt-hide-shareButton [data-e2e="share-count"],
html.tt-hide-musicButton [data-e2e="video-music"] {
  visibility: hidden !important;
  pointer-events: none !important;
  height: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  opacity: 0 !important;
  overflow: hidden !important;
}
`);

    C.push(`
#${UI_ID}, #${UI_ID}-right {
  position: fixed; z-index: 2147483000;
  display: flex; align-items: center; gap: 6px;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
#${UI_ID} { top: 14px; left: 14px; }
#${UI_ID}-right {
  top: 14px;
  left: 132px;
  right: auto;
  flex-direction: row;
  transition: left 0.2s ease, top 0.2s ease;
}
html.tt-hide-sidebar #${UI_ID}-right,
html.${ROOT_CLS} #${UI_ID}-right { left: 14px; }
#${UI_ID} button, #${UI_ID}-right button {
  width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
  background: rgba(0,0,0,0); color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s ease; backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px); padding: 0;
}
#${UI_ID} button:hover, #${UI_ID}-right button:hover { background: rgba(255,255,255,.28); }

html:not([data-theme="dark"]) #${UI_ID} button,
html:not([data-theme="dark"]) #${UI_ID}-right button:not(.tt-pill) {
  color: #121212;
}
html:not([data-theme="dark"]) #${UI_ID} button:hover,
html:not([data-theme="dark"]) #${UI_ID}-right button:not(.tt-pill):hover {
  background: rgba(0,0,0,.08);
}
#${UI_ID}-right button.tt-pill {
  width: auto; height: 36px; border-radius: 18px; padding: 0 16px;
  font-size: 13px; font-weight: 500; letter-spacing: .2px; gap: 7px;
  background: rgb(35,35,35) !important;
  border: none !important;
  color: rgba(255,255,255,.85) !important;
  box-shadow: 0 1px 4px rgba(0,0,0,.4) !important;
}
#${UI_ID}-right button.tt-pill:hover {
  background: rgba(40,40,40,.95) !important;
  border-color: rgba(255,255,255,.3) !important;
  color: #fff !important;
}

#tt-settings-menu {
  position: fixed; top: 60px; left: 20px; z-index: 2147483647;
  background: rgba(14, 14, 17, 0.97); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px;
  padding: 10px; display: none;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
  width: 370px; max-width: calc(100vw - 28px);
  box-sizing: border-box;
}
#tt-settings-menu.tt-open { display: flex; flex-direction: column; gap: 8px; }
#tt-settings-menu .tt-s-hero {
  padding: 10px 14px; border-radius: 10px;
  background: linear-gradient(135deg, rgba(37, 244, 238, 0.14) 0%, rgba(254, 44, 85, 0.14) 100%), rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; user-select: none;
  transition: background .15s, border-color .15s;
}
#tt-settings-menu .tt-s-hero:hover {
  background: linear-gradient(135deg, rgba(37, 244, 238, 0.2) 0%, rgba(254, 44, 85, 0.2) 100%), rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.22);
}
#tt-settings-menu .tt-s-hero-title {
  font-size: 13.5px; font-weight: 700; color: #fff; letter-spacing: -0.1px;
}

#tt-settings-menu .tt-s-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.04);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}
#tt-settings-menu .tt-s-tab {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
  text-align: center;
}
#tt-settings-menu .tt-s-tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
#tt-settings-menu .tt-s-tab.active {
  background: rgba(255, 255, 255, 0.12);
  color: #25f4ee;
}

#tt-settings-menu .tt-s-content {
  display: flex;
  flex-direction: column;
}
#tt-settings-menu .tt-s-panel {
  display: none;
  flex-direction: column;
  gap: 4px;
  max-height: 380px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  padding-right: 2px;
}
#tt-settings-menu .tt-s-panel.active {
  display: flex;
}

#tt-settings-menu .tt-s-subheader {
  font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  color: #25f4ee; padding: 8px 6px 2px; user-select: none;
}
#tt-settings-menu .tt-s-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 10px; gap: 8px; cursor: pointer; user-select: none;
  border-radius: 8px;
  background: rgba(26, 26, 32, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: background .12s, border-color .12s;
}
#tt-settings-menu .tt-s-row:hover {
  background: rgba(36, 36, 44, 0.75);
  border-color: rgba(255, 255, 255, 0.12);
}
#tt-settings-menu .tt-s-row.tt-s-highlight {
  background: rgba(37, 244, 238, 0.07);
  border: 1px solid rgba(37, 244, 238, 0.25);
}
#tt-settings-menu .tt-s-row.tt-s-disabled { opacity: 0.38; pointer-events: none; }
#tt-settings-menu .tt-s-label {
  color: rgba(255, 255, 255, 0.9); font-size: 12px; flex: 1;
  line-height: 1.25;
}
#tt-settings-menu .tt-toggle {
  position: relative; flex-shrink: 0;
  width: 34px; height: 19px; cursor: pointer;
}
#tt-settings-menu .tt-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
#tt-settings-menu .tt-toggle-track {
  position: absolute; inset: 0;
  background: rgba(255, 255, 255, 0.18); border-radius: 10px;
  transition: background .2s;
}
#tt-settings-menu .tt-toggle input:checked + .tt-toggle-track { background: #25f4ee; }
#tt-settings-menu .tt-toggle-track::after {
  content: ''; position: absolute;
  width: 15px; height: 15px; border-radius: 50%;
  background: #fff; top: 2px; left: 2px;
  transition: transform .2s cubic-bezier(.4, 0, .2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}
#tt-settings-menu .tt-toggle input:checked + .tt-toggle-track::after { transform: translateX(15px); }

#tt-settings-menu .tt-s-stacked-row {
  display: flex; flex-direction: column; gap: 8px;
  padding: 10px; border-radius: 8px;
  background: rgba(26, 26, 32, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 4px;
}
#tt-settings-menu .tt-s-stacked-header {
  display: flex; justify-content: space-between; align-items: center;
}
#tt-settings-menu .tt-s-badge {
  font-size: 11px; font-weight: 700; color: #25f4ee;
  background: rgba(37, 244, 238, 0.12); padding: 2px 8px; border-radius: 6px;
}
#tt-settings-menu input[type="range"] {
  width: 100%; accent-color: #25f4ee; cursor: pointer; margin: 2px 0 0;
}
#tt-settings-menu .tt-s-range-marks {
  display: flex; justify-content: space-between;
  font-size: 9.5px; color: rgba(255, 255, 255, 0.35);
}

#tt-settings-menu .tt-s-segmented {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.04);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}
#tt-settings-menu .tt-s-seg-btn {
  flex: 1;
  background: transparent;
  border: 1px solid transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  text-align: center;
}
#tt-settings-menu .tt-s-seg-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
#tt-settings-menu .tt-s-seg-btn.active {
  background: rgba(37, 244, 238, 0.15);
  color: #25f4ee;
  border-color: rgba(37, 244, 238, 0.35);
}

#tt-settings-menu .tt-s-shortcuts {
  display: flex; flex-direction: column; gap: 6px;
}
#tt-settings-menu .tt-s-shortcut-item {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 12px;
  background: rgba(26, 26, 32, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}
#tt-settings-menu .tt-s-shortcut-item kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 26px; height: 24px; padding: 0 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  font-family: inherit; font-size: 11px; font-weight: 700;
  color: #25f4ee; box-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
#tt-settings-menu .tt-s-shortcut-item span {
  font-size: 12px; color: rgba(255, 255, 255, 0.9);
}

html.${ROOT_CLS} [class*="DivRelatedTabContainer"],
html.${ROOT_CLS} [class*="DivTabContainer"] {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  padding: 0 !important;
  margin: 0 !important;
  flex: 1 1 100% !important;
  box-sizing: border-box !important;
}
`);

    return C.join('\n');
  }

  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = buildCss();

  function injectStyle() {
    const host = document.head || document.documentElement;
    if (host && !document.getElementById(STYLE_ID)) host.appendChild(styleEl);
  }
  injectStyle();

  let autostartEnabled = getStorage(STORAGE_KEYS.AUTOSTART, CONFIG.enabledByDefault);
  let enabled = autostartEnabled;
  let settings = getStorage(STORAGE_KEYS.SETTINGS, { ...CONFIG.show });
  let seekDuration = getStorage(STORAGE_KEYS.SEEK_DUR, 3);
  let seekEnabled = getStorage(STORAGE_KEYS.SEEK_ENABLED, true);
  let bgPlaybackEnabled = getStorage(STORAGE_KEYS.BG_PLAY, false);
  let holdSpeedEnabled = getStorage(STORAGE_KEYS.HOLD_SPEED_ENABLED, true);
  let holdSpeedRate = getStorage(STORAGE_KEYS.HOLD_SPEED_RATE, 2.0);
  let isMuted = false;

  function isSearchRoute() {
    return location.pathname.startsWith('/search');
  }

  function isOnVideoUrl() {
    return !isSearchRoute() && !!location.pathname.match(/^\/@[^/]+\/(video|photo)\/\d+/);
  }

  function isProfileRoute() {
    return !isSearchRoute() && /^\/@[^/]+/.test(location.pathname) && !isOnVideoUrl();
  }

  function onFeedRoute() {
    if (isSearchRoute()) return false;
    const p = location.pathname.replace(/\/+$/, '') || '/';
    return CONFIG.routes.includes(p) || isOnVideoUrl();
  }

  function commentsOpen() {
    if (isSearchRoute()) return false;
    return !!document.querySelector(
      '[class*="SectionCommentSidebarContainer"], [class*="DivCommentContainer"], [class*="AsideCommentSidebar"], [class*="DivCommentSidebar"]'
    );
  }

  function cinemaOpen() {
    return !!document.querySelector('[class*="DivCinemaModeRoot"]');
  }

  function onMinimalistRoute() {
    if (isSearchRoute()) return false;
    return onFeedRoute() || commentsOpen();
  }

  const SVG_CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
  const SVG_FULLSCREEN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  const SVG_VOL_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.7L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05A4.47 4.47 0 0 0 16.5 12zM14 4.45v.2c0 .38.25.71.6.85a7 7 0 0 1 0 13c-.35.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85a9 9 0 0 0 0-16.8c-.58-.23-1.21.22-1.21.85z"/></svg>';
  const SVG_VOL_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3.63 3.63a1 1 0 0 0 0 1.41L7.29 8.7 7 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l3.29 3.29c.63.63 1.71.19 1.71-.7v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91a8.9 8.9 0 0 0 2.23-1.31l1.34 1.34a1 1 0 1 0 1.41-1.41L5.05 3.63a1 1 0 0 0-1.42 0zM19 12a6.97 6.97 0 0 1-.82 3.31l1.49 1.49A8.96 8.96 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-8.71-6.29-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0 0 14 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/></svg>';
  const SVG_SETTINGS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>';

  const ui = document.createElement('div');
  ui.id = UI_ID;

  const uiRight = document.createElement('div');
  uiRight.id = UI_ID + '-right';

  const btnClose = document.createElement('button');
  btnClose.innerHTML = SVG_CLOSE;
  btnClose.title = 'Exit Minimalist View (Esc)';
  btnClose.setAttribute('aria-label', 'Exit Minimalist View');
  btnClose.addEventListener('click', () => setEnabled(false));

  const btnFullscreen = document.createElement('button');
  btnFullscreen.innerHTML = SVG_FULLSCREEN;
  btnFullscreen.title = 'Toggle Fullscreen (F11)';
  btnFullscreen.setAttribute('aria-label', 'Toggle Fullscreen');
  btnFullscreen.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFullscreen();
  });

  const btnSettings = document.createElement('button');
  btnSettings.innerHTML = SVG_SETTINGS;
  btnSettings.title = 'Settings';
  btnSettings.setAttribute('aria-label', 'Settings');

  const menuSettings = document.createElement('div');
  menuSettings.id = 'tt-settings-menu';

  function positionSettingsMenu() {
    if (btnSettings && btnSettings.offsetParent !== null) {
      const rect = btnSettings.getBoundingClientRect();
      const menuWidth = 370;
      const left = Math.max(14, Math.min(rect.left, window.innerWidth - menuWidth - 14));
      menuSettings.style.top = (rect.bottom + 8) + 'px';
      menuSettings.style.left = left + 'px';
    } else {
      menuSettings.style.top = '60px';
      menuSettings.style.left = '20px';
    }
  }

  function toggleSettingsMenu(forceState) {
    injectUi();
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !menuSettings.classList.contains('tt-open');
    if (shouldOpen) {
      positionSettingsMenu();
      menuSettings.classList.add('tt-open');
    } else {
      menuSettings.classList.remove('tt-open');
    }
  }

  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSettingsMenu();
  });

  document.addEventListener('click', (e) => {
    if (menuSettings.classList.contains('tt-open')) {
      if (!btnSettings.contains(e.target) && !menuSettings.contains(e.target)) {
        menuSettings.classList.remove('tt-open');
      }
    }
  });

  const btnMute = document.createElement('button');
  btnMute.innerHTML = SVG_VOL_ON;
  btnMute.title = 'Mute / unmute (M)';
  btnMute.setAttribute('aria-label', 'Mute or unmute video');
  btnMute.addEventListener('click', toggleMute);

  const settingsWrapper = document.createElement('div');
  settingsWrapper.style.position = 'relative';
  settingsWrapper.style.display = 'flex';
  settingsWrapper.appendChild(btnSettings);

  ui.appendChild(btnClose);
  ui.appendChild(btnFullscreen);
  ui.appendChild(btnMute);

  uiRight.appendChild(settingsWrapper);

  const labels = {
    hideAll: 'Hide All UI Elements',
    sidebar: 'Left Side NavPanel',
    headerPills: 'Top Right Pills',
    caption: 'Captions',
    progressBar: 'Progress Bar',
    navButtons: 'Navigation Buttons',
    avatar: 'Creator Avatar',
    likeButton: 'Like Button',
    commentButton: 'Comments Button',
    favoriteButton: 'Favorites Button',
    shareButton: 'Share Button',
    musicButton: 'Music Button',
    squareCorners: 'Square Video Corners',
    fullscreenButton: 'Fullscreen Button',
    muteButton: 'Mute Button',
    closeButton: 'Close Button',
    spacebarPause: 'Spacebar Pause/play',
    settingsButton: 'Settings Button',
    autoHideVideoList: 'Auto Hide Comments Panel',
  };

  const settingRowMap = new Map();

  function makeToggle(labelText, checked, onChange, isFeature) {
    const row = document.createElement('div');
    row.className = 'tt-s-row';

    const span = document.createElement('span');
    span.className = 'tt-s-label';
    span.textContent = labelText;

    const tog = document.createElement('label');
    tog.className = 'tt-toggle';
    tog.addEventListener('click', e => e.stopPropagation());

    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = checked;
    if (isFeature) inp.dataset.feature = 'true';

    const track = document.createElement('span');
    track.className = 'tt-toggle-track';

    tog.appendChild(inp);
    tog.appendChild(track);

    inp.addEventListener('change', e => onChange(e.target.checked, row, inp));
    row.appendChild(span);
    row.appendChild(tog);
    row.addEventListener('click', () => inp.click());

    return { row, input: inp };
  }

  const heroCard = document.createElement('div');
  heroCard.className = 'tt-s-hero';

  const heroTitle = document.createElement('div');
  heroTitle.className = 'tt-s-hero-title';
  heroTitle.textContent = 'Minimalist Mode';

  const heroTog = document.createElement('label');
  heroTog.className = 'tt-toggle';
  heroTog.addEventListener('click', e => e.stopPropagation());

  const chkMinimalistMode = document.createElement('input');
  chkMinimalistMode.type = 'checkbox';
  chkMinimalistMode.checked = enabled;

  const heroTrack = document.createElement('span');
  heroTrack.className = 'tt-toggle-track';

  heroTog.appendChild(chkMinimalistMode);
  heroTog.appendChild(heroTrack);

  heroCard.appendChild(heroTitle);
  heroCard.appendChild(heroTog);

  chkMinimalistMode.addEventListener('change', e => {
    setEnabled(e.target.checked);
  });

  heroCard.addEventListener('click', () => {
    chkMinimalistMode.click();
  });

  menuSettings.appendChild(heroCard);

  const tabsNav = document.createElement('nav');
  tabsNav.className = 'tt-s-tabs';

  const contentArea = document.createElement('div');
  contentArea.className = 'tt-s-content';

  const panelGeneral = document.createElement('div');
  panelGeneral.className = 'tt-s-panel active';

  const { row: rowAutostart } = makeToggle(
    'Autostart Minimalist Mode', autostartEnabled,
    v => { autostartEnabled = v; setStorage(STORAGE_KEYS.AUTOSTART, v); },
    true
  );
  panelGeneral.appendChild(rowAutostart);

  ['squareCorners', 'fullscreenButton', 'muteButton', 'closeButton', 'settingsButton'].forEach(key => {
    const { row } = makeToggle(
      labels[key], settings[key],
      v => { settings[key] = v; applySettings(); },
      true
    );
    row.dataset.key = key;
    settingRowMap.set(key, row);
    panelGeneral.appendChild(row);
  });
  contentArea.appendChild(panelGeneral);

  const panelVisibility = document.createElement('div');
  panelVisibility.className = 'tt-s-panel';

  {
    const key = 'hideAll';
    const { row } = makeToggle(
      labels[key], settings[key],
      (v, _row, inp) => {
        settings[key] = v;
        applySettings();
        menuSettings.querySelectorAll('input').forEach(i => {
          if (i !== inp && !i.dataset.feature) {
            i.disabled = v;
            const r = i.closest('.tt-s-row');
            if (r) r.classList.toggle('tt-s-disabled', v);
          }
        });
      }
    );
    row.classList.add('tt-s-highlight');
    row.dataset.key = key;
    settingRowMap.set(key, row);
    panelVisibility.appendChild(row);
  }

  const subInterface = document.createElement('div');
  subInterface.className = 'tt-s-subheader';
  subInterface.textContent = 'Interface';
  panelVisibility.appendChild(subInterface);

  ['sidebar', 'headerPills', 'caption', 'progressBar', 'autoHideVideoList'].forEach(key => {
    const isFeature = key === 'autoHideVideoList';
    const { row, input: chk } = makeToggle(
      labels[key], settings[key],
      v => { settings[key] = v; applySettings(); },
      isFeature
    );
    row.dataset.key = key;
    settingRowMap.set(key, row);
    if (!isFeature && settings.hideAll) {
      chk.disabled = true;
      row.classList.add('tt-s-disabled');
    }
    panelVisibility.appendChild(row);
  });

  const subAction = document.createElement('div');
  subAction.className = 'tt-s-subheader';
  subAction.textContent = 'Action Bar';
  panelVisibility.appendChild(subAction);

  ['navButtons', 'avatar', 'likeButton', 'commentButton', 'favoriteButton', 'shareButton', 'musicButton'].forEach(key => {
    const { row, input: chk } = makeToggle(
      labels[key], settings[key],
      v => { settings[key] = v; applySettings(); },
      false
    );
    row.dataset.key = key;
    settingRowMap.set(key, row);
    if (settings.hideAll) {
      chk.disabled = true;
      row.classList.add('tt-s-disabled');
    }
    panelVisibility.appendChild(row);
  });
  contentArea.appendChild(panelVisibility);

  const panelPlayback = document.createElement('div');
  panelPlayback.className = 'tt-s-panel';

  const { row: rowBgPlay } = makeToggle(
    'Background Playback', bgPlaybackEnabled,
    v => { bgPlaybackEnabled = v; saveBgPlayback(); },
    true
  );
  panelPlayback.appendChild(rowBgPlay);

  {
    const key = 'spacebarPause';
    const { row } = makeToggle(
      labels[key], settings[key],
      v => { settings[key] = v; applySettings(); },
      true
    );
    row.dataset.key = key;
    settingRowMap.set(key, row);
    panelPlayback.appendChild(row);
  }

  const { row: rowHoldSpeed } = makeToggle(
    'Hold Spacebar to speed-up', holdSpeedEnabled,
    v => {
      holdSpeedEnabled = v;
      speedRow.style.opacity = v ? '1' : '0.4';
      speedRow.style.pointerEvents = v ? 'auto' : 'none';
      setStorage(STORAGE_KEYS.HOLD_SPEED_ENABLED, v);
    },
    true
  );
  panelPlayback.appendChild(rowHoldSpeed);

  const speedRow = document.createElement('div');
  speedRow.className = 'tt-s-stacked-row';
  speedRow.style.opacity = holdSpeedEnabled ? '1' : '0.4';
  speedRow.style.pointerEvents = holdSpeedEnabled ? 'auto' : 'none';

  const speedHeader = document.createElement('div');
  speedHeader.className = 'tt-s-stacked-header';

  const lblSpeedText = document.createElement('span');
  lblSpeedText.className = 'tt-s-label';
  lblSpeedText.textContent = 'Speed';

  const speedRateBadge = document.createElement('span');
  speedRateBadge.className = 'tt-s-badge';
  speedRateBadge.textContent = `${holdSpeedRate}x`;

  speedHeader.appendChild(lblSpeedText);
  speedHeader.appendChild(speedRateBadge);

  const segGroup = document.createElement('div');
  segGroup.className = 'tt-s-segmented';

  const speedOptions = [1.5, 2.0, 2.5, 3.0];
  const speedBtns = [];

  speedOptions.forEach(rate => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tt-s-seg-btn' + (holdSpeedRate === rate ? ' active' : '');
    btn.textContent = `${rate}x`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      holdSpeedRate = rate;
      speedRateBadge.textContent = `${rate}x`;
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setStorage(STORAGE_KEYS.HOLD_SPEED_RATE, rate);
      if (is2xActive && activeSpeedVideo) {
        activeSpeedVideo.playbackRate = rate;
      }
    });
    speedBtns.push(btn);
    segGroup.appendChild(btn);
  });

  speedRow.appendChild(speedHeader);
  speedRow.appendChild(segGroup);
  panelPlayback.appendChild(speedRow);

  let rngSeek;
  const durationRow = document.createElement('div');
  durationRow.className = 'tt-s-stacked-row';
  durationRow.style.opacity = seekEnabled ? '1' : '0.4';

  const { row: rowSeek } = makeToggle(
    'Arrow Key Seeking', seekEnabled,
    v => {
      seekEnabled = v;
      if (rngSeek) rngSeek.disabled = !v;
      durationRow.style.opacity = v ? '1' : '0.4';
      setStorage(STORAGE_KEYS.SEEK_ENABLED, v);
    },
    true
  );
  panelPlayback.appendChild(rowSeek);

  const stackedHeader = document.createElement('div');
  stackedHeader.className = 'tt-s-stacked-header';

  const lblSeekText = document.createElement('span');
  lblSeekText.className = 'tt-s-label';
  lblSeekText.textContent = 'Seek Jump Step';

  const seekDurBadge = document.createElement('span');
  seekDurBadge.className = 'tt-s-badge';
  seekDurBadge.textContent = `${seekDuration}s`;

  stackedHeader.appendChild(lblSeekText);
  stackedHeader.appendChild(seekDurBadge);

  rngSeek = document.createElement('input');
  rngSeek.type = 'range';
  rngSeek.min = '1';
  rngSeek.max = '30';
  rngSeek.step = '1';
  rngSeek.value = seekDuration;
  rngSeek.disabled = !seekEnabled;
  rngSeek.addEventListener('click', e => e.stopPropagation());
  rngSeek.addEventListener('input', e => {
    seekDuration = parseFloat(e.target.value) || 3;
    seekDurBadge.textContent = `${seekDuration}s`;
    setStorage(STORAGE_KEYS.SEEK_DUR, seekDuration);
  });

  const rangeMarks = document.createElement('div');
  rangeMarks.className = 'tt-s-range-marks';
  rangeMarks.innerHTML = '<span>1s</span><span>5s</span><span>10s</span><span>15s</span><span>20s</span><span>25s</span><span>30s</span>';

  durationRow.appendChild(stackedHeader);
  durationRow.appendChild(rngSeek);
  durationRow.appendChild(rangeMarks);
  panelPlayback.appendChild(durationRow);

  contentArea.appendChild(panelPlayback);

  const panelShortcuts = document.createElement('div');
  panelShortcuts.className = 'tt-s-panel';

  const shortcutsList = [
    { kbd: '<kbd>C</kbd>', desc: 'Toggle Minimalist Mode' },
    { kbd: '<kbd>M</kbd>', desc: 'Mute / Unmute Sound' },
    { kbd: '<kbd>Space</kbd>', desc: 'Play / Pause (Tap) • Speed-up (Hold)' },
    { kbd: '<kbd>←</kbd> <kbd>→</kbd>', desc: 'Seek Backward / Forward' },
    { kbd: '<kbd>F11</kbd>', desc: 'Fullscreen' },
  ];

  const shortcutsCard = document.createElement('div');
  shortcutsCard.className = 'tt-s-shortcuts';
  shortcutsList.forEach(item => {
    const scItem = document.createElement('div');
    scItem.className = 'tt-s-shortcut-item';
    scItem.innerHTML = `${item.kbd}<span>${item.desc}</span>`;
    shortcutsCard.appendChild(scItem);
  });
  panelShortcuts.appendChild(shortcutsCard);

  contentArea.appendChild(panelShortcuts);

  const tabDefs = [
    { id: 'general', label: 'General', panel: panelGeneral },
    { id: 'visibility', label: 'Visibility', panel: panelVisibility },
    { id: 'playback', label: 'Playback', panel: panelPlayback },
    { id: 'shortcuts', label: 'Shortcuts', panel: panelShortcuts },
  ];

  tabDefs.forEach((tab, index) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'tt-s-tab' + (index === 0 ? ' active' : '');
    tabBtn.textContent = tab.label;
    tabBtn.dataset.tab = tab.id;

    tabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tabsNav.querySelectorAll('.tt-s-tab').forEach(b => b.classList.remove('active'));
      contentArea.querySelectorAll('.tt-s-panel').forEach(p => p.classList.remove('active'));
      tabBtn.classList.add('active');
      tab.panel.classList.add('active');
    });

    tabsNav.appendChild(tabBtn);
  });

  menuSettings.appendChild(tabsNav);
  menuSettings.appendChild(contentArea);

  if (typeof GM_registerMenuCommand !== 'undefined') {
    GM_registerMenuCommand('⚙️ Control Panel Settings', () => {
      toggleSettingsMenu();
    });
  }

  function injectUi() {
    if (document.body) {
      if (!document.getElementById(UI_ID)) {
        document.body.appendChild(ui);
        document.body.appendChild(uiRight);
      }
      if (!document.getElementById('tt-settings-menu')) {
        document.body.appendChild(menuSettings);
      }
    }
  }

  if (document.body) injectUi();
  else new MutationObserver((_m, o) => {
    if (document.body) { injectUi(); o.disconnect(); }
  }).observe(document.documentElement, { childList: true });

  function activeVideo() {
    let vids = document.querySelectorAll('article[data-e2e="recommend-list-item-container"] video');
    if (!vids.length) vids = document.querySelectorAll('video');
    let best = null, bd = Infinity;
    const centerY = window.innerHeight / 2;
    vids.forEach(v => {
      const r = v.getBoundingClientRect();
      if (r.height < 10) return;
      const d = Math.abs((r.top + r.bottom) / 2 - centerY);
      if (d < bd) { bd = d; best = v; }
    });
    return best;
  }

  function activeAudio() {
    const a = document.querySelector('audio');
    if (a) return a;
    return Array.from(document.querySelectorAll('video')).find(v => v.getBoundingClientRect().height < 10 && v.src) || null;
  }

  let currentMuteIconState = false;

  function syncMuteIcon() {
    if (currentMuteIconState !== isMuted) {
      currentMuteIconState = isMuted;
      btnMute.innerHTML = isMuted ? SVG_VOL_OFF : SVG_VOL_ON;
    }

    const v = activeVideo();
    const a = activeAudio();
    [v, a].forEach(el => {
      if (!el) return;
      if (el.muted !== isMuted) el.muted = isMuted;
      if (!isMuted && el.volume === 0) el.volume = 0.5;
    });
  }

  function toggleMute() {
    isMuted = !isMuted;
    syncMuteIcon();
  }

  function activeArticle() {
    let best = null, bd = Infinity;
    const centerY = window.innerHeight / 2;
    document.querySelectorAll('article[data-e2e="recommend-list-item-container"]').forEach(a => {
      const r = a.getBoundingClientRect();
      if (r.height === 0) return;
      const d = Math.abs((r.top + r.bottom) / 2 - centerY);
      if (d < bd) { bd = d; best = a; }
    });
    return best;
  }

  let rafGeometryScheduled = false;
  function syncGeometry() {
    const activeArt = activeArticle();
    document.querySelectorAll('article.' + ACTIVE_CLS).forEach(a => {
      if (a !== activeArt) a.classList.remove(ACTIVE_CLS);
    });
    if (!activeArt) return;
    if (!activeArt.classList.contains(ACTIVE_CLS)) {
      activeArt.classList.add(ACTIVE_CLS);
    }

    const bar = activeArt.querySelector('[class*="SectionActionBarContainer"]');
    if (bar) {
      const h = Math.round(bar.getBoundingClientRect().height);
      if (h > 0) {
        const val = h + 'px';
        if (document.documentElement.style.getPropertyValue('--tt-stack-h') !== val) {
          document.documentElement.style.setProperty('--tt-stack-h', val);
        }
      }
    }

    if (CONFIG.captionScreenLeft) {
      document.querySelectorAll('article[data-e2e="recommend-list-item-container"]').forEach(art => {
        const card = art.querySelector('[class*="SectionMediaCardContainer"]');
        if (!card) return;
        const artRect = art.getBoundingClientRect();
        const artWidthVal = Math.round(artRect.width) + 'px';
        if (art.style.getPropertyValue('--tt-art-width') !== artWidthVal) {
          art.style.setProperty('--tt-art-width', artWidthVal);
        }

        const cap = card.querySelector('[class*="DivMediaCardOverlayBottomSection"]');
        if (cap) {
          const currentCapX = parseFloat(art.style.getPropertyValue('--tt-cap-x')) || 0;
          const currentCapY = parseFloat(art.style.getPropertyValue('--tt-cap-y')) || 0;
          const rect = cap.getBoundingClientRect();
          const naturalLeft = rect.left - currentCapX;
          const naturalBottom = rect.bottom - currentCapY;
          const targetLeft = artRect.left + 24;
          const targetBottom = artRect.bottom - (CONFIG.progressFullWidth ? 20 : 12);
          const newCapX = Math.round(targetLeft - naturalLeft) + 'px';
          const newCapY = Math.round(targetBottom - naturalBottom) + 'px';

          if (art.style.getPropertyValue('--tt-cap-x') !== newCapX) {
            art.style.setProperty('--tt-cap-x', newCapX);
          }
          if (art.style.getPropertyValue('--tt-cap-y') !== newCapY) {
            art.style.setProperty('--tt-cap-y', newCapY);
          }
        }

        if (CONFIG.progressFullWidth) {
          const prog = card.querySelector('[class*="DivVideoProgressContainer"]');
          if (prog) {
            const currentProgX = parseFloat(art.style.getPropertyValue('--tt-prog-x')) || 0;
            const currentProgY = parseFloat(art.style.getPropertyValue('--tt-prog-y')) || 0;
            const rect = prog.getBoundingClientRect();
            const naturalLeft = rect.left - currentProgX;
            const naturalBottom = rect.bottom - currentProgY;
            const targetLeft = artRect.left + (window.innerWidth * 0.01);
            const targetBottom = artRect.bottom - 10;
            const newProgX = Math.round(targetLeft - naturalLeft) + 'px';
            const newProgY = Math.round(targetBottom - naturalBottom) + 'px';

            if (art.style.getPropertyValue('--tt-prog-x') !== newProgX) {
              art.style.setProperty('--tt-prog-x', newProgX);
            }
            if (art.style.getPropertyValue('--tt-prog-y') !== newProgY) {
              art.style.setProperty('--tt-prog-y', newProgY);
            }
          }
        }
      });
    }
  }

  function scheduleSyncGeometry() {
    if (rafGeometryScheduled) return;
    rafGeometryScheduled = true;
    requestAnimationFrame(() => {
      rafGeometryScheduled = false;
      syncGeometry();
    });
  }

  function toggleFullscreen() {
    const art = activeArticle();
    const savedY = window.scrollY;

    function restoreScroll() {
      if (art) {
        art.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      }
    }

    function scheduleRestore() {
      restoreScroll();
      requestAnimationFrame(() => {
        restoreScroll();
        requestAnimationFrame(() => {
          restoreScroll();
          setTimeout(restoreScroll, 80);
        });
      });
    }

    document.addEventListener('fullscreenchange', scheduleRestore, { once: true });
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        document.removeEventListener('fullscreenchange', scheduleRestore);
        console.warn('Fullscreen failed:', err.message);
      });
    } else {
      document.exitFullscreen().catch(() => {
        document.removeEventListener('fullscreenchange', scheduleRestore);
      });
    }
  }

  const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const doc = win.document || document;

  try {
    Object.defineProperty(doc, 'visibilityState', {
      get: () => 'visible',
      configurable: true
    });
    Object.defineProperty(doc, 'hidden', {
      get: () => false,
      configurable: true
    });
  } catch (e) { }

  const blockVisibilityChange = (event) => {
    if (bgPlaybackEnabled) {
      event.stopImmediatePropagation();
    }
  };

  win.addEventListener('visibilitychange', blockVisibilityChange, true);
  doc.addEventListener('visibilitychange', blockVisibilityChange, true);
  doc.addEventListener('webkitvisibilitychange', blockVisibilityChange, true);

  win.addEventListener('blur', (event) => {
    if (bgPlaybackEnabled && (event.target === win || event.target === doc)) {
      event.stopImmediatePropagation();
    }
  }, true);

  function saveBgPlayback() {
    setStorage(STORAGE_KEYS.BG_PLAY, bgPlaybackEnabled);
  }

  function applySettings() {
    setStorage(STORAGE_KEYS.SETTINGS, settings);
    const html = document.documentElement;
    const isSearch = isSearchRoute();

    if (isSearch) {
      Object.keys(settings).forEach(key => {
        if (key === 'hideAll') return;
        html.classList.remove('tt-opt-' + key);
        html.classList.remove('tt-hide-' + key);
      });
    } else {
      const hideAll = settings.hideAll;
      Object.keys(settings).forEach(key => {
        if (key === 'hideAll') return;
        if (['squareCorners', 'fullscreenButton', 'muteButton', 'autoHideVideoList'].includes(key)) {
          html.classList.toggle('tt-opt-' + key, settings[key]);
        } else {
          html.classList.toggle('tt-hide-' + key, hideAll || !settings[key]);
        }
      });
    }

    syncUi();
  }

  function syncUi() {
    const isSearch = isSearchRoute();
    const active = !isSearch && enabled && onMinimalistRoute();
    ui.style.display = (isSearch || !onMinimalistRoute() || cinemaOpen()) ? 'none' : 'flex';
    uiRight.style.display = (isSearch || !onMinimalistRoute() || cinemaOpen() || active) ? 'none' : 'flex';

    if (active) {
      if (ui.children[0] !== btnClose) ui.insertBefore(btnClose, ui.children[0] || null);
      if (ui.children[1] !== settingsWrapper) ui.insertBefore(settingsWrapper, ui.children[1] || null);
      if (ui.children[2] !== btnFullscreen) ui.insertBefore(btnFullscreen, ui.children[2] || null);
      if (ui.children[3] !== btnMute) ui.insertBefore(btnMute, ui.children[3] || null);
    } else {
      if (uiRight.children[0] !== settingsWrapper) uiRight.insertBefore(settingsWrapper, uiRight.children[0] || null);
      if (uiRight.children[1] !== btnFullscreen) uiRight.insertBefore(btnFullscreen, uiRight.children[1] || null);
      if (uiRight.children[2] !== btnMute) uiRight.insertBefore(btnMute, uiRight.children[2] || null);
    }

    if (typeof chkMinimalistMode !== 'undefined' && chkMinimalistMode) {
      chkMinimalistMode.checked = enabled;
    }

    const rowClose = settingRowMap.get('closeButton');
    if (rowClose) rowClose.style.display = active ? 'flex' : 'none';

    ['sidebar', 'headerPills'].forEach(k => {
      const row = settingRowMap.get(k);
      if (row) row.style.display = active ? 'none' : 'flex';
    });

    const rowAutoHide = settingRowMap.get('autoHideVideoList');
    if (rowAutoHide) rowAutoHide.style.display = 'flex';

    btnClose.style.display = (active && settings.closeButton) ? 'flex' : 'none';
    btnFullscreen.style.display = settings.fullscreenButton ? 'flex' : 'none';
    btnSettings.style.display = settings.settingsButton ? 'flex' : 'none';
    btnMute.style.display = settings.muteButton ? 'flex' : 'none';
  }

  function setEnabled(v) {
    enabled = v;
    apply();
  }

  function apply() {
    const isSearch = isSearchRoute();
    const active = !isSearch && enabled && onMinimalistRoute();
    const html = document.documentElement;

    html.classList.toggle(ROOT_CLS, active);
    html.classList.toggle(COMMENTS_CLS, active && commentsOpen());
    html.classList.toggle('tt-comments-open', !isSearch && commentsOpen());
    html.classList.toggle('tt-show-video-list', !isSearch && (window._ttVideoListUnhidden || commentsOpen()));
    html.classList.toggle('tt-route-video', !isSearch && isOnVideoUrl());
    html.classList.toggle('tt-route-profile', !isSearch && isProfileRoute());

    applySettings();
  }

  /* ─ Fast-Forward Speed on Hold Space ─ */
  let isSpaceDown = false;
  let spaceHoldTimer = null;
  let is2xActive = false;
  let activeSpeedVideo = null;
  let originalPlaybackRate = 1;

  function start2xSpeed() {
    if (!holdSpeedEnabled || is2xActive) return;
    const vid = activeVideo();
    if (!vid) return;
    activeSpeedVideo = vid;
    originalPlaybackRate = vid.playbackRate || 1;
    vid.playbackRate = holdSpeedRate;
    is2xActive = true;
  }

  function stop2xSpeed() {
    if (spaceHoldTimer) {
      clearTimeout(spaceHoldTimer);
      spaceHoldTimer = null;
    }
    if (is2xActive) {
      if (activeSpeedVideo) {
        try {
          activeSpeedVideo.playbackRate = originalPlaybackRate || 1.0;
        } catch (e) { }
      }
      const curVid = activeVideo();
      if (curVid && curVid !== activeSpeedVideo) {
        try {
          curVid.playbackRate = 1.0;
        } catch (e) { }
      }
      is2xActive = false;
      activeSpeedVideo = null;
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuSettings.classList.contains('tt-open')) {
      menuSettings.classList.remove('tt-open');
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) return;

    if (isSearchRoute()) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (seekEnabled) {
        e.stopPropagation();
        e.preventDefault();
        const vid = activeVideo();
        if (vid) {
          vid.currentTime = Math.max(0, Math.min(
            vid.duration || Infinity,
            vid.currentTime + (e.key === 'ArrowRight' ? seekDuration : -seekDuration)
          ));
        }
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space') {
      if ((onMinimalistRoute() || activeVideo()) && (holdSpeedEnabled || settings.spacebarPause)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) {
          if (holdSpeedEnabled && !is2xActive) start2xSpeed();
          return;
        }
        if (!isSpaceDown) {
          isSpaceDown = true;
          if (spaceHoldTimer) clearTimeout(spaceHoldTimer);
          if (holdSpeedEnabled) {
            spaceHoldTimer = setTimeout(() => {
              if (isSpaceDown) {
                start2xSpeed();
              }
            }, 200);
          }
        }
        return;
      }
    }

    const k = (e.key || '').toLowerCase();
    if (e.key === 'Escape' && enabled && onMinimalistRoute()) {
      setEnabled(false);
    } else if (k === CONFIG.toggleKey && onMinimalistRoute()) {
      setEnabled(!enabled);
    } else if (k === CONFIG.muteKey && enabled && onMinimalistRoute()) {
      toggleMute();
    }
  }, true);

  window.addEventListener('keyup', (e) => {
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) return;

    if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space') {
      if (isSpaceDown) {
        e.preventDefault();
        e.stopPropagation();
        const was2x = is2xActive;
        isSpaceDown = false;
        stop2xSpeed();

        if (!was2x && settings.spacebarPause && (onMinimalistRoute() || activeVideo())) {
          const vid = activeVideo();
          if (vid) {
            if (vid.paused) vid.play();
            else vid.pause();
          }
        }
      }
    }
  }, true);

  window.addEventListener('blur', () => {
    isSpaceDown = false;
    stop2xSpeed();
  });

  let lastKey = null;
  window._ttVideoListUnhidden = false;
  let lastVideoUrl = location.href;
  let navigatedByLink = false;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href) {
      navigatedByLink = true;
      setTimeout(() => (navigatedByLink = false), 1000);
    }

    if (!isSearchRoute() && e.target.closest('[data-e2e="comment-icon"]')) {
      window._ttVideoListUnhidden = true;
      apply();
    }
  }, true);

  setInterval(() => {
    const key = location.pathname + location.search + '|' + enabled + '|' + commentsOpen();
    if (key !== lastKey) {
      lastKey = key;
      apply();
    }
  }, 50);

  setInterval(() => {
    injectStyle();
    injectUi();
    if (location.href !== lastVideoUrl) {
      lastVideoUrl = location.href;
      if (navigatedByLink || (!isOnVideoUrl() && !['/foryou', '/following', '/friends'].includes(location.pathname))) {
        window._ttVideoListUnhidden = false;
      }
    }
    if (!isSearchRoute() && document.documentElement.classList.contains(ROOT_CLS)) {
      syncMuteIcon();
      scheduleSyncGeometry();
    }
  }, 500);

  window.addEventListener('popstate', apply);
  window.addEventListener('scroll', scheduleSyncGeometry, { passive: true });
  window.addEventListener('resize', () => {
    if (menuSettings.classList.contains('tt-open')) {
      positionSettingsMenu();
    }
    scheduleSyncGeometry();
  });

  apply();
})();