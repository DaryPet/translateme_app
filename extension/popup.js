// popup.js - ПОЛНЫЙ РАБОЧИЙ КОД С ВЫБОРОМ ГОЛОСА И СТИЛЯ ПЕРЕВОДА
console.log('🔴 POPUP LOADED - ENHANCED WITH VOICE SELECTION');

const WEBSITE_URL = 'https://translateme.app';
const GUEST_FREE_MINUTES = 3;

// КОНФИГУРАЦИЯ ЯЗЫКОВ И ГОЛОСОВ (ВЗЯТО ИЗ langConfig.js)
const LANGUAGE_CONFIG = {
  // --- Whisper (Семитские и сложные языки для Live) ---
  he: { name: 'Hebrew', model: 'whisper-large', interval: 10000 },
  ar: { name: 'Arabic', model: 'whisper-large', interval: 10000 },
  fa: { name: 'Persian', model: 'whisper-large', interval: 10000 },

  // --- NOVA-3 (Официальный список из документации) ---
  bg: { name: 'Bulgarian', model: 'nova-3', interval: 6500 },
  ca: { name: 'Catalan', model: 'nova-3', interval: 6500 },
  cs: { name: 'Czech', model: 'nova-3', interval: 6500 },
  da: { name: 'Danish', model: 'nova-3', interval: 6500 },
  de: { name: 'German', model: 'nova-3', interval: 6500 },
  el: { name: 'Greek', model: 'nova-3', interval: 6500 },
  en: { name: 'English (US)', model: 'nova-3', interval: 5000 },
  'en-AU': { name: 'English (Australia)', model: 'nova-3', interval: 5000 },
  'en-GB': { name: 'English (UK)', model: 'nova-3', interval: 5000 },
  'en-IN': { name: 'English (India)', model: 'nova-3', interval: 5000 },
  'en-NZ': { name: 'English (New Zealand)', model: 'nova-3', interval: 5000 },
  es: { name: 'Spanish', model: 'nova-3', interval: 6500 },
  'es-419': { name: 'Spanish (LatAm)', model: 'nova-3', interval: 6500 },
  et: { name: 'Estonian', model: 'nova-3', interval: 6500 },
  fi: { name: 'Finnish', model: 'nova-3', interval: 6500 },
  fr: { name: 'French', model: 'nova-3', interval: 6500 },
  hi: { name: 'Hindi', model: 'nova-3', interval: 6500 },
  hr: { name: 'Croatian', model: 'nova-3', interval: 6500 },
  hu: { name: 'Hungarian', model: 'nova-3', interval: 6500 },
  id: { name: 'Indonesian', model: 'nova-3', interval: 6500 },
  it: { name: 'Italian', model: 'nova-3', interval: 6500 },
  ja: { name: 'Japanese', model: 'nova-3', interval: 6500 },
  kn: { name: 'Kannada', model: 'nova-3', interval: 6500 },
  ko: { name: 'Korean', model: 'nova-3', interval: 6500 },
  lt: { name: 'Lithuanian', model: 'nova-3', interval: 6500 },
  lv: { name: 'Latvian', model: 'nova-3', interval: 6500 },
  mr: { name: 'Marathi', model: 'nova-3', interval: 6500 },
  ms: { name: 'Malay', model: 'nova-3', interval: 6500 },
  nl: { name: 'Dutch', model: 'nova-3', interval: 6500 },
  no: { name: 'Norwegian', model: 'nova-3', interval: 6500 },
  pl: { name: 'Polish', model: 'nova-3', interval: 6500 },
  pt: { name: 'Portuguese', model: 'nova-3', interval: 6500 },
  'pt-BR': { name: 'Portuguese (Brazil)', model: 'nova-3', interval: 6500 },
  ro: { name: 'Romanian', model: 'nova-3', interval: 6500 },
  ru: { name: 'Russian', model: 'nova-3', interval: 6500 },
  sk: { name: 'Slovak', model: 'nova-3', interval: 6500 },
  sl: { name: 'Slovenian', model: 'nova-3', interval: 6500 },
  sv: { name: 'Swedish', model: 'nova-3', interval: 6500 },
  ta: { name: 'Tamil', model: 'nova-3', interval: 6500 },
  te: { name: 'Telugu', model: 'nova-3', interval: 6500 },
  th: { name: 'Thai', model: 'nova-3', interval: 6500 },
  tr: { name: 'Turkish', model: 'nova-3', interval: 6500 },
  uk: { name: 'Ukrainian', model: 'nova-3', interval: 6500 },
  vi: { name: 'Vietnamese', model: 'nova-3', interval: 6500 },
  zh: { name: 'Chinese (Simplified)', model: 'nova-3', interval: 6500 },
  'zh-TW': { name: 'Chinese (Traditional)', model: 'nova-3', interval: 6500 },

  default: { name: 'Auto', model: 'nova-3', interval: 6500 },
};

const VOICE_CONFIG = {
  male: 'onyx',
  female: 'shimmer',
  neutral: 'nova',
  auto: 'alloy',
};

let currentSettings = null;
let isCapturing = false;
let isUserInteracting = false;
let volumeSliderInteraction = false;
let statusErrorTimer = null;
let countdownIntervalId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // ИНИЦИАЛИЗИРУЕМ СЕЛЕКТЫ С ЯЗЫКАМИ ИЗ КОНФИГА
  initializeLanguageSelects();

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');
  const voiceGender = document.getElementById('voiceGender');
  const translationStyle = document.getElementById('translationStyle');
  const enableVoice = document.getElementById('enableVoice');
  const originalVolume = document.getElementById('originalVolume');
  const volumeValue = document.getElementById('volumeValue');
  const muteOriginal = document.getElementById('muteOriginal');
  const showSubtitles = document.getElementById('showSubtitles');
  const minutesDisplay = document.getElementById('minutesDisplay');
  const accountEmail = document.getElementById('accountEmail');
  const collapseBtn = document.getElementById('collapseBtn');
  const expandBtn = document.getElementById('expandBtn');

  if (!chrome.tabs || !chrome.runtime) {
    console.error('❌ Chrome API not available');
    return;
  }

  // ==================== КНОПКА СВЕРНУТЬ/РАЗВЕРНУТЬ ====================
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleCollapse);
  }
  if (expandBtn) {
    expandBtn.addEventListener('click', toggleCollapse);
  }

  // function toggleCollapse() {
  //     const main = document.getElementById('mainContent');
  //     const collapsed = document.getElementById('collapsedContent');

  //     if (main.style.display !== 'none') {
  //         main.style.display = 'none';
  //         collapsed.style.display = 'block';
  //     } else {
  //         main.style.display = 'block';
  //         collapsed.style.display = 'none';
  //     }
  // }

  function toggleCollapse() {
    const main = document.getElementById('mainContent');
    const collapsed = document.getElementById('collapsedContent');

    const isMinimizing = main.style.display !== 'none';

    if (isMinimizing) {
      main.style.display = 'none';
      collapsed.style.display = 'block';
    } else {
      main.style.display = 'block';
      collapsed.style.display = 'none';
    }

    // ОТПРАВЛЯЕМ СИГНАЛ В CONTENT.JS ИЗМЕНИТЬ РАЗМЕР IFRAME
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, {
            type: 'RESIZE_FRAME',
            minimized: isMinimizing,
          })
          .catch((err) => console.log('Content script not ready'));
      }
    });
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ ====================
  console.log('🔧 Initializing popup...');

  await loadSavedSettings();
  updateMinutesDisplay();
  updateBlockState();
  await displayStoredError();

  chrome.storage.local.get(['account', 'captureActive', 'sessionStartTime'], (r) => {
    if (!r.account && r.captureActive && r.sessionStartTime && !countdownIntervalId) {
      countdownIntervalId = setInterval(updateGuestCountdown, 2000);
    }
  });

  // ==================== ЛОГИКА ПОЛЗУНКА И MUTE ====================
  function updateVolumeDisplay() {
    const value = originalVolume.value;
    volumeValue.textContent = value + '%';

    if (value > 0 && muteOriginal.checked) {
      muteOriginal.checked = false;
    }

    if (value === '0' && !muteOriginal.checked) {
      muteOriginal.checked = true;
    }

    saveSettings();

    if (isCapturing && !volumeSliderInteraction) {
      sendVolumeUpdateIfActive();
    }
  }

  originalVolume.addEventListener('input', () => {
    volumeSliderInteraction = true;
    updateVolumeDisplay();
  });

  originalVolume.addEventListener('change', () => {
    volumeSliderInteraction = false;
    updateVolumeDisplay();
  });

  originalVolume.addEventListener('mousedown', () => {
    volumeSliderInteraction = true;
  });

  originalVolume.addEventListener('mouseup', () => {
    volumeSliderInteraction = false;
    updateVolumeDisplay();
  });

  originalVolume.addEventListener('touchstart', () => {
    volumeSliderInteraction = true;
  });

  originalVolume.addEventListener('touchend', () => {
    setTimeout(() => {
      volumeSliderInteraction = false;
      updateVolumeDisplay();
    }, 100);
  });

  muteOriginal.addEventListener('change', () => {
    isUserInteracting = true;

    if (muteOriginal.checked) {
      originalVolume.value = 0;
      volumeValue.textContent = '0%';
    } else {
      originalVolume.value =
        originalVolume.value === '0' ? '50' : originalVolume.value;
      volumeValue.textContent = originalVolume.value + '%';
    }

    saveSettings();

    if (isCapturing) {
      sendVolumeUpdateIfActive();
    }

    setTimeout(() => {
      isUserInteracting = false;
    }, 500);
  });

  // ==================== ОБРАБОТЧИКИ ВЫБОРА ====================
  sourceLanguage.addEventListener('change', () => {
    console.log('🎤 Source language changed to:', sourceLanguage.value);
    saveSettings();
    if (isCapturing) {
      sendSettingsUpdateIfActive();
    }
  });

  targetLanguage.addEventListener('change', () => {
    console.log('🌐 Target language changed to:', targetLanguage.value);
    saveSettings();
    if (isCapturing) {
      sendSettingsUpdateIfActive();
    }
  });

  if (voiceGender) {
    voiceGender.addEventListener('change', () => {
      console.log(
        '👤 Voice gender changed to:',
        voiceGender.value,
        'isCapturing:',
        isCapturing,
      );
      saveSettings();
      if (isCapturing) {
        console.log('📨 Sending voice update to offscreen...');
        sendSettingsUpdateIfActive();
      }
      // Проверим, сохранилось ли значение
      setTimeout(() => {
        console.log('👤 Voice value after change:', voiceGender.value);
      }, 100);
    });
  }

  // Обработчик для стиля перевода
  if (translationStyle) {
    translationStyle.addEventListener('change', () => {
      console.log('🎨 Translation style changed to:', translationStyle.value);
      saveSettings();
      if (isCapturing) {
        sendSettingsUpdateIfActive();
      }
    });
  }

  // Обработчик для голоса с логированием
  if (enableVoice) {
    enableVoice.addEventListener('change', () => {
      console.log('🎤 Voice toggle changed to:', enableVoice.checked);
      saveSettings();
      if (isCapturing) {
        sendSettingsUpdateIfActive();
      }
    });
  }

  // Обработчик для субтитров с логированием
  showSubtitles.addEventListener('change', () => {
    console.log('📝 Subtitles toggle changed to:', showSubtitles.checked);
    saveSettings();
    if (isCapturing) {
      sendSettingsUpdateIfActive();
    }
  });

  // ==================== КНОПКИ ====================
  startBtn.addEventListener('click', startTranslation);
  stopBtn.addEventListener('click', stopTranslation);

  document.getElementById('buyBtn')?.addEventListener('click', () => {
    window.open('https://translateme-app.vercel.app/', '_blank');
  });
  document.getElementById('goToWebsiteBtn')?.addEventListener('click', openWebsite);

//   document.getElementById('settingsBtn')?.addEventListener('click', () => {
//     const settingsPanel = document.getElementById('settingsPanel');
//     settingsPanel.style.display =
//       settingsPanel.style.display === 'none' ? 'block' : 'none';
//   });

document.getElementById('settingsBtn')?.addEventListener('click', () => {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (settingsPanel.style.display === 'none') {
      settingsPanel.style.display = 'block';
      settingsBtn.innerHTML = '<span>⚙️</span> Hide Settings';
    } else {
      settingsPanel.style.display = 'none';
      settingsBtn.innerHTML = '<span>⚙️</span> Settings';
    }
  });

  // ==================== КНОПКА SUMMARY PDF ====================
  const summaryBtn = document.getElementById('summaryBtn');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', generateSummaryPDF);
    // Обновляем статус транскрипта периодически
    setInterval(updateTranscriptStatus, 3000);
  }

  // ==================== ПРОВЕРКА СТАТУСА ====================
  await updateStatus();

  const statusInterval = setInterval(updateStatus, 2000);

  window.addEventListener('unload', () => {
    clearInterval(statusInterval);
  });

  console.log('✅ Popup UI initialized');
});

// ==================== ИНИЦИАЛИЗАЦИЯ СЕЛЕКТОВ С ЯЗЫКАМИ ====================
function initializeLanguageSelects() {
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');
  const translationStyle = document.getElementById('translationStyle');
  const voiceGender = document.getElementById('voiceGender');

  // Очищаем существующие опции
  sourceLanguage.innerHTML = '';
  targetLanguage.innerHTML = '';
  translationStyle.innerHTML = '';
  voiceGender.innerHTML = '';

  // ДОБАВЛЯЕМ ОПЦИЮ "АВТО" ДЛЯ ИСТОЧНИКА
  // const autoSourceOption = document.createElement('option');
  // autoSourceOption.value = 'auto';
  // autoSourceOption.textContent = '🎤 Auto-detect (Whisper)';
  // sourceLanguage.appendChild(autoSourceOption);

  // ДОБАВЛЯЕМ ВСЕ ДОСТУПНЫЕ ЯЗЫКИ ДЛЯ ИСТОЧНИКА
  Object.entries(LANGUAGE_CONFIG).forEach(([code, config]) => {
    if (code === 'default') return;

    const option = document.createElement('option');
    option.value = code;
    option.textContent = `🌐 ${config.name}`;
    sourceLanguage.appendChild(option);
  });

  // ДОБАВЛЯЕМ ОПЦИЮ "ОРИГИНАЛ" ДЛЯ ЦЕЛИ
  const originalOption = document.createElement('option');
  originalOption.value = 'original';
  originalOption.textContent = '🔇 Original (No Translation)';
  targetLanguage.appendChild(originalOption);

  // ДОБАВЛЯЕМ ВСЕ ДОСТУПНЫЕ ЯЗЫКИ ДЛЯ ЦЕЛИ
  Object.entries(LANGUAGE_CONFIG).forEach(([code, config]) => {
    if (code === 'default') return;

    const option = document.createElement('option');
    option.value = code;
    option.textContent = `🌐 ${config.name}`;
    targetLanguage.appendChild(option);
  });

  // ДОБАВЛЯЕМ СТИЛИ ПЕРЕВОДА
  const translationStyles = {
    default: '📝 Default (Natural Speech)',
    kabbalah: '✡️ Kabbalah',
    children: '🧸 Children (Fairy Tales)',
    scientific: '🔬 Scientific',
    kids: '👶 Kids (Simple Words)',
  };

  Object.entries(translationStyles).forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    translationStyle.appendChild(option);
  });

  // ДОБАВЛЯЕМ ГОЛОСА
  const voiceOptions = {
    neutral: '🎯 Neutral (Nova)',
    female: '👩 Female (Shimmer)',
    male: '👨 Male (Onyx)',
    auto: '🎭 Auto (Alloy)',
  };

  Object.entries(voiceOptions).forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    voiceGender.appendChild(option);
    console.log('🎤 Added voice option:', value, label);
  });

  console.log(
    '🌐 Language selects initialized with',
    Object.keys(LANGUAGE_CONFIG).length - 1,
    'languages',
  );
}

// ==================== ЗАГРУЗКА СОХРАНЕННЫХ НАСТРОЕК ====================
async function loadSavedSettings() {
  try {
    const result = await chrome.storage.local.get([
      'sourceLanguage',
      'targetLanguage',
      'volume',
      'mute',
      'subtitles',
      'account',
      'voiceGender',
      'enableVoice',
      'translationStyle',
    ]);

    console.log('📂 Loaded saved settings:', result);

    const sourceLanguage = document.getElementById('sourceLanguage');
    const targetLanguage = document.getElementById('targetLanguage');
    const voiceGender = document.getElementById('voiceGender');
    const translationStyle = document.getElementById('translationStyle');
    const enableVoice = document.getElementById('enableVoice');
    const originalVolume = document.getElementById('originalVolume');
    const volumeValue = document.getElementById('volumeValue');
    const muteOriginal = document.getElementById('muteOriginal');
    const showSubtitles = document.getElementById('showSubtitles');
    const accountEmail = document.getElementById('accountEmail');
    const minutesDisplay = document.getElementById('minutesDisplay');

    // Загружаем язык источника
    if (
      result.sourceLanguage &&
      sourceLanguage.querySelector(`option[value="${result.sourceLanguage}"]`)
    ) {
      sourceLanguage.value = result.sourceLanguage;
    } else {
      sourceLanguage.value = 'en';
    }

    // Загружаем целевой язык (старый ключ language для обратной совместимости)
    const targetLangValue = result.targetLanguage || result.language;
    if (
      targetLangValue &&
      targetLanguage.querySelector(`option[value="${targetLangValue}"]`)
    ) {
      targetLanguage.value = targetLangValue;
    } else if (targetLanguage.querySelector('option[value="ru"]')) {
      targetLanguage.value = 'ru'; // По умолчанию русский
    }

    // Загружаем голос
    console.log(
      '🎤 Loading voice:',
      result.voiceGender,
      'available options:',
      Array.from(voiceGender.options).map((o) => o.value),
    );
    if (
      result.voiceGender &&
      voiceGender.querySelector(`option[value="${result.voiceGender}"]`)
    ) {
      voiceGender.value = result.voiceGender;
      console.log('🎤 Voice set to:', voiceGender.value);
    } else {
      console.log('⚠️ Voice not found in options:', result.voiceGender);
    }

    // ЗАГРУЖАЕМ СТИЛЬ ПЕРЕВОДА
    if (
      result.translationStyle &&
      translationStyle.querySelector(
        `option[value="${result.translationStyle}"]`,
      )
    ) {
      translationStyle.value = result.translationStyle;
    }

    if (result.enableVoice !== undefined && enableVoice) {
      enableVoice.checked = result.enableVoice;
    }

    if (result.volume !== undefined) {
      originalVolume.value = result.volume;
      volumeValue.textContent = result.volume + '%';
    }

    if (result.mute !== undefined) {
      muteOriginal.checked = result.mute;
    }

    if (result.subtitles !== undefined) {
      showSubtitles.checked = result.subtitles;
    }

    if (result.account) {
      accountEmail.textContent = result.account.email || 'Not signed in';
      minutesDisplay.textContent = result.account.minutes || '∞';
    }
  } catch (error) {
    console.error('❌ Failed to load settings:', error);
  }
}

// ==================== СОХРАНЕНИЕ НАСТРОЕК ====================
function saveSettings() {
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');
  const voiceGender = document.getElementById('voiceGender');
  const translationStyle = document.getElementById('translationStyle');
  const enableVoice = document.getElementById('enableVoice');
  const originalVolume = document.getElementById('originalVolume');
  const muteOriginal = document.getElementById('muteOriginal');
  const showSubtitles = document.getElementById('showSubtitles');

  const settings = {
    sourceLanguage: sourceLanguage.value,
    targetLanguage: targetLanguage.value,
    voiceGender: voiceGender ? voiceGender.value : 'neutral',
    translationStyle: translationStyle ? translationStyle.value : 'default',
    enableVoice: enableVoice ? enableVoice.checked : true,
    volume: originalVolume.value,
    mute: muteOriginal.checked,
    subtitles: showSubtitles.checked,
    lastUpdated: Date.now(),
  };

  chrome.storage.local.set(settings).catch((error) => {
    console.error('❌ Failed to save settings:', error);
  });
}

// ==================== ПОЛУЧЕНИЕ НАСТРОЕК ====================
function getSettings() {
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');
  const voiceGender = document.getElementById('voiceGender');
  const translationStyle = document.getElementById('translationStyle');
  const enableVoice = document.getElementById('enableVoice');
  const originalVolume = document.getElementById('originalVolume');
  const muteOriginal = document.getElementById('muteOriginal');
  const showSubtitles = document.getElementById('showSubtitles');

  return {
    sourceLanguage: sourceLanguage.value,
    targetLanguage: targetLanguage.value,
    translateEnabled: targetLanguage.value !== 'original',
    voiceGender: voiceGender ? voiceGender.value : 'neutral',
    translationStyle: translationStyle ? translationStyle.value : 'default',
    enableVoice: enableVoice ? enableVoice.checked : true,
    showSubtitles: showSubtitles.checked,
    muteOriginal: muteOriginal.checked,
    originalVolume: parseInt(originalVolume.value) / 100,
  };
}

// ==================== ОТПРАВКА ОБНОВЛЕНИЙ ====================
async function sendVolumeUpdateIfActive() {
  if (!isCapturing) return;

  const originalVolume = document.getElementById('originalVolume');
  const muteOriginal = document.getElementById('muteOriginal');

  const volumeSettings = {
    muteOriginal: muteOriginal.checked,
    originalVolume: parseInt(originalVolume.value) / 100,
  };

  console.log('🔊 Sending volume update:', volumeSettings);

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_VOLUME_FROM_POPUP',
      settings: volumeSettings,
    });

    if (response?.success) {
      console.log('✅ Volume update sent successfully');

      setTimeout(() => {
        chrome.runtime
          .sendMessage({
            type: 'UPDATE_VOLUME',
            settings: volumeSettings,
          })
          .catch((error) => {
            console.log('⚠️ Direct offscreen update failed:', error.message);
          });
      }, 50);
    } else {
      console.warn('⚠️ Volume update failed:', response?.error);
    }
  } catch (error) {
    console.error('❌ Volume update error:', error);
  }
}

async function sendVoiceUpdateIfActive() {
  if (!isCapturing) return;

  const voiceGender = document.getElementById('voiceGender');
  const enableVoice = document.getElementById('enableVoice');

  const voiceSettings = {
    voiceGender: voiceGender ? voiceGender.value : 'neutral',
    enableVoice: enableVoice ? enableVoice.checked : true,
  };

  console.log('🎤 Sending voice update:', voiceSettings);

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_VOICE_FROM_POPUP',
      settings: voiceSettings,
    });

    if (!response?.success) {
      console.warn('⚠️ Voice update failed:', response?.error);
    }
  } catch (error) {
    console.error('❌ Voice update error:', error);
  }
}

async function sendSettingsUpdateIfActive() {
  if (!isCapturing) return;

  const showSubtitles = document.getElementById('showSubtitles');
  const enableVoice = document.getElementById('enableVoice');
  const translationStyle = document.getElementById('translationStyle');
  const voiceGender = document.getElementById('voiceGender');

  const settings = {
    showSubtitles: showSubtitles.checked,
    enableVoice: enableVoice ? enableVoice.checked : true,
    translationStyle: translationStyle ? translationStyle.value : 'default',
    voiceGender: voiceGender ? voiceGender.value : 'neutral',
  };

  console.log('⚙️ Sending ALL settings update:', settings);

  // СИЛЬНАЯ ОТПРАВКА - 5 раз для надежности
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      sendSettingsToAll(settings);
    }, i * 100);
  }
}

// Новая функция для отправки во все места
async function sendSettingsToAll(settings) {
  try {
    // 1. Отправляем в background
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS_FROM_POPUP',
      settings: settings,
    });

    // 2. Отправляем прямо в offscreen
    chrome.runtime
      .sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: settings,
      })
      .catch(() => {});

    // 3. Отправляем прямо в content script для немедленного скрытия
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs
          .sendMessage(tabs[0].id, {
            type: 'UPDATE_SETTINGS',
            settings: settings,
          })
          .catch(() => {});
      }
    });

    console.log('📨 Settings sent to all:', settings);
  } catch (error) {
    console.log('⚠️ Settings send error:', error.message);
  }
}

async function sendLanguageUpdateIfActive() {
  if (!isCapturing) return;

  const targetLanguage = document.getElementById('targetLanguage');
  const voiceGender = document.getElementById('voiceGender');
  const translationStyle = document.getElementById('translationStyle');
  const enableVoice = document.getElementById('enableVoice');
  const showSubtitles = document.getElementById('showSubtitles');
  const muteOriginal = document.getElementById('muteOriginal');
  const originalVolume = document.getElementById('originalVolume');

  if (!targetLanguage) return;

  console.log('🌐 Language changed to:', targetLanguage.value);

  const newSettings = {
    targetLanguage: targetLanguage.value,
    translateEnabled: targetLanguage.value !== 'original',
    voiceGender: voiceGender ? voiceGender.value : 'neutral',
    translationStyle: translationStyle ? translationStyle.value : 'default',
    enableVoice: enableVoice ? enableVoice.checked : true,
    showSubtitles: showSubtitles.checked,
    muteOriginal: muteOriginal.checked,
    originalVolume: parseInt(originalVolume.value) / 100,
  };

  const statusText = document.getElementById('statusText');
  const oldText = statusText.textContent;
  statusText.textContent = 'Language changed - updating...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_LANGUAGE_FROM_POPUP',
      settings: newSettings,
    });

    if (response?.success) {
      statusText.textContent = 'Language updated';
      setTimeout(() => {
        if (isCapturing) {
          statusText.textContent = oldText;
        }
      }, 1500);
    } else {
      statusText.textContent = 'Failed to update language';
      setTimeout(() => {
        if (isCapturing) {
          statusText.textContent = oldText;
        }
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Language update error:', error);
    statusText.textContent = 'Update error';
    setTimeout(() => {
      if (isCapturing) {
        statusText.textContent = oldText;
      }
    }, 2000);
  }
}

// ==================== ЗАПУСК ПЕРЕВОДА ====================
async function startTranslation() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');
  const voiceGender = document.getElementById('voiceGender');
  const translationStyle = document.getElementById('translationStyle');
  const enableVoice = document.getElementById('enableVoice');
  const originalVolume = document.getElementById('originalVolume');
  const muteOriginal = document.getElementById('muteOriginal');
  const showSubtitles = document.getElementById('showSubtitles');

  console.log('🚀 Starting translation...');

  if (
    parseInt(originalVolume.value) < 0 ||
    parseInt(originalVolume.value) > 100
  ) {
    alert('Volume must be between 0 and 100%');
    return;
  }

  startBtn.disabled = true;
  statusText.textContent = 'Checking tab...';
  statusIndicator.classList.remove('active');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }

    const currentTab = tabs[0];
    console.log('🎯 Target tab:', currentTab.id, currentTab.url);

    if (currentTab.url.startsWith('chrome://')) {
      alert(
        'Cannot translate Chrome internal pages. Please open a website with audio/video content.',
      );
      startBtn.disabled = false;
      return;
    }

    statusText.textContent = 'Requesting permissions...';

    currentSettings = {
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value,
      translateEnabled: targetLanguage.value !== 'original',
      voiceGender: voiceGender ? voiceGender.value : 'neutral',
      translationStyle: translationStyle ? translationStyle.value : 'default',
      enableVoice: enableVoice ? enableVoice.checked : true,
      showSubtitles: showSubtitles.checked,
      muteOriginal: muteOriginal.checked,
      originalVolume: parseInt(originalVolume.value) / 100,
    };

    console.log('⚙️ Starting with settings:', currentSettings);

    saveSettings();

    const response = await chrome.runtime.sendMessage({
      type: 'START_TAB_CAPTURE',
      settings: currentSettings,
    });

    console.log('📡 Start response:', response);

    if (response?.success) {
      isCapturing = true;
      statusText.textContent =
        targetLanguage.value === 'original'
          ? 'Transcribing...'
          : 'Translating...';
      statusIndicator.classList.add('active');
      startBtn.className = 'btn-secondary'; // Старт становится серым
      stopBtn.className = 'btn-primary';
      stopBtn.disabled = false;

      statusIndicator.classList.remove('error');
      delete statusText.dataset.restoreText;
      delete statusIndicator.dataset.restoreActive;
      clearStoredError();

      updateMinutesDisplay();

      // Реальный счётчик: для гостя запускаем обновление каждые 2 сек
      const r = await chrome.storage.local.get(['account']);
      if (!r.account) {
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        countdownIntervalId = setInterval(updateGuestCountdown, 2000);
      }

      console.log('✅ Translation started successfully');
    } else {
      const errorMessage = response?.error || 'Unknown error';
      if (errorMessage === 'GUEST_LIMIT_EXCEEDED') {
        statusText.textContent = '3 free minutes used. Sign up for 5 min/month or Pro';
        updateBlockState();
        updateMinutesDisplay();
        startBtn.disabled = true;
      } else {
        alert(`Failed to start: ${errorMessage}`);
        startBtn.disabled = false;
        statusText.textContent = 'Ready to translate';
      }
    }
  } catch (error) {
    console.error('❌ Start translation error:', error);
    alert(`Critical error: ${error.message}`);
    startBtn.disabled = false;
    statusText.textContent = 'Ready to translate';
  }
}

// ==================== ОСТАНОВКА ПЕРЕВОДА ====================
async function stopTranslation() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');

  console.log('🛑 Stopping translation...');

  stopBtn.disabled = true;
  statusText.textContent = 'Stopping...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'STOP_TAB_CAPTURE',
    });

    console.log('📡 Stop response:', response);

    if (response?.success) {
      isCapturing = false;
      currentSettings = null;
      isUserInteracting = false;
      volumeSliderInteraction = false;

      statusText.textContent = 'Ready to translate';
      statusIndicator.classList.remove('active');
      startBtn.className = "btn-primary";    // Старт становится цветным
        stopBtn.className = "btn-secondary";   // Стоп становится серым
        stopBtn.disabled = true;   
      startBtn.disabled = false;
      statusIndicator.classList.remove('error');
      delete statusText.dataset.restoreText;
      delete statusIndicator.dataset.restoreActive;

      if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }
      updateMinutesDisplay();
      updateBlockState();

      console.log(
        `✅ Stopped successfully. Duration: ${response.duration || 0}s`,
      );
    } else {
      const errorMessage = response?.error || 'Unknown error';
      alert(`Failed to stop: ${errorMessage}`);
      stopBtn.disabled = false;
    }
  } catch (error) {
    console.error('❌ Stop translation error:', error);
    alert(`Critical error: ${error.message}`);
    stopBtn.disabled = false;
  }
}

// ==================== ОБНОВЛЕНИЕ СТАТУСА ====================
async function updateStatus() {
  if (isUserInteracting || volumeSliderInteraction) {
    return;
  }

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');

  // Проверяем наличие основных элементов интерфейса
  if (!startBtn || !stopBtn || !statusText || !statusIndicator) {
    console.log('⚠️ Interface elements not ready yet, skipping status update');
    return;
  }

  // Безопасная проверка элементов выбора языка
  const sourceSelect = document.getElementById('sourceLanguage');
  const targetSelect = document.getElementById('targetLanguage');

  // Проверяем, существуют ли элементы, прежде чем брать их значения
  if (sourceSelect && targetSelect) {
    const sourceLang = sourceSelect.value;
    const targetLang = targetSelect.value;
    // ... остальной код обновления статуса
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_STATUS',
    });

    if (response?.isCapturing) {
      isCapturing = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      statusIndicator.classList.add('active');
      statusIndicator.classList.remove('error');

      startBtn.className = "btn-secondary";  // Старт становится серым
      stopBtn.className = "btn-primary"; 

      if (response.settings?.targetLanguage === 'original') {
        statusText.textContent = 'Transcribing...';
      } else {
        statusText.textContent = 'Translating...';
      }

      if (response.settings && !isUserInteracting && !volumeSliderInteraction) {
        currentSettings = response.settings;
        updateUIFromSettings(response.settings);
      }
    } else {
      isCapturing = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      statusIndicator.classList.remove('active');
      statusIndicator.classList.remove('error');
      startBtn.className = "btn-primary";  // Старт становится цветным
      stopBtn.className = "btn-secondary";  // Стоп становится серым

      if (statusText.textContent.includes('...')) {
        statusText.textContent = 'Ready to translate';
      }
    }
  } catch (error) {
    console.log('⚠️ Status check error (non-critical):', error.message);
  }
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ИЗ НАСТРОЕК ====================
function updateUIFromSettings(settings) {
  if (!settings || isUserInteracting || volumeSliderInteraction) {
    return;
  }

  console.log('🎛️ Updating UI from offscreen settings:', settings);

  const targetLanguage = document.getElementById('targetLanguage');
  const voiceGender = document.getElementById('voiceGender');
  const translationStyle = document.getElementById('translationStyle');
  const enableVoice = document.getElementById('enableVoice');
  const originalVolume = document.getElementById('originalVolume');
  const volumeValue = document.getElementById('volumeValue');
  const muteOriginal = document.getElementById('muteOriginal');
  const showSubtitles = document.getElementById('showSubtitles');

  if (
    settings.targetLanguage &&
    targetLanguage &&
    targetLanguage.value !== settings.targetLanguage
  ) {
    targetLanguage.value = settings.targetLanguage;
  }

  // НЕ обновляем голос из настроек offscreen - пользователь должен контролировать голос
  // if (settings.voiceGender && voiceGender && voiceGender.value !== settings.voiceGender) {
  //     console.log('🎤 Updating UI voice from:', voiceGender.value, 'to:', settings.voiceGender);
  //     voiceGender.value = settings.voiceGender;
  // }

  // ОБНОВЛЯЕМ СТИЛЬ ПЕРЕВОДА
  if (
    settings.translationStyle &&
    translationStyle &&
    translationStyle.value !== settings.translationStyle
  ) {
    translationStyle.value = settings.translationStyle;
  }

  if (
    settings.enableVoice !== undefined &&
    enableVoice &&
    enableVoice.checked !== settings.enableVoice
  ) {
    enableVoice.checked = settings.enableVoice;
  }

  if (settings.originalVolume !== undefined) {
    const volumePercent = Math.round(settings.originalVolume * 100);

    if (Math.abs(parseInt(originalVolume.value) - volumePercent) > 1) {
      originalVolume.value = volumePercent;
      volumeValue.textContent = volumePercent + '%';
    }

    if (settings.muteOriginal !== undefined) {
      muteOriginal.checked = settings.muteOriginal;

      if (settings.muteOriginal && volumePercent > 0) {
        originalVolume.value = 0;
        volumeValue.textContent = '0%';
      }
    }
  }

  if (settings.showSubtitles !== undefined) {
    showSubtitles.checked = settings.showSubtitles;
  }
}

// ==================== ОБНОВЛЕНИЕ МИНУТ ====================
async function updateMinutesDisplay() {
  const minutesDisplay = document.getElementById('minutesDisplay');
  const accountEmail = document.getElementById('accountEmail');

  try {
     // ================ ДОБАВИЛ ТУТ: ЗАПРОС БАЛАНСА ИЗ API ================
    // 1. Запрашиваем баланс минут через background
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_MINUTES_BALANCE' }, resolve);
    });
    
    if (response.success && response.balance) {
      const balance = response.balance;
      
      // 2. Обновляем email
      chrome.storage.local.get(['account'], (storage) => {
        if (storage.account && storage.account.email) {
          accountEmail.textContent = storage.account.email;
        } else if (balance.email) {
          accountEmail.textContent = balance.email;
        } else {
          accountEmail.textContent = 'Guest user';
        }
      });
      
      // 3. Рассчитываем доступные минуты
      const freeMinutesAvailable = balance.free_minutes_available || 0;
      const paidMinutesLeft = balance.paid_minutes_left || 0;
      const totalAvailable = freeMinutesAvailable + paidMinutesLeft;
      
      // 4. Обновляем отображение минут
      minutesDisplay.textContent = totalAvailable > 99 ? '∞' : totalAvailable.toFixed(1);
      
      // 5. Цвет в зависимости от лимита
      if (totalAvailable <= 0) {
        minutesDisplay.style.color = '#ef4444';
      } else if (totalAvailable <= 1) {
        minutesDisplay.style.color = '#f59e0b';
      } else {
        minutesDisplay.style.color = '#10b981';
      }
      
      // 6. Сохраняем для других функций
      chrome.storage.local.set({ 
        guestMinutesUsed: (balance.free_minutes_used || 0),
        minutesBalance: balance 
      });
      
      return;
    }
    // ================ КОНЕЦ НОВОГО КОДА ================
      // Fallback на старую логику (если API не работает)
    
    const result = await chrome.storage.local.get(['account', 'guestMinutesUsed']);

    if (result.account) {
      accountEmail.textContent = result.account.email || 'Not signed in';
      minutesDisplay.textContent = result.account.minutes || '∞';
    } else {
      accountEmail.textContent = 'Not signed in';
      const used = result.guestMinutesUsed || 0;
      const remaining = Math.max(0, GUEST_FREE_MINUTES - used);
      minutesDisplay.textContent = remaining.toFixed(1);
    }
  } catch (error) {
    console.error('❌ Failed to update account display:', error);
    minutesDisplay.textContent = '--';
    accountEmail.textContent = 'Error loading';
  }
}

function updateGuestCountdown() {
  const minutesDisplay = document.getElementById('minutesDisplay');
  const accountEmail = document.getElementById('accountEmail');
  if (!minutesDisplay) return;

  chrome.storage.local.get(['account', 'sessionStartTime', 'captureActive', 'guestMinutesUsed'], (r) => {
    if (r.account) return;

    if (!r.captureActive || !r.sessionStartTime) {
      const used = r.guestMinutesUsed || 0;
      const remaining = Math.max(0, GUEST_FREE_MINUTES - used);
      minutesDisplay.textContent = remaining.toFixed(1);
      if (!r.captureActive && isCapturing) {
        isCapturing = false;
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = true;
        if (statusText) statusText.textContent = '3 free minutes used. Sign up for 5 min/month or Pro';
        if (statusIndicator) statusIndicator.classList.remove('active');
        updateBlockState();
        if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
      }
      return;
    }

    const elapsedMin = (Date.now() - r.sessionStartTime) / 60000;
    const remaining = Math.max(0, GUEST_FREE_MINUTES - elapsedMin);
    minutesDisplay.textContent = remaining.toFixed(1);
  });
}

// async function updateBlockState() {
//   const startBtn = document.getElementById('startBtn');
//   const blockOverlay = document.getElementById('guestBlockOverlay');

//   try {
//     const r = await chrome.storage.local.get(['account', 'guestMinutesUsed']);
//     const isBlocked = !r.account && (r.guestMinutesUsed || 0) >= GUEST_FREE_MINUTES;

//     if (blockOverlay) blockOverlay.style.display = isBlocked ? 'flex' : 'none';
//     if (startBtn) startBtn.disabled = isBlocked;
//   } catch (e) {}
// }

async function updateBlockState() {
  const startBtn = document.getElementById('startBtn');
  const blockOverlay = document.getElementById('guestBlockOverlay');

  try {
    // 1. Проверяем баланс из БД
    const response = await chrome.runtime.sendMessage({ 
      type: 'GET_MINUTES_BALANCE' 
    });
    
    let isBlocked = false;
    
    if (response.success && response.balance) {
      // Блокировка по данным БД
      isBlocked = !response.balance.allowed || response.balance.free_minutes_available <= 0;
    } else {
      // Fallback на localStorage для гостей
      const r = await chrome.storage.local.get(['account', 'guestMinutesUsed']);
      isBlocked = !r.account && (r.guestMinutesUsed || 0) >= GUEST_FREE_MINUTES;
    }

    if (blockOverlay) blockOverlay.style.display = isBlocked ? 'flex' : 'none';
    if (startBtn) startBtn.disabled = isBlocked;
  } catch (e) {
    console.log('Block state error:', e);
  }
}

function openWebsite() {
  // chrome.tabs.create({ url: WEBSITE_URL + '/en/register' });
  chrome.tabs.create({ 
    url: 'https://translateme-app.vercel.app' 
  });
}


async function displayStoredError() {
  try {
    const { lastOffscreenError } = await chrome.storage.local.get([
      'lastOffscreenError',
    ]);
    if (lastOffscreenError) {
      flashStatusError(formatOffscreenError(lastOffscreenError));
    }
  } catch (error) {
    console.warn('⚠️ Failed to read stored offscreen error:', error);
  }
}

function formatOffscreenError(error) {
  if (!error) {
    return 'Translation service error';
  }

  const parts = [];
  if (error.stage) parts.push(error.stage.toUpperCase());
  if (error.status) parts.push(`#${error.status}`);
  if (error.statusText) parts.push(error.statusText);
  if (error.message) parts.push(error.message);

  return parts.length > 0 ? parts.join(' · ') : 'Translation service error';
}

function flashStatusError(message, duration = 5000) {
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');

  if (!statusText || !statusIndicator || !message) {
    return;
  }

  if (!statusText.dataset.restoreText) {
    statusText.dataset.restoreText = statusText.textContent;
  }

  if (!statusIndicator.dataset.restoreActive) {
    statusIndicator.dataset.restoreActive = statusIndicator.classList.contains(
      'active',
    )
      ? 'true'
      : 'false';
  }

  statusText.textContent = message;
  statusIndicator.classList.remove('active');
  statusIndicator.classList.add('error');

  if (statusErrorTimer) {
    clearTimeout(statusErrorTimer);
  }

  statusErrorTimer = setTimeout(() => {
    const restoreText = statusText.dataset.restoreText || 'Ready to translate';
    const wasActive = statusIndicator.dataset.restoreActive === 'true';
    statusText.textContent = restoreText;
    statusIndicator.classList.remove('error');
    if (wasActive) {
      statusIndicator.classList.add('active');
    }
    delete statusText.dataset.restoreText;
    delete statusIndicator.dataset.restoreActive;
    statusErrorTimer = null;
  }, duration);
}

async function clearStoredError() {
  try {
    await chrome.storage.local.remove('lastOffscreenError');
  } catch (error) {
    console.warn('⚠️ Failed to clear stored offscreen error:', error);
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (request?.type === 'OFFSCREEN_ERROR') {
    flashStatusError(formatOffscreenError(request.error));
  }
});

// ==================== ПРОВЕРКА API ====================
async function checkAPIAvailability() {
  try {
    if (!chrome.runtime?.id) {
      throw new Error('Extension not loaded');
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      console.warn('⚠️ No active tab found');
    }

    console.log('✅ Chrome APIs available');
    return true;
  } catch (error) {
    console.error('❌ Chrome APIs not available:', error);

    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startBtn');

    statusText.textContent = 'Extension error - reload page';
    startBtn.disabled = true;

    return false;
  }
}

checkAPIAvailability();

// ==================== SUMMARY PDF FUNCTIONS ====================
async function updateTranscriptStatus() {
  const summaryBtn = document.getElementById('summaryBtn');
  const summaryStatus = document.getElementById('summaryStatus');
  const transcriptInfo = document.getElementById('transcriptInfo');

  if (!summaryBtn || !summaryStatus) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_TRANSCRIPT',
    });

    if (response?.success && response.entries > 0) {
      summaryStatus.style.display = 'block';
      transcriptInfo.textContent = `${response.durationMinutes} min of text collected (${response.entries} segments)`;
      summaryBtn.disabled = false;
      summaryBtn.style.opacity = '1';
    } else {
      summaryStatus.style.display = 'none';
      summaryBtn.disabled = true;
      summaryBtn.style.opacity = '0.5';
    }
  } catch (error) {
    console.log('⚠️ Transcript status check error:', error.message);
  }
}

async function generateSummaryPDF() {
  const summaryBtn = document.getElementById('summaryBtn');
  const transcriptInfo = document.getElementById('transcriptInfo');

  const originalText = summaryBtn.textContent;
  summaryBtn.disabled = true;
  summaryBtn.textContent = '⏳ Getting transcript...';

  try {
    // 1. Получаем накопленный транскрипт
    const transcriptResponse = await chrome.runtime.sendMessage({
      type: 'GET_TRANSCRIPT',
    });

    if (!transcriptResponse?.success || !transcriptResponse.transcript) {
      throw new Error('No transcript available');
    }

    const transcript = transcriptResponse.transcript;
    const targetLang = transcriptResponse.targetLanguage || 'ru';
    const duration = transcriptResponse.durationMinutes || 0;

    console.log(
      `📝 Got transcript: ${transcript.length} chars, ${duration} min`,
    );

    // 2. Генерируем summary через OpenAI
    summaryBtn.textContent = '⏳ Generating summary...';

    const summaryResponse = await chrome.runtime.sendMessage({
      type: 'GENERATE_SUMMARY',
      text: transcript,
      targetLang: targetLang,
    });

    if (!summaryResponse?.success || !summaryResponse.summary) {
      throw new Error(summaryResponse?.error || 'Failed to generate summary');
    }

    console.log(
      `✅ Summary generated: ${summaryResponse.summary.length} chars`,
    );

    // 3. Создаём PDF
    summaryBtn.textContent = '⏳ Creating PDF...';

    const pdfResponse = await chrome.runtime.sendMessage({
      type: 'CREATE_PDF',
      summary: summaryResponse.summary,
      title: 'Video Summary',
      duration: duration,
    });

    if (!pdfResponse?.success || !pdfResponse.pdfDataUrl) {
      throw new Error(pdfResponse?.error || 'Failed to create PDF');
    }

    // 4. Скачиваем PDF
    const link = document.createElement('a');
    link.href = pdfResponse.pdfDataUrl;
    link.download = `video-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    summaryBtn.textContent = '✅ PDF Скачан!';
    setTimeout(() => {
      summaryBtn.textContent = originalText;
      summaryBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('❌ Summary PDF error:', error);
    alert(`Failed to generate summary: ${error.message}`);
    summaryBtn.textContent = originalText;
    summaryBtn.disabled = false;
  }
}

console.log(
  '✅ Popup ready with voice selection, translation styles, and Summary PDF',
);
