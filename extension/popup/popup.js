
document.addEventListener('DOMContentLoaded', async () => {
  const headerEnabledToggle = document.getElementById('headerEnabledToggle');
  const masterToggle = document.getElementById('masterToggle');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const btnOpenTikTok = document.getElementById('btnOpenTikTok');

  const chkAutostart = document.getElementById('chk-autostart');
  const chkBgPlayback = document.getElementById('chk-bgPlayback');
  const chkSeekEnabled = document.getElementById('chk-seekEnabled');
  const rngSeekDuration = document.getElementById('rng-seekDuration');
  const seekDurBadge = document.getElementById('seekDurBadge');
  const seekDurationRow = document.getElementById('seekDurationRow');

  const settingKeys = [
    'squareCorners',
    'fullscreenButton',
    'muteButton',
    'closeButton',
    'hideAll',
    'sidebar',
    'headerPills',
    'caption',
    'progressBar',
    'autoHideVideoList',
    'navButtons',
    'avatar',
    'likeButton',
    'commentButton',
    'favoriteButton',
    'shareButton',
    'musicButton',
    'spacebarPause',
  ];

  const state = {
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
  };

  let activeTabId = null;

  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      navTabs.forEach((t) => t.classList.remove('active'));
      tabPanels.forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  if (btnOpenTikTok) {
    btnOpenTikTok.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.tiktok.com' });
    });
  }

  async function loadState() {
    const stored = await chrome.storage.local.get([
      'extensionActive',
      'enabled',
      'autostartEnabled',
      'bgPlaybackEnabled',
      'seekEnabled',
      'seekDuration',
      'settings',
    ]);

    if (typeof stored.extensionActive === 'boolean') state.extensionActive = stored.extensionActive;
    if (typeof stored.enabled === 'boolean') state.enabled = stored.enabled;
    if (typeof stored.autostartEnabled === 'boolean') state.autostartEnabled = stored.autostartEnabled;
    if (typeof stored.bgPlaybackEnabled === 'boolean') state.bgPlaybackEnabled = stored.bgPlaybackEnabled;
    if (typeof stored.seekEnabled === 'boolean') state.seekEnabled = stored.seekEnabled;
    if (typeof stored.seekDuration === 'number') state.seekDuration = stored.seekDuration;
    if (stored.settings) state.settings = { ...state.settings, ...stored.settings };

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('tiktok.com')) {
      activeTabId = tab.id;

      try {
        const res = await chrome.tabs.sendMessage(tab.id, { action: 'GET_STATE' });
        if (res) {
          if (typeof res.extensionActive === 'boolean') state.extensionActive = res.extensionActive;
          if (typeof res.enabled === 'boolean') state.enabled = res.enabled;
          if (typeof res.autostartEnabled === 'boolean') state.autostartEnabled = res.autostartEnabled;
          if (typeof res.bgPlaybackEnabled === 'boolean') state.bgPlaybackEnabled = res.bgPlaybackEnabled;
          if (typeof res.seekEnabled === 'boolean') state.seekEnabled = res.seekEnabled;
          if (typeof res.seekDuration === 'number') state.seekDuration = res.seekDuration;
          if (res.settings) state.settings = { ...state.settings, ...res.settings };
        }
      } catch (e) {
      }
    }

    renderUi();
  }

  function renderUi() {
    if (headerEnabledToggle) headerEnabledToggle.checked = state.extensionActive;

    const header = document.querySelector('.popup-header');
    if (header) header.classList.toggle('ext-disabled', !state.extensionActive);

    if (masterToggle) masterToggle.checked = state.enabled;
    chkAutostart.checked = state.autostartEnabled;
    chkBgPlayback.checked = state.bgPlaybackEnabled;
    chkSeekEnabled.checked = state.seekEnabled;
    rngSeekDuration.value = state.seekDuration;
    seekDurBadge.textContent = `${state.seekDuration}s`;

    seekDurationRow.style.opacity = state.seekEnabled ? '1' : '0.4';
    rngSeekDuration.disabled = !state.seekEnabled;

    settingKeys.forEach((key) => {
      const chk = document.getElementById(`chk-${key}`);
      if (chk) {
        chk.checked = !!state.settings[key];
        const row = chk.closest('.setting-row');
        if (row && key !== 'hideAll') {
          if (state.settings.hideAll && !['squareCorners', 'fullscreenButton', 'muteButton', 'closeButton', 'spacebarPause', 'autoHideVideoList'].includes(key)) {
            chk.disabled = true;
            row.classList.add('disabled');
          } else {
            chk.disabled = false;
            row.classList.remove('disabled');
          }
        }
      }
    });
  }

  async function persistAndSync() {
    await chrome.storage.local.set({
      extensionActive: state.extensionActive,
      enabled: state.enabled,
      autostartEnabled: state.autostartEnabled,
      bgPlaybackEnabled: state.bgPlaybackEnabled,
      seekEnabled: state.seekEnabled,
      seekDuration: state.seekDuration,
      settings: state.settings,
    });

    const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'UPDATE_ALL',
        extensionActive: state.extensionActive,
        enabled: state.enabled,
        autostartEnabled: state.autostartEnabled,
        bgPlaybackEnabled: state.bgPlaybackEnabled,
        seekEnabled: state.seekEnabled,
        seekDuration: state.seekDuration,
        settings: state.settings,
      }).catch(() => { });
    });
  }


  if (headerEnabledToggle) {
    headerEnabledToggle.addEventListener('change', async (e) => {
      state.extensionActive = e.target.checked;
      renderUi();
      await persistAndSync();
    });
  }

  if (masterToggle) {
    masterToggle.addEventListener('change', async (e) => {
      state.enabled = e.target.checked;
      renderUi();
      await persistAndSync();
    });
  }

  chkAutostart.addEventListener('change', async (e) => {
    state.autostartEnabled = e.target.checked;
    await persistAndSync();
  });

  chkBgPlayback.addEventListener('change', async (e) => {
    state.bgPlaybackEnabled = e.target.checked;
    await persistAndSync();
  });

  chkSeekEnabled.addEventListener('change', async (e) => {
    state.seekEnabled = e.target.checked;
    renderUi();
    await persistAndSync();
  });

  rngSeekDuration.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) || 3;
    state.seekDuration = val;
    seekDurBadge.textContent = `${val}s`;
  });

  rngSeekDuration.addEventListener('change', async () => {
    await persistAndSync();
  });

  settingKeys.forEach((key) => {
    const chk = document.getElementById(`chk-${key}`);
    if (chk) {
      chk.addEventListener('change', async (e) => {
        state.settings[key] = e.target.checked;
        if (key === 'hideAll') {
          renderUi();
        }
        await persistAndSync();
      });
    }
  });

  await loadState();
});
