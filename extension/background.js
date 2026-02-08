let isCapturing = false;
let currentTabId = null;
let currentSettings = null;
let offscreenReady = false;
let sessionStartTime = null;
let guestAutoStopTimerId = null;
const GUEST_FREE_MINUTES = 3;
const API_BASE_URL = 'https://translateme-app.vercel.app';
let minutesBalance = null;

async function getUserId() {
  // Временно используем тестовый fingerprint для проверки БД
  return 'test_fingerprint_123';
}

async function checkMinutesAvailability() {
  try {
    const userId = await getUserId();

    const response = await fetch(
      // `http://localhost:3000/api/minutes?fingerprint=${userId}`,
      `${API_BASE_URL}/api/minutes?fingerprint=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.ok) {
      const data = await response.json();
      const allowed = data.free_minutes_used <= 3;
      const free_minutes_available = Math.max(0, 3 - data.free_minutes_used);

      const formattedData = {
        allowed: allowed,
        free_minutes_available: free_minutes_available,
        free_minutes_used: data.free_minutes_used || 0,
        paid_minutes_left: data.paid_minutes_left || 0,
        limitReached: data.limitReached || false,
        canUseFree: data.canUseFree || true,
      };

      // Сохраняем баланс
      minutesBalance = formattedData;
      chrome.storage.local.set({ minutesBalance: formattedData });

      return formattedData;
    } else {
      const localData = await chrome.storage.local.get(['guestMinutesUsed']);
      const used = localData.guestMinutesUsed || 0;
      const remaining = Math.max(0, GUEST_FREE_MINUTES - used);
      return {
        allowed: remaining > 0,
        free_minutes_available: remaining,
        free_minutes_used: used,
        paid_minutes_left: 0,
        total_available: remaining,
        email: 'Guest (fallback)',
        reason: remaining <= 0 ? 'local_limit_reached' : null,
      };
    }
  } catch (error) {
    const localData = await chrome.storage.local.get(['guestMinutesUsed']);
    const used = localData.guestMinutesUsed || 0;
    const remaining = Math.max(0, GUEST_FREE_MINUTES - used);
    return {
      allowed: remaining > 0,
      free_minutes_available: remaining,
      free_minutes_used: used,
      paid_minutes_left: 0,
      total_available: remaining,
      email: 'Guest (fallback)',
      reason: remaining <= 0 ? 'local_limit_reached' : null,
    };
  }
}

async function deductMinutesUsed(minutesUsed) {
  try {
    const userId = await getUserId();
    // const response = await fetch(`http://localhost:3000/api/minutes`,
    const response = await fetch(`${API_BASE_URL}/api/minutes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint: userId,
        minutes_used: minutesUsed,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      // Fallback на localStorage
      const localData = await chrome.storage.local.get(['guestMinutesUsed']);
      const newUsed = (localData.guestMinutesUsed || 0) + minutesUsed;
      await chrome.storage.local.set({ guestMinutesUsed: newUsed });
    }
  } catch (error) {
    const localData = await chrome.storage.local.get(['guestMinutesUsed']);
    const newUsed = (localData.guestMinutesUsed || 0) + minutesUsed;
    await chrome.storage.local.set({ guestMinutesUsed: newUsed });
  }
}

// ==================== ОСНОВНАЯ ФУНКЦИЯ ====================
async function startTabCapture(tabId, settings, sendResponse) {

  if (isCapturing) {
    sendResponse({ success: false, error: 'Already capturing' });
    return;
  }

  try {
    const minutesCheck = await checkMinutesAvailability();

    if (!minutesCheck.allowed || minutesCheck.free_minutes_available <= 0) {
      sendResponse({
        success: false,
        error: 'GUEST_LIMIT_EXCEEDED',
        message: 'Free minutes limit reached',
      });
      return;
    }

    try {
      await chrome.tabs.get(tabId);
    } catch (error) {
      sendResponse({ success: false, error: 'Tab not found' });
      return;
    }

    currentTabId = tabId;
    currentSettings = {
      ...settings,
      voiceGender: settings.voiceGender || 'neutral',
      enableVoice: settings.enableVoice !== false,
    };


    offscreenReady = false;
    await ensureOffscreenDocument();

    await waitForOffscreenReady();

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    chrome.runtime.sendMessage(
      {
        type: 'START_CAPTURE',
        streamId: streamId,
        settings: { ...currentSettings, realtimeMode: true },
        tabId: tabId,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Offscreen error:', chrome.runtime.lastError);
          isCapturing = false;
          currentTabId = null;
          offscreenReady = false;
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          isCapturing = true;
          offscreenReady = true;
          sessionStartTime = Date.now();

          guestAutoStopTimerId = setTimeout(
            () => {
              performGuestAutoStop();
            },
            GUEST_FREE_MINUTES * 60 * 1000,
          );

          let minutesCheckInterval = setInterval(async () => {
            if (!isCapturing) {
              clearInterval(minutesCheckInterval);
              return;
            }

            const balance = await checkMinutesAvailability();
            if (!balance.allowed || balance.free_minutes_available <= 0) {
              performGuestAutoStop();
              clearInterval(minutesCheckInterval);
            }
          }, 30000);

          sendResponse({ success: true, message: 'Capture started' });
        }
      },
    );
  } catch (error) {
    isCapturing = false;
    currentTabId = null;
    offscreenReady = false;
    sendResponse({ success: false, error: error.message });
  }
}

// ==================== УБЕДИТЬСЯ ЧТО OFFSCREEN ДОКУМЕНТ СОЗДАН ====================
async function ensureOffscreenDocument() {
  try {
    const hasDocument = await chrome.offscreen.hasDocument?.();

    if (hasDocument) {
      try {
        await chrome.offscreen.closeDocument();
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (closeError) {
        // console.log('⚠️ Could not close document:', closeError.message);
      }
    }
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: ['USER_MEDIA'],
      justification: 'Capture tab audio for translation service',
    });


    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    throw error;
  }
}

// ==================== ЖДАТЬ ПОКА OFFSCREEN ГОТОВ ====================
async function waitForOffscreenReady(retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
      return true;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Offscreen document not responding after retries');
}

// ==================== АВТО-СТОП ПО ЛИМИТУ ГОСТЯ ====================
function performGuestAutoStop() {
  if (!isCapturing || !guestAutoStopTimerId) return;
  guestAutoStopTimerId = null;

  stopTabCapture(() => {
    const elapsedMin = sessionStartTime
      ? (Date.now() - sessionStartTime) / 60000
      : GUEST_FREE_MINUTES;

    deductMinutesUsed(elapsedMin);
  });
}

// ==================== ОСТАНОВКА ====================
function stopTabCapture(sendResponse) {

  if (!isCapturing) {
    sendResponse({ success: false, error: 'Not capturing' });
    return;
  }

  if (guestAutoStopTimerId) {
    clearTimeout(guestAutoStopTimerId);
    guestAutoStopTimerId = null;
  }

  chrome.runtime.sendMessage(
    {
      type: 'STOP_CAPTURE',
    },
    async () => {
      const elapsedMin = sessionStartTime
        ? (Date.now() - sessionStartTime) / 60000
        : 0;
      sessionStartTime = null;

      if (currentTabId) {
        chrome.tabs
          .sendMessage(currentTabId, {
            type: 'STOP_SUBTITLES',
          })
          .catch((err) => {
            // console.log('Tab might be closed or not ready:', err.message);
          });
      }

      isCapturing = false;
      currentTabId = null;
      currentSettings = null;
      offscreenReady = false;

      if (typeof sendResponse === 'function') {
        sendResponse({ success: true, message: 'Capture stopped' });
      }

      if (elapsedMin > 0.1) {
        await deductMinutesUsed(elapsedMin);
      }
    },
  );
}

// ==================== ОБНОВЛЕНИЕ ГРОМКОСТИ И ГОЛОСА ====================
function updateVolumeFromPopup(settings, sendResponse) {

  if (!isCapturing) {
    sendResponse({ success: false, error: 'Not capturing' });
    return;
  }

  if (currentSettings) {
    currentSettings = { ...currentSettings, ...settings };
  }

  if (
    settings.muteOriginal !== undefined ||
    settings.originalVolume !== undefined
  ) {
    chrome.runtime.sendMessage(
      {
        type: 'UPDATE_VOLUME',
        settings: {
          muteOriginal: settings.muteOriginal,
          originalVolume: settings.originalVolume,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true });
        }
      },
    );
  } else if (
    settings.voiceGender !== undefined ||
    settings.enableVoice !== undefined
  ) {
    chrome.runtime.sendMessage(
      {
        type: 'UPDATE_VOICE',
        settings: {
          voiceGender: settings.voiceGender,
          enableVoice: settings.enableVoice,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true });
        }
      },
    );
  } else {
    sendResponse({ success: true });
  }
}

// ==================== ОБРАБОТЧИК СООБЩЕНИЙ ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  switch (request.type) {
    case 'START_TAB_CAPTURE':
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (!tabs[0]) {
          sendResponse({ success: false, error: 'No active tab' });
          return;
        }
        const minutesCheck = await checkMinutesAvailability();

        if (!minutesCheck.allowed || minutesCheck.free_minutes_available <= 0) {
          sendResponse({
            success: false,
            error: 'GUEST_LIMIT_EXCEEDED',
            message: 'Free minutes exhausted',
          });
          return;
        }

        startTabCapture(tabs[0].id, request.settings, sendResponse);
      });
      return true;

    case 'STOP_TAB_CAPTURE':
      stopTabCapture(sendResponse);
      return true;

    case 'GET_STATUS':
      sendResponse({
        isCapturing,
        currentTabId,
        settings: currentSettings,
      });
      return true;

    case 'UPDATE_VOLUME_FROM_POPUP':
    case 'UPDATE_VOICE_FROM_POPUP':
    case 'UPDATE_SETTINGS_FROM_POPUP':
    case 'UPDATE_LANGUAGE_FROM_POPUP':
      updateVolumeFromPopup(request.settings, sendResponse);
      return true;

    case 'UPDATE_SETTINGS':
      chrome.runtime.sendMessage(
        {
          type: 'UPDATE_SETTINGS',
          settings: { ...request.settings, realtimeMode: true },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Offscreen not ready for settings yet');
          }
        },
      );
      sendResponse({ success: true });
      return true;

    case 'SUBTITLES_FROM_OFFSCREEN':
      if (currentTabId) {
        chrome.tabs
          .sendMessage(currentTabId, {
            type: 'SHOW_SUBTITLES',
            text: request.text,
            settings: currentSettings,
          })
          .catch((err) =>
            console.log('Tab not ready for subtitles:', err.message),
          );
      }
      sendResponse({ success: true });
      return true;

    case 'OFFSCREEN_READY':
      offscreenReady = true;
      sendResponse({ success: true });
      return true;

    case 'PING':
      sendResponse({ success: true, timestamp: Date.now() });
      return true;

    case 'OFFSCREEN_ERROR':
      chrome.storage.local
        .set({ lastOffscreenError: request.error })
        .catch((err) => {
          console.warn('⚠️ Failed to persist offscreen error:', err);
        });
      sendResponse({ success: true });
      return true;

    case 'OFFSCREEN_KEEP_ALIVE':
      sendResponse({ success: true });
      return true;

    case 'OFFSCREEN_JS_LOADED':
      offscreenReady = true;
      sendResponse({ success: true });
      return true;

    case 'GET_TRANSCRIPT':
      chrome.runtime.sendMessage({ type: 'GET_TRANSCRIPT' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse(response);
        }
      });
      return true;

    case 'GENERATE_SUMMARY':
      chrome.runtime.sendMessage(
        {
          type: 'GENERATE_SUMMARY',
          text: request.text,
          targetLang: request.targetLang,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse(response);
          }
        },
      );
      return true;

    case 'CREATE_PDF':
      chrome.runtime.sendMessage(
        {
          type: 'CREATE_PDF',
          summary: request.summary,
          title: request.title,
          duration: request.duration,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse(response);
          }
        },
      );
      return true;

    case 'CLEAR_TRANSCRIPT':
      chrome.runtime.sendMessage({ type: 'CLEAR_TRANSCRIPT' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse(response);
        }
      });
      return true;

    case 'GET_MINUTES_BALANCE':
      checkMinutesAvailability()
        .then((balance) => {
          sendResponse({ success: true, balance });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function initialize() {
  try {
    await ensureOffscreenDocument();

    chrome.action.onClicked.addListener((tab) => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { action: 'OPEN_UI' }).catch((err) => {
        //   console.log('Обновите страницу для появления меню:', err.message);
        });
      }
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
}

initialize();

