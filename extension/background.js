// console.log('🤖 Background service worker loaded - WITH VOICE SUPPORT');

let isCapturing = false;
let currentTabId = null;
let currentSettings = null;
let offscreenReady = false;
let sessionStartTime = null;
let guestAutoStopTimerId = null;
const GUEST_FREE_MINUTES = 3;
const API_BASE_URL = 'https://translateme-app.vercel.app';
let minutesBalance = null;

// ================ ИЗМЕНИЛ ТОЛЬКО ЧТО ЗДЕСЬ: ДОБАВИЛ ФУНКЦИИ ДЛЯ БД ================
async function getUserId() {
  // Временно используем тестовый fingerprint для проверки БД
  return 'test_fingerprint_123'; // ← ИЗМЕНЕНИЕ: тестовый ID для проверки БД
}

async function checkMinutesAvailability() {
  try {
    const userId = await getUserId();
    console.log('🔍 Checking minutes in DB for:', userId);

    const response = await fetch(
      `http://localhost:3000/api/minutes?fingerprint=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.ok) {
      const data = await response.json();
      console.log('📊 DB response:', data);

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
      //   console.log('❌ DB check failed, using fallback');
      //   // Fallback на localStorage
      //   const localData = await chrome.storage.local.get(['guestMinutesUsed']);
      //   return {
      //     allowed: true,
      //     free_minutes_available: Math.max(0, GUEST_FREE_MINUTES - (localData.guestMinutesUsed || 0))
      //   };
      console.log('❌ DB check error, using localStorage:', error);
      const localData = await chrome.storage.local.get(['guestMinutesUsed']);
      const used = localData.guestMinutesUsed || 0;
      const remaining = Math.max(0, GUEST_FREE_MINUTES - used);
      return {
        allowed: remaining > 0, // ← ЗАВИСИМОСТЬ ОТ ОСТАТКА
        free_minutes_available: remaining,
        free_minutes_used: used,
        paid_minutes_left: 0,
        total_available: remaining,
        email: 'Guest (fallback)',
        reason: remaining <= 0 ? 'local_limit_reached' : null,
      };
    }
  } catch (error) {
    // console.log('❌ DB check error, using localStorage:', error);
    // const localData = await chrome.storage.local.get(['guestMinutesUsed']);
    // return {
    //   allowed: true,
    //   free_minutes_available: Math.max(0, GUEST_FREE_MINUTES - (localData.guestMinutesUsed || 0))
    // };
    console.log('❌ DB check error, using localStorage:', error);
    const localData = await chrome.storage.local.get(['guestMinutesUsed']);
    const used = localData.guestMinutesUsed || 0;
    const remaining = Math.max(0, GUEST_FREE_MINUTES - used);
    return {
      allowed: remaining > 0, // ← ЗАВИСИМОСТЬ ОТ ОСТАТКА
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
    console.log('📤 Deducting minutes in DB:', minutesUsed, 'for:', userId);

    // ИЗМЕНЕНИЕ: Списание минут в БД
    // const response = await fetch(`${API_BASE_URL}/api/minutes/use`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     fingerprint: userId,
    //     google_id: userId.startsWith('google_') ? userId : null,
    //     minutes_used: minutesUsed
    //   })
    // });

    const response = await fetch(`http://localhost:3000/api/minutes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint: userId,
        minutes_used: minutesUsed,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DB deduction successful:', data);
      return data;
    } else {
      console.log('❌ DB deduction failed');
      // Fallback на localStorage
      const localData = await chrome.storage.local.get(['guestMinutesUsed']);
      const newUsed = (localData.guestMinutesUsed || 0) + minutesUsed;
      await chrome.storage.local.set({ guestMinutesUsed: newUsed });
    }
  } catch (error) {
    console.log('❌ DB deduction error, using localStorage:', error);
    const localData = await chrome.storage.local.get(['guestMinutesUsed']);
    const newUsed = (localData.guestMinutesUsed || 0) + minutesUsed;
    await chrome.storage.local.set({ guestMinutesUsed: newUsed });
  }
}

// ==================== ОСНОВНАЯ ФУНКЦИЯ ====================
async function startTabCapture(tabId, settings, sendResponse) {
  console.log('🎤 Starting tab capture for tab:', tabId);

  if (isCapturing) {
    sendResponse({ success: false, error: 'Already capturing' });
    return;
  }

  try {
    // ИЗМЕНЕНИЕ: ПРОВЕРКА МИНУТ ПЕРЕД СТАРТОМ
    const minutesCheck = await checkMinutesAvailability();
    console.log('📊 Minutes check before start:', minutesCheck);

    if (!minutesCheck.allowed || minutesCheck.free_minutes_available <= 0) {
      sendResponse({
        success: false,
        error: 'GUEST_LIMIT_EXCEEDED',
        message: 'Free minutes limit reached',
      });
      return;
    }

    // Проверяем, что вкладка существует
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

    console.log('⚙️ Current settings:', currentSettings);

    offscreenReady = false;
    await ensureOffscreenDocument();

    await waitForOffscreenReady();

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    console.log('✅ Stream ID received:', streamId);

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

          // Запускаем таймер автостопа
          // guestAutoStopTimerId = setTimeout(() => {
          //   performGuestAutoStop();
          // }, GUEST_FREE_MINUTES * 60 * 1000);

          // Запускаем таймер автостопа
          guestAutoStopTimerId = setTimeout(
            () => {
              performGuestAutoStop();
            },
            GUEST_FREE_MINUTES * 60 * 1000,
          );

          // ДОБАВИТЬ: интервал проверки минут каждые 30 секунд
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

          console.log(
            '✅ Capture started, auto-stop in',
            GUEST_FREE_MINUTES,
            'minutes',
          );
          sendResponse({ success: true, message: 'Capture started' });
        }
      },
    );
  } catch (error) {
    console.error('❌ Capture failed:', error);
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
      console.log('📄 Closing existing offscreen document...');
      try {
        await chrome.offscreen.closeDocument();
        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log('✅ Old offscreen document closed');
      } catch (closeError) {
        console.log('⚠️ Could not close document:', closeError.message);
      }
    }

    console.log('📄 Creating NEW offscreen document...');
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: ['USER_MEDIA'],
      justification: 'Capture tab audio for translation service',
    });

    console.log('✅ New offscreen document created');

    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Failed to create offscreen document:', error);
    throw error;
  }
}

// ==================== ЖДАТЬ ПОКА OFFSCREEN ГОТОВ ====================
async function waitForOffscreenReady(retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(
        `⏳ Testing offscreen connection (attempt ${i + 1}/${retries})...`,
      );

      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });

      console.log('✅ Offscreen document is responding:', response);
      return true;
    } catch (error) {
      console.log(`❌ Offscreen not responding yet: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Offscreen document not responding after retries');
}

// ==================== АВТО-СТОП ПО ЛИМИТУ ГОСТЯ ====================
function performGuestAutoStop() {
  if (!isCapturing || !guestAutoStopTimerId) return;
  guestAutoStopTimerId = null;
  console.log('⏱️ Guest 3 min limit reached — auto-stopping');

  stopTabCapture(() => {
    const elapsedMin = sessionStartTime
      ? (Date.now() - sessionStartTime) / 60000
      : GUEST_FREE_MINUTES;

    // ИЗМЕНЕНИЕ: СПИСАНИЕ МИНУТ В БД
    deductMinutesUsed(elapsedMin);
    console.log('📊 Auto-stop minutes deducted:', elapsedMin.toFixed(2));
  });
}

// ==================== ОСТАНОВКА ====================
function stopTabCapture(sendResponse) {
  console.log('🛑 Stopping capture...');

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
            console.log('Tab might be closed or not ready:', err.message);
          });
      }

      isCapturing = false;
      currentTabId = null;
      currentSettings = null;
      offscreenReady = false;

      console.log('✅ Capture stopped');

      if (typeof sendResponse === 'function') {
        sendResponse({ success: true, message: 'Capture stopped' });
      }

      // ИЗМЕНЕНИЕ: СПИСАНИЕ МИНУТ В БД
      if (elapsedMin > 0.1) {
        await deductMinutesUsed(elapsedMin);
        console.log('📊 Manual stop minutes deducted:', elapsedMin.toFixed(2));
      }
    },
  );
}

// ==================== ОБНОВЛЕНИЕ ГРОМКОСТИ И ГОЛОСА ====================
function updateVolumeFromPopup(settings, sendResponse) {
  console.log(
    '🔊 Background updating volume/voice:',
    settings,
    'isCapturing:',
    isCapturing,
  );

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
  console.log('🤖 Background received:', request.type);

  switch (request.type) {
    case 'START_TAB_CAPTURE':
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (!tabs[0]) {
          sendResponse({ success: false, error: 'No active tab' });
          return;
        }

        // ИЗМЕНЕНИЕ: ПРОВЕРКА МИНУТ ПЕРЕД СТАРТОМ
        const minutesCheck = await checkMinutesAvailability();
        console.log('📊 Pre-start minutes check:', minutesCheck);

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
      console.log(
        '📨 Background forwarding UPDATE_SETTINGS:',
        request.settings,
      );
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
      console.error('📡 Offscreen reported error:', request.error);
      chrome.storage.local
        .set({ lastOffscreenError: request.error })
        .catch((err) => {
          console.warn('⚠️ Failed to persist offscreen error:', err);
        });
      sendResponse({ success: true });
      return true;

    case 'OFFSCREEN_KEEP_ALIVE':
      console.log('❤️ Offscreen keep-alive received');
      sendResponse({ success: true });
      return true;

    case 'OFFSCREEN_JS_LOADED':
      console.log(
        '✅ Offscreen.js script loaded successfully!',
        request.timestamp,
      );
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
      // ИЗМЕНЕНИЕ: ВОЗВРАЩАЕМ БАЛАНС ИЗ БД
      checkMinutesAvailability()
        .then((balance) => {
          sendResponse({ success: true, balance });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    default:
      console.warn('⚠️ Unknown message type in background:', request.type);
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
          console.log('Обновите страницу для появления меню:', err.message);
        });
      }
    });

    console.log('✅ Background initialized with DB minutes tracking');
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
}

initialize();

console.log('✅ Background ready');
