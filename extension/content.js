(function () {
  'use strict';

  const CONFIG = {
    enabledByDefault: false,
    routes: ['/', '/foryou', '/following', '/friends'],
    fullHeightVideo: false,
    actionBarRight: true,
    arrowsAboveStack: true,
    captionScreenLeft: true,
    progressFullWidth: true,
    hideScrollbar: true,
    toggleKey: 'c',
    muteKey: 'm',

    show: {
      squareCorners: false,
      fullscreenButton: false,
      muteButton: false,
      closeButton: false,
      spacebarPause: false,
      autoHideVideoList: false,

      hideAll: false,
      sidebar: true,
      headerPills: true,
      caption: true,
      progressBar: true,

      navButtons: true,
      avatar: true,
      likeButton: true,
      commentButton: true,
      favoriteButton: true,
      shareButton: true,
      musicButton: true,
    },
  };

  const STORAGE_KEYS = {
    SETTINGS: 'tt-minimalist-feed:settings',
    AUTOSTART: 'tt-minimalist-feed:autostart',
    SEEK_DUR: 'tt-minimalist-feed:seekDur',
    SEEK_ENABLED: 'tt-minimalist-feed:seekEnabled',
    BG_PLAY: 'tt-minimalist-feed:bgPlayback',
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
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const map = {
          [STORAGE_KEYS.SETTINGS]: 'settings',
          [STORAGE_KEYS.AUTOSTART]: 'autostartEnabled',
          [STORAGE_KEYS.SEEK_DUR]: 'seekDuration',
          [STORAGE_KEYS.SEEK_ENABLED]: 'seekEnabled',
          [STORAGE_KEYS.BG_PLAY]: 'bgPlaybackEnabled',
        };
        const prop = map[key];
        if (prop) chrome.storage.local.set({ [prop]: val });
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
html.${ROOT_CLS}, html.${ROOT_CLS} body { background: #000 !important; }
html.${ROOT_CLS} body { overflow-x: clip !important; }
html.${ROOT_CLS} #app-header { position: static !important; height: auto !important; padding: 0 !important; }
html.${ROOT_CLS} [class*="BaseBodyContainer"],
html.${ROOT_CLS} [class*="DivMainContainer"] {
  display: block !important;
  padding: 0 !important;
  margin: 0 !important;
}
html.${ROOT_CLS} main[id^="main-content-"] {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
  background: #000 !important;
}
html.${ROOT_CLS} #column-list-container {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
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
  background: #121212 !important;
  animation: slideInFromRight 0.3s ease forwards !important;
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
html:not([data-theme="dark"]) #${UI_ID}-right button {
  color: #121212;
}
html:not([data-theme="dark"]) #${UI_ID} button:hover,
html:not([data-theme="dark"]) #${UI_ID}-right button:hover {
  background: rgba(0,0,0,.08);
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
  let isMuted = false;
  let extensionActive = true;

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
  const SVG_VOL_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.7L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05A4.47 4.47 0 0 0 16.5 12zM14 4.45v.2c0 .38.25.71.6.85a7 7 0 0 1 0 13c-.35.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85a9 9 0 0 0 0-16.8c-.58-.23-1.21.22-1.21.85z"/></svg>';
  const SVG_VOL_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3.63 3.63a1 1 0 0 0 0 1.41L7.29 8.7 7 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l3.29 3.29c.63.63 1.71.19 1.71-.7v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91a8.9 8.9 0 0 0 2.23-1.31l1.34 1.34a1 1 0 1 0 1.41-1.41L5.05 3.63a1 1 0 0 0-1.42 0zM19 12a6.97 6.97 0 0 1-.82 3.31l1.49 1.49A8.96 8.96 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-8.71-6.29-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0 0 14 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/></svg>';

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

  const btnMute = document.createElement('button');
  btnMute.innerHTML = SVG_VOL_ON;
  btnMute.title = 'Mute / unmute (M)';
  btnMute.setAttribute('aria-label', 'Mute or unmute video');
  btnMute.addEventListener('click', toggleMute);

  ui.appendChild(btnClose);
  ui.appendChild(btnFullscreen);
  ui.appendChild(btnMute);


  function injectUi() {
    if (document.body && !document.getElementById(UI_ID)) {
      document.body.appendChild(ui);
      document.body.appendChild(uiRight);
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
      if (ui.children[1] !== btnFullscreen) ui.insertBefore(btnFullscreen, ui.children[1] || null);
      if (ui.children[2] !== btnMute) ui.insertBefore(btnMute, ui.children[2] || null);
    } else {
      if (uiRight.children[0] !== btnFullscreen) uiRight.insertBefore(btnFullscreen, uiRight.children[0] || null);
      if (uiRight.children[1] !== btnMute) uiRight.insertBefore(btnMute, uiRight.children[1] || null);
    }

    btnClose.style.display = (active && settings.closeButton) ? 'flex' : 'none';
    btnFullscreen.style.display = settings.fullscreenButton ? 'flex' : 'none';
    btnMute.style.display = settings.muteButton ? 'flex' : 'none';
  }

  function setEnabled(v) {
    enabled = v;
    apply();
  }

  function apply() {
    const html = document.documentElement;

    if (!extensionActive) {
      html.classList.remove(ROOT_CLS, COMMENTS_CLS, 'tt-comments-open', 'tt-show-video-list', 'tt-route-video', 'tt-route-profile');
      Object.keys(settings).forEach(key => {
        if (key === 'hideAll') return;
        html.classList.remove('tt-opt-' + key, 'tt-hide-' + key);
      });
      if (ui) ui.style.display = 'none';
      if (uiRight) uiRight.style.display = 'none';
      return;
    }

    const isSearch = isSearchRoute();
    const active = !isSearch && enabled && onMinimalistRoute();

    html.classList.toggle(ROOT_CLS, active);
    html.classList.toggle(COMMENTS_CLS, active && commentsOpen());
    html.classList.toggle('tt-comments-open', !isSearch && commentsOpen());
    html.classList.toggle('tt-show-video-list', !isSearch && (window._ttVideoListUnhidden || commentsOpen()));
    html.classList.toggle('tt-route-video', !isSearch && isOnVideoUrl());
    html.classList.toggle('tt-route-profile', !isSearch && isProfileRoute());

    applySettings();
  }

  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) return;

    if (!extensionActive || isSearchRoute()) return;

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

    const k = (e.key || '').toLowerCase();
    if (e.key === 'Escape' && enabled && onMinimalistRoute()) {
      setEnabled(false);
    } else if (k === CONFIG.toggleKey && onMinimalistRoute()) {
      setEnabled(!enabled);
    } else if (k === CONFIG.muteKey && enabled && onMinimalistRoute()) {
      toggleMute();
    } else if (e.key === ' ' && onMinimalistRoute() && settings.spacebarPause) {
      e.preventDefault();
      e.stopPropagation();
      const vid = activeVideo();
      if (vid) {
        if (vid.paused) vid.play();
        else vid.pause();
      }
    }
  }, true);

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
    const key = location.pathname + location.search + '|' + enabled + '|' + commentsOpen() + '|' + extensionActive;
    if (key !== lastKey) {
      lastKey = key;
      apply();
    }
  }, 50);

  setInterval(() => {
    injectStyle();
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

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (!request || !request.action) return;

      if (request.action === 'GET_STATE') {
        sendResponse({
          enabled,
          autostartEnabled,
          settings,
          seekDuration,
          seekEnabled,
          bgPlaybackEnabled,
          extensionActive,
          isMinimalistRoute: onMinimalistRoute(),
        });
        return true;
      }

      if (request.action === 'SET_EXTENSION_ACTIVE') {
        extensionActive = !!request.value;
        apply();
        sendResponse({ extensionActive });
        return true;
      }

      if (request.action === 'TOGGLE_ENABLED') {
        setEnabled(!enabled);
        sendResponse({ enabled });
        return true;
      }

      if (request.action === 'SET_ENABLED') {
        setEnabled(!!request.value);
        sendResponse({ enabled });
        return true;
      }

      if (request.action === 'UPDATE_ALL') {
        if (typeof request.enabled === 'boolean') enabled = request.enabled;
        if (typeof request.autostartEnabled === 'boolean') autostartEnabled = request.autostartEnabled;
        if (request.settings) settings = { ...settings, ...request.settings };
        if (typeof request.seekDuration === 'number') seekDuration = request.seekDuration;
        if (typeof request.seekEnabled === 'boolean') seekEnabled = request.seekEnabled;
        if (typeof request.bgPlaybackEnabled === 'boolean') {
          bgPlaybackEnabled = request.bgPlaybackEnabled;
          saveBgPlayback();
        }
        if (typeof request.extensionActive === 'boolean') extensionActive = request.extensionActive;

        setStorage(STORAGE_KEYS.SETTINGS, settings);
        setStorage(STORAGE_KEYS.AUTOSTART, autostartEnabled);
        setStorage(STORAGE_KEYS.SEEK_DUR, seekDuration);
        setStorage(STORAGE_KEYS.SEEK_ENABLED, seekEnabled);
        apply();
        sendResponse({ success: true });
        return true;
      }
    });
  }

  apply();
})();
