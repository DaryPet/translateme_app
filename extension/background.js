console.log('🤖 Background service worker loaded - WITH VOICE SUPPORT');

let isCapturing = false;
let currentTabId = null;
let currentSettings = null;
let offscreenReady = false;
let sessionStartTime = null;
let guestAutoStopTimerId = null;
const GUEST_FREE_MINUTES = 3;

// ==================== ОСНОВНАЯ ФУНКЦИЯ ====================
async function startTabCapture(tabId, settings, sendResponse) {
  console.log('🎤 Starting tab capture for tab:', tabId);
  
  if (isCapturing) {
    sendResponse({ success: false, error: 'Already capturing' });
    return;
  }
  
  try {
    // Проверяем, что вкладка существует
    try {
      await chrome.tabs.get(tabId);
    } catch (error) {
      sendResponse({ success: false, error: 'Tab not found' });
      return;
    }
    
    currentTabId = tabId;
    currentSettings = { // Сохраняем полные настройки
      ...settings,
      voiceGender: settings.voiceGender || 'neutral',
      enableVoice: settings.enableVoice !== false // по умолчанию true
    };
    
    console.log('⚙️ Current settings:', currentSettings);
    
    // 1. Убеждаемся что offscreen документ создан и готов
    offscreenReady = false;
    await ensureOffscreenDocument();
    
    // Ждем пока offscreen документ будет готов принимать сообщения
    await waitForOffscreenReady();
    
    // 2. Получаем streamId для вкладки
    const streamId = await chrome.tabCapture.getMediaStreamId({ 
      targetTabId: tabId 
    });
    
    console.log('✅ Stream ID received:', streamId);
    
    // 3. Отправляем команду в Offscreen с ПОЛНЫМИ настройками + WebSocket флаг
    chrome.runtime.sendMessage({
      type: 'START_CAPTURE',
      streamId: streamId,
      settings: { ...currentSettings, realtimeMode: true }, // ← ИЗМЕНЕНИЕ ЗДЕСЬ: ДОБАВИЛИ realtimeMode
      tabId: tabId
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Offscreen error:', chrome.runtime.lastError);
        isCapturing = false;
        currentTabId = null;
        offscreenReady = false;
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        isCapturing = true;
        offscreenReady = true;
        sessionStartTime = Date.now();
        chrome.storage.local.set({ sessionStartTime: sessionStartTime, captureActive: true });
        if (settings.isGuest) {
          guestAutoStopTimerId = setTimeout(performGuestAutoStop, GUEST_FREE_MINUTES * 60 * 1000);
        }
        sendResponse({ success: true, message: 'Capture started' });
      }
    });
    
  } catch (error) {
    console.error('❌ Capture failed:', error);
    isCapturing = false;
    currentTabId = null;
    offscreenReady = false;
    sendResponse({ success: false, error: error.message });
  }
}

// ==================== УБЕДИТЬСЯ ЧТО OFFSCREEN ДОКУМЕНТ СОЗДАН (ИСПРАВЛЕННАЯ) ====================
async function ensureOffscreenDocument() {
  try {
    // ВСЕГДА закрываем старый документ перед созданием нового
    const hasDocument = await chrome.offscreen.hasDocument?.();
    
    if (hasDocument) {
      console.log('📄 Closing existing offscreen document...');
      try {
        await chrome.offscreen.closeDocument();
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('✅ Old offscreen document closed');
      } catch (closeError) {
        console.log('⚠️ Could not close document (may be already closed):', closeError.message);
      }
    }
    
    console.log('📄 Creating NEW offscreen document...');
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: ['USER_MEDIA'],
      justification: 'Capture tab audio for translation service'
    });
    
    console.log('✅ New offscreen document created');
    
    // Ждем инициализации
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.error('Failed to create offscreen document:', error);
    throw error;
  }
}

// ==================== ЖДАТЬ ПОКА OFFSCREEN ГОТОВ ====================
async function waitForOffscreenReady(retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`⏳ Testing offscreen connection (attempt ${i + 1}/${retries})...`);
      
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
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Offscreen document not responding after retries');
}

// ==================== АВТО-СТОП ПО ЛИМИТУ ГОСТЯ (3 мин) ====================
function performGuestAutoStop() {
  if (!isCapturing || !guestAutoStopTimerId) return;
  guestAutoStopTimerId = null;
  console.log('⏱️ Guest 3 min limit reached — auto-stopping');

  chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }, () => {
    const elapsedMin = sessionStartTime ? (Date.now() - sessionStartTime) / 60000 : GUEST_FREE_MINUTES;
    sessionStartTime = null;

    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, { type: 'STOP_SUBTITLES' }).catch(() => {});
    }

    isCapturing = false;
    currentTabId = null;
    currentSettings = null;
    offscreenReady = false;

    chrome.storage.local.set({ captureActive: false, sessionStartTime: null });
    chrome.storage.local.get(['account', 'guestMinutesUsed']).then((r) => {
      if (!r.account) {
        const used = (r.guestMinutesUsed || 0) + elapsedMin;
        chrome.storage.local.set({ guestMinutesUsed: used });
        console.log('📊 Guest limit reached, minutes:', used.toFixed(2));
      }
    }).catch(() => {});
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
  
  // 1. Отправляем команду остановки в Offscreen
  chrome.runtime.sendMessage({
    type: 'STOP_CAPTURE'
  }, (response) => {
    // Игнорируем ошибки - offscreen может быть уже закрыт
    const elapsedMin = sessionStartTime ? (Date.now() - sessionStartTime) / 60000 : 0;
    sessionStartTime = null;

    // 2. Останавливаем субтитры в content script
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, {
        type: 'STOP_SUBTITLES'
      }).catch(err => {
        console.log('Tab might be closed or not ready:', err.message);
      });
    }

    // 3. Сбрасываем состояние
    isCapturing = false;
    currentTabId = null;
    currentSettings = null;
    offscreenReady = false;

    console.log('✅ Capture stopped');
    sendResponse({ success: true, message: 'Capture stopped' });

    chrome.storage.local.set({ captureActive: false, sessionStartTime: null });

    // 4. Fire-and-forget: добавляем минуты гостю (без await — не блокируем sendResponse)
    if (elapsedMin > 0) {
      chrome.storage.local.get(['account', 'guestMinutesUsed']).then((r) => {
        if (!r.account) {
          const used = (r.guestMinutesUsed || 0) + elapsedMin;
          chrome.storage.local.set({ guestMinutesUsed: used });
          console.log('📊 Guest minutes:', used.toFixed(2));
        }
      }).catch(() => {});
    }
  });
}

// ==================== ОБНОВЛЕНИЕ ГРОМКОСТИ И ГОЛОСА ====================
function updateVolumeFromPopup(settings, sendResponse) {
  console.log('🔊 Background updating volume/voice:', settings, 'isCapturing:', isCapturing);
  
  if (!isCapturing) {
    sendResponse({ success: false, error: 'Not capturing' });
    return;
  }
  
  // Обновляем настройки
  if (currentSettings) {
    currentSettings = { ...currentSettings, ...settings };
  }
  
  // Определяем какой тип обновления отправлять
  if (settings.muteOriginal !== undefined || settings.originalVolume !== undefined) {
    // Обновление громкости
    chrome.runtime.sendMessage({
      type: 'UPDATE_VOLUME',
      settings: {
        muteOriginal: settings.muteOriginal,
        originalVolume: settings.originalVolume
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
  } else if (settings.voiceGender !== undefined || settings.enableVoice !== undefined) {
    // Обновление голоса
    chrome.runtime.sendMessage({
      type: 'UPDATE_VOICE',
      settings: {
        voiceGender: settings.voiceGender,
        enableVoice: settings.enableVoice
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
  } else {
    sendResponse({ success: true });
  }
}

// ==================== ОБРАБОТЧИК СООБЩЕНИЙ (ИСПРАВЛЕННЫЙ) ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🤖 Background received:', request.type);
  
  switch (request.type) {
    case 'START_TAB_CAPTURE':
      chrome.storage.local.get(['account', 'guestMinutesUsed'], (storage) => {
        if (!storage.account && (storage.guestMinutesUsed || 0) >= GUEST_FREE_MINUTES) {
          sendResponse({ success: false, error: 'GUEST_LIMIT_EXCEEDED' });
          return;
        }
        const isGuest = !storage.account;
        const settings = { ...request.settings, isGuest };
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs[0]) {
            sendResponse({ success: false, error: 'No active tab' });
            return;
          }
          startTabCapture(tabs[0].id, settings, sendResponse);
        });
      });
      return true;
      
    case 'STOP_TAB_CAPTURE':
      stopTabCapture(sendResponse);
      return true;
      
    case 'GET_STATUS':
      sendResponse({ 
        isCapturing, 
        currentTabId,
        settings: currentSettings
      });
      return true;
      
    case 'UPDATE_VOLUME_FROM_POPUP':
    case 'UPDATE_VOICE_FROM_POPUP':
    case 'UPDATE_SETTINGS_FROM_POPUP':
    case 'UPDATE_LANGUAGE_FROM_POPUP':
      // Все эти сообщения обрабатываем как обновление настроек
      updateVolumeFromPopup(request.settings, sendResponse);
      return true;

    case 'UPDATE_SETTINGS':
      console.log('📨 Background forwarding UPDATE_SETTINGS:', request.settings);
      // Пересылаем настройки в Offscreen документ, чтобы он знал, что пора включать голос
      chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { ...request.settings, realtimeMode: true } // ← ИЗМЕНЕНИЕ ЗДЕСЬ: ДОБАВИЛИ realtimeMode
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Offscreen not ready for settings yet');
        }
      });
      sendResponse({ success: true });
      return true;

    case 'SUBTITLES_FROM_OFFSCREEN':
      // Проксируем субтитры в content script
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, {
          type: 'SHOW_SUBTITLES',
          text: request.text,
          settings: currentSettings
        }).catch(err => console.log('Tab not ready for subtitles:', err.message));
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
      chrome.storage.local.set({ lastOffscreenError: request.error }).catch(err => {
        console.warn('⚠️ Failed to persist offscreen error:', err);
      });
      sendResponse({ success: true });
      return true;
      
    // ДОБАВЛЕНО: обработка keep-alive сообщений
    case 'OFFSCREEN_KEEP_ALIVE':
      console.log('❤️ Offscreen keep-alive received');
      sendResponse({ success: true });
      return true;
      
    // ДОБАВЛЕНО: тест что offscreen.js загружен
    case 'OFFSCREEN_JS_LOADED':
      console.log('✅ Offscreen.js script loaded successfully!', request.timestamp);
      offscreenReady = true;
      sendResponse({ success: true });
      return true;

    // ==================== SUMMARY PDF ====================
    case 'GET_TRANSCRIPT':
      // Проксируем в offscreen
      chrome.runtime.sendMessage({ type: 'GET_TRANSCRIPT' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      });
      return true;

    case 'GENERATE_SUMMARY':
      // Проксируем в offscreen
      chrome.runtime.sendMessage({
        type: 'GENERATE_SUMMARY',
        text: request.text,
        targetLang: request.targetLang
      }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      });
      return true;

    case 'CREATE_PDF':
      // Проксируем в offscreen
      chrome.runtime.sendMessage({
        type: 'CREATE_PDF',
        summary: request.summary,
        title: request.title,
        duration: request.duration
      }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      });
      return true;

    case 'CLEAR_TRANSCRIPT':
      // Проксируем в offscreen
      chrome.runtime.sendMessage({ type: 'CLEAR_TRANSCRIPT' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      });
      return true;
      
    default:
      console.warn('⚠️ Unknown message type in background:', request.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
// async function initialize() {
//   try {
//     // Создаем offscreen документ при запуске
//     await ensureOffscreenDocument();
//     console.log('✅ Background service worker initialized with voice support');
//   } catch (error) {
//     console.error('Failed to initialize:', error);
//   }
// }

// // Запускаем инициализацию
// initialize();

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
// ==================== ИНИЦИАЛИЗАЦИЯ И ВЫЗОВ МЕНЮ (ОБНОВЛЕНО) ====================
async function initialize() {
  try {
    await ensureOffscreenDocument();

    // Слушаем клик по иконке расширения
    chrome.action.onClicked.addListener((tab) => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        // Шлем сигнал в content.js
        chrome.tabs.sendMessage(tab.id, { action: "OPEN_UI" }).catch((err) => {
          console.log("Обновите страницу для появления меню:", err.message);
        });
      }
    });

    console.log('✅ Background initialized - FLOATING UI MODE ACTIVE');
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
}

initialize();

console.log('✅ Background ready');