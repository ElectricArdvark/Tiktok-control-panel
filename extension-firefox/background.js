
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      extensionActive: true,
      enabled: false,
      autostartEnabled: false,
      bgPlaybackEnabled: false,
      seekEnabled: true,
      seekDuration: 3,
      settings: {
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
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-minimalist') {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab && tab.id && tab.url && tab.url.includes('tiktok.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_ENABLED' }).catch(() => { });
    }
  }
});
