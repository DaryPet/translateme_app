// // popup.js - ПОЛНЫЙ РАБОЧИЙ КОД С ВЫБОРОМ ГОЛОСА
// console.log('🔴 POPUP LOADED - ENHANCED WITH VOICE SELECTION');

// let currentSettings = null;
// let isCapturing = false;
// let isUserInteracting = false;
// let volumeSliderInteraction = false;

// document.addEventListener('DOMContentLoaded', async () => {
//     const startBtn = document.getElementById('startBtn');
//     const stopBtn = document.getElementById('stopBtn');
//     const statusText = document.getElementById('statusText');
//     const statusIndicator = document.getElementById('statusIndicator');
//     const languageSelect = document.getElementById('languageSelect');
//     const voiceGender = document.getElementById('voiceGender');
//     const enableVoice = document.getElementById('enableVoice');
//     const originalVolume = document.getElementById('originalVolume');
//     const volumeValue = document.getElementById('volumeValue');
//     const muteOriginal = document.getElementById('muteOriginal');
//     const showSubtitles = document.getElementById('showSubtitles');
//     const minutesDisplay = document.getElementById('minutesDisplay');
//     const accountEmail = document.getElementById('accountEmail');
//     const collapseBtn = document.getElementById('collapseBtn');
//     const expandBtn = document.getElementById('expandBtn');
    
//     if (!chrome.tabs || !chrome.runtime) {
//         console.error('❌ Chrome API not available');
//         return;
//     }
    
//     // ==================== КНОПКА СВЕРНУТЬ/РАЗВЕРНУТЬ ====================
//     if (collapseBtn) {
//         collapseBtn.addEventListener('click', toggleCollapse);
//     }
//     if (expandBtn) {
//         expandBtn.addEventListener('click', toggleCollapse);
//     }
    
//     function toggleCollapse() {
//         const main = document.getElementById('mainContent');
//         const collapsed = document.getElementById('collapsedContent');
        
//         if (main.style.display !== 'none') {
//             main.style.display = 'none';
//             collapsed.style.display = 'block';
//         } else {
//             main.style.display = 'block';
//             collapsed.style.display = 'none';
//         }
//     }
    
//     // ==================== ИНИЦИАЛИЗАЦИЯ ====================
//     console.log('🔧 Initializing popup...');
    
//     await loadSavedSettings();
    
//     // ==================== ЛОГИКА ПОЛЗУНКА И MUTE ====================
//     function updateVolumeDisplay() {
//         const value = originalVolume.value;
//         volumeValue.textContent = value + '%';
        
//         if (value > 0 && muteOriginal.checked) {
//             muteOriginal.checked = false;
//         }
        
//         if (value === '0' && !muteOriginal.checked) {
//             muteOriginal.checked = true;
//         }
        
//         saveSettings();
        
//         if (isCapturing && !volumeSliderInteraction) {
//             sendVolumeUpdateIfActive();
//         }
//     }
    
//     originalVolume.addEventListener('input', () => {
//         volumeSliderInteraction = true;
//         updateVolumeDisplay();
//     });
    
//     originalVolume.addEventListener('change', () => {
//         volumeSliderInteraction = false;
//         updateVolumeDisplay();
//     });
    
//     originalVolume.addEventListener('mousedown', () => {
//         volumeSliderInteraction = true;
//     });
    
//     originalVolume.addEventListener('mouseup', () => {
//         volumeSliderInteraction = false;
//         updateVolumeDisplay();
//     });
    
//     originalVolume.addEventListener('touchstart', () => {
//         volumeSliderInteraction = true;
//     });
    
//     originalVolume.addEventListener('touchend', () => {
//         setTimeout(() => {
//             volumeSliderInteraction = false;
//             updateVolumeDisplay();
//         }, 100);
//     });
    
//     muteOriginal.addEventListener('change', () => {
//         isUserInteracting = true;
        
//         if (muteOriginal.checked) {
//             originalVolume.value = 0;
//             volumeValue.textContent = '0%';
//         } else {
//             originalVolume.value = originalVolume.value === '0' ? '50' : originalVolume.value;
//             volumeValue.textContent = originalVolume.value + '%';
//         }
        
//         saveSettings();
        
//         if (isCapturing) {
//             sendVolumeUpdateIfActive();
//         }
        
//         setTimeout(() => {
//             isUserInteracting = false;
//         }, 500);
//     });
    
//     // ==================== ОБРАБОТЧИКИ ВЫБОРА ====================
//     languageSelect.addEventListener('change', () => {
//         console.log('🌐 Language changed to:', languageSelect.value);
//         saveSettings();
//         sendLanguageUpdateIfActive();
//     });
    
//     if (voiceGender) {
//         voiceGender.addEventListener('change', () => {
//             console.log('👤 Voice gender changed to:', voiceGender.value);
//             saveSettings();
//             sendVoiceUpdateIfActive();
//         });
//     }
    
//     // Обработчик для голоса с логированием
//     if (enableVoice) {
//         enableVoice.addEventListener('change', () => {
//             console.log('🎤 Voice toggle changed to:', enableVoice.checked);
//             saveSettings();
//             if (isCapturing) {
//                 sendSettingsUpdateIfActive();
//             }
//         });
//     }
    
//     // Обработчик для субтитров с логированием
//     showSubtitles.addEventListener('change', () => {
//         console.log('📝 Subtitles toggle changed to:', showSubtitles.checked);
//         saveSettings();
//         if (isCapturing) {
//             sendSettingsUpdateIfActive();
//         }
//     });
    
//     // ==================== КНОПКИ ====================
//     startBtn.addEventListener('click', startTranslation);
//     stopBtn.addEventListener('click', stopTranslation);
    
//     document.getElementById('buyBtn')?.addEventListener('click', () => {
//         alert('Buy minutes functionality coming soon!');
//     });
    
//     document.getElementById('settingsBtn')?.addEventListener('click', () => {
//         const settingsPanel = document.getElementById('settingsPanel');
//         settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
//     });
    
//     // ==================== ПРОВЕРКА СТАТУСА ====================
//     await updateStatus();
    
//     const statusInterval = setInterval(updateStatus, 2000);
    
//     window.addEventListener('unload', () => {
//         clearInterval(statusInterval);
//     });
    
//     console.log('✅ Popup UI initialized');
// });

// // ==================== ЗАГРУЗКА СОХРАНЕННЫХ НАСТРОЕК ====================
// async function loadSavedSettings() {
//     try {
//         const result = await chrome.storage.local.get([
//             'language', 'volume', 'mute', 'subtitles', 'account', 'voiceGender', 'enableVoice'
//         ]);
        
//         console.log('📂 Loaded saved settings:', result);
        
//         const languageSelect = document.getElementById('languageSelect');
//         const voiceGender = document.getElementById('voiceGender');
//         const enableVoice = document.getElementById('enableVoice');
//         const originalVolume = document.getElementById('originalVolume');
//         const volumeValue = document.getElementById('volumeValue');
//         const muteOriginal = document.getElementById('muteOriginal');
//         const showSubtitles = document.getElementById('showSubtitles');
//         const accountEmail = document.getElementById('accountEmail');
//         const minutesDisplay = document.getElementById('minutesDisplay');
        
//         if (result.language && languageSelect.querySelector(`option[value="${result.language}"]`)) {
//             languageSelect.value = result.language;
//         }
        
//         if (result.voiceGender && voiceGender) {
//             voiceGender.value = result.voiceGender;
//         }
        
//         if (result.enableVoice !== undefined && enableVoice) {
//             enableVoice.checked = result.enableVoice;
//         }
        
//         if (result.volume !== undefined) {
//             originalVolume.value = result.volume;
//             volumeValue.textContent = result.volume + '%';
//         }
        
//         if (result.mute !== undefined) {
//             muteOriginal.checked = result.mute;
//         }
        
//         if (result.subtitles !== undefined) {
//             showSubtitles.checked = result.subtitles;
//         }
        
//         if (result.account) {
//             accountEmail.textContent = result.account.email || 'Not signed in';
//             minutesDisplay.textContent = result.account.minutes || '∞';
//         }
        
//     } catch (error) {
//         console.error('❌ Failed to load settings:', error);
//     }
// }

// // ==================== СОХРАНЕНИЕ НАСТРОЕК ====================
// function saveSettings() {
//     const languageSelect = document.getElementById('languageSelect');
//     const voiceGender = document.getElementById('voiceGender');
//     const enableVoice = document.getElementById('enableVoice');
//     const originalVolume = document.getElementById('originalVolume');
//     const muteOriginal = document.getElementById('muteOriginal');
//     const showSubtitles = document.getElementById('showSubtitles');
    
//     const settings = {
//         language: languageSelect.value,
//         voiceGender: voiceGender ? voiceGender.value : 'neutral',
//         enableVoice: enableVoice ? enableVoice.checked : true,
//         volume: originalVolume.value,
//         mute: muteOriginal.checked,
//         subtitles: showSubtitles.checked,
//         lastUpdated: Date.now()
//     };
    
//     chrome.storage.local.set(settings).catch(error => {
//         console.error('❌ Failed to save settings:', error);
//     });
// }

// // ==================== ПОЛУЧЕНИЕ НАСТРОЕК ====================
// function getSettings() {
//     const languageSelect = document.getElementById('languageSelect');
//     const voiceGender = document.getElementById('voiceGender');
//     const enableVoice = document.getElementById('enableVoice');
//     const originalVolume = document.getElementById('originalVolume');
//     const muteOriginal = document.getElementById('muteOriginal');
//     const showSubtitles = document.getElementById('showSubtitles');
    
//     return {
//         targetLanguage: languageSelect.value,
//         translateEnabled: languageSelect.value !== 'original',
//         voiceGender: voiceGender ? voiceGender.value : 'neutral',
//         enableVoice: enableVoice ? enableVoice.checked : true,
//         showSubtitles: showSubtitles.checked,
//         muteOriginal: muteOriginal.checked,
//         originalVolume: parseInt(originalVolume.value) / 100
//     };
// }

// // ==================== ОТПРАВКА ОБНОВЛЕНИЙ ====================
// async function sendVolumeUpdateIfActive() {
//     if (!isCapturing) return;
    
//     const originalVolume = document.getElementById('originalVolume');
//     const muteOriginal = document.getElementById('muteOriginal');
    
//     const volumeSettings = {
//         muteOriginal: muteOriginal.checked,
//         originalVolume: parseInt(originalVolume.value) / 100
//     };
    
//     console.log('🔊 Sending volume update:', volumeSettings);
    
//     try {
//         const response = await chrome.runtime.sendMessage({
//             type: 'UPDATE_VOLUME_FROM_POPUP',
//             settings: volumeSettings
//         });
        
//         if (response?.success) {
//             console.log('✅ Volume update sent successfully');
            
//             setTimeout(() => {
//                 chrome.runtime.sendMessage({
//                     type: 'UPDATE_VOLUME',
//                     settings: volumeSettings
//                 }).catch(error => {
//                     console.log('⚠️ Direct offscreen update failed:', error.message);
//                 });
//             }, 50);
           
//         } else {
//             console.warn('⚠️ Volume update failed:', response?.error);
//         }
//     } catch (error) {
//         console.error('❌ Volume update error:', error);
//     }
// }

// async function sendVoiceUpdateIfActive() {
//     if (!isCapturing) return;
    
//     const voiceGender = document.getElementById('voiceGender');
//     const enableVoice = document.getElementById('enableVoice');
    
//     const voiceSettings = {
//         voiceGender: voiceGender ? voiceGender.value : 'neutral',
//         enableVoice: enableVoice ? enableVoice.checked : true
//     };
    
//     console.log('🎤 Sending voice update:', voiceSettings);
    
//     try {
//         const response = await chrome.runtime.sendMessage({
//             type: 'UPDATE_VOICE_FROM_POPUP',
//             settings: voiceSettings
//         });
        
//         if (!response?.success) {
//             console.warn('⚠️ Voice update failed:', response?.error);
//         }
//     } catch (error) {
//         console.error('❌ Voice update error:', error);
//     }
// }

// async function sendSettingsUpdateIfActive() {
//     if (!isCapturing) return;
    
//     const showSubtitles = document.getElementById('showSubtitles');
//     const enableVoice = document.getElementById('enableVoice');
    
//     const settings = {
//         showSubtitles: showSubtitles.checked,
//         enableVoice: enableVoice ? enableVoice.checked : true
//     };
    
//     console.log('⚙️ Sending ALL settings update:', settings);
    
//     // СИЛЬНАЯ ОТПРАВКА - 5 раз для надежности
//     for (let i = 0; i < 5; i++) {
//         setTimeout(() => {
//             sendSettingsToAll(settings);
//         }, i * 100);
//     }
// }

// // Новая функция для отправки во все места
// async function sendSettingsToAll(settings) {
//     try {
//         // 1. Отправляем в background
//         await chrome.runtime.sendMessage({
//             type: 'UPDATE_SETTINGS_FROM_POPUP',
//             settings: settings
//         });
        
//         // 2. Отправляем прямо в offscreen
//         chrome.runtime.sendMessage({
//             type: 'UPDATE_SETTINGS',
//             settings: settings
//         }).catch(() => {});
        
//         // 3. Отправляем прямо в content script для немедленного скрытия
//         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//             if (tabs[0] && tabs[0].id) {
//                 chrome.tabs.sendMessage(tabs[0].id, {
//                     type: 'UPDATE_SETTINGS',
//                     settings: settings
//                 }).catch(() => {});
//             }
//         });
        
//         console.log('📨 Settings sent to all:', settings.showSubtitles);
//     } catch (error) {
//         console.log('⚠️ Settings send error:', error.message);
//     }
// }

// async function sendLanguageUpdateIfActive() {
//     if (!isCapturing) return;
    
//     const languageSelect = document.getElementById('languageSelect');
//     const voiceGender = document.getElementById('voiceGender');
//     const enableVoice = document.getElementById('enableVoice');
//     const showSubtitles = document.getElementById('showSubtitles');
//     const muteOriginal = document.getElementById('muteOriginal');
//     const originalVolume = document.getElementById('originalVolume');
    
//     console.log('🌐 Language changed to:', languageSelect.value);
    
//     const newSettings = {
//         targetLanguage: languageSelect.value,
//         translateEnabled: languageSelect.value !== 'original',
//         voiceGender: voiceGender ? voiceGender.value : 'neutral',
//         enableVoice: enableVoice ? enableVoice.checked : true,
//         showSubtitles: showSubtitles.checked,
//         muteOriginal: muteOriginal.checked,
//         originalVolume: parseInt(originalVolume.value) / 100
//     };
    
//     const statusText = document.getElementById('statusText');
//     const oldText = statusText.textContent;
//     statusText.textContent = 'Language changed - updating...';
    
//     try {
//         const response = await chrome.runtime.sendMessage({
//             type: 'UPDATE_LANGUAGE_FROM_POPUP',
//             settings: newSettings
//         });
        
//         if (response?.success) {
//             statusText.textContent = 'Language updated';
//             setTimeout(() => {
//                 if (isCapturing) {
//                     statusText.textContent = oldText;
//                 }
//             }, 1500);
//         } else {
//             statusText.textContent = 'Failed to update language';
//             setTimeout(() => {
//                 if (isCapturing) {
//                     statusText.textContent = oldText;
//                 }
//             }, 2000);
//         }
        
//     } catch (error) {
//         console.error('❌ Language update error:', error);
//         statusText.textContent = 'Update error';
//         setTimeout(() => {
//             if (isCapturing) {
//                 statusText.textContent = oldText;
//             }
//         }, 2000);
//     }
// }

// // ==================== ЗАПУСК ПЕРЕВОДА ====================
// async function startTranslation() {
//     const startBtn = document.getElementById('startBtn');
//     const stopBtn = document.getElementById('stopBtn');
//     const statusText = document.getElementById('statusText');
//     const statusIndicator = document.getElementById('statusIndicator');
//     const languageSelect = document.getElementById('languageSelect');
//     const voiceGender = document.getElementById('voiceGender');
//     const enableVoice = document.getElementById('enableVoice');
//     const originalVolume = document.getElementById('originalVolume');
//     const muteOriginal = document.getElementById('muteOriginal');
//     const showSubtitles = document.getElementById('showSubtitles');
    
//     console.log('🚀 Starting translation...');
    
//     if (parseInt(originalVolume.value) < 0 || parseInt(originalVolume.value) > 100) {
//         alert('Volume must be between 0 and 100%');
//         return;
//     }
    
//     startBtn.disabled = true;
//     statusText.textContent = 'Checking tab...';
//     statusIndicator.classList.remove('active');
    
//     try {
//         const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
//         if (!tabs || tabs.length === 0) {
//             throw new Error('No active tab found');
//         }
        
//         const currentTab = tabs[0];
//         console.log('🎯 Target tab:', currentTab.id, currentTab.url);
        
//         if (currentTab.url.startsWith('chrome://')) {
//             alert('Cannot translate Chrome internal pages. Please open a website with audio/video content.');
//             startBtn.disabled = false;
//             return;
//         }
        
//         statusText.textContent = 'Requesting permissions...';
        
//         currentSettings = {
//             targetLanguage: languageSelect.value,
//             translateEnabled: languageSelect.value !== 'original',
//             voiceGender: voiceGender ? voiceGender.value : 'neutral',
//             enableVoice: enableVoice ? enableVoice.checked : true,
//             showSubtitles: showSubtitles.checked,
//             muteOriginal: muteOriginal.checked,
//             originalVolume: parseInt(originalVolume.value) / 100
//         };
        
//         console.log('⚙️ Starting with settings:', currentSettings);
        
//         saveSettings();
        
//         const response = await chrome.runtime.sendMessage({
//             type: 'START_TAB_CAPTURE',
//             settings: currentSettings
//         });
        
//         console.log('📡 Start response:', response);
        
//         if (response?.success) {
//             isCapturing = true;
//             statusText.textContent = languageSelect.value === 'original' ? 'Transcribing...' : 'Translating...';
//             statusIndicator.classList.add('active');
//             stopBtn.disabled = false;
            
//             updateMinutesDisplay();
            
//             console.log('✅ Translation started successfully');
            
//         } else {
//             const errorMessage = response?.error || 'Unknown error';
//             alert(`Failed to start: ${errorMessage}`);
//             startBtn.disabled = false;
//             statusText.textContent = 'Ready to translate';
//         }
        
//     } catch (error) {
//         console.error('❌ Start translation error:', error);
//         alert(`Critical error: ${error.message}`);
//         startBtn.disabled = false;
//         statusText.textContent = 'Ready to translate';
//     }
// }

// // ==================== ОСТАНОВКА ПЕРЕВОДА ====================
// async function stopTranslation() {
//     const startBtn = document.getElementById('startBtn');
//     const stopBtn = document.getElementById('stopBtn');
//     const statusText = document.getElementById('statusText');
//     const statusIndicator = document.getElementById('statusIndicator');
    
//     console.log('🛑 Stopping translation...');
    
//     stopBtn.disabled = true;
//     statusText.textContent = 'Stopping...';
    
//     try {
//         const response = await chrome.runtime.sendMessage({ 
//             type: 'STOP_TAB_CAPTURE' 
//         });
        
//         console.log('📡 Stop response:', response);
        
//         if (response?.success) {
//             isCapturing = false;
//             currentSettings = null;
//             isUserInteracting = false;
//             volumeSliderInteraction = false;
            
//             statusText.textContent = 'Ready to translate';
//             statusIndicator.classList.remove('active');
//             startBtn.disabled = false;
            
//             updateMinutesDisplay();
            
//             console.log(`✅ Stopped successfully. Duration: ${response.duration || 0}s`);
            
//         } else {
//             const errorMessage = response?.error || 'Unknown error';
//             alert(`Failed to stop: ${errorMessage}`);
//             stopBtn.disabled = false;
//         }
        
//     } catch (error) {
//         console.error('❌ Stop translation error:', error);
//         alert(`Critical error: ${error.message}`);
//         stopBtn.disabled = false;
//     }
// }

// // ==================== ОБНОВЛЕНИЕ СТАТУСА ====================
// async function updateStatus() {
//     if (isUserInteracting || volumeSliderInteraction) {
//         return;
//     }
    
//     const startBtn = document.getElementById('startBtn');
//     const stopBtn = document.getElementById('stopBtn');
//     const statusText = document.getElementById('statusText');
//     const statusIndicator = document.getElementById('statusIndicator');
    
//     try {
//         const response = await chrome.runtime.sendMessage({ 
//             type: 'GET_STATUS' 
//         });
        
//         if (response?.isCapturing) {
//             isCapturing = true;
//             startBtn.disabled = true;
//             stopBtn.disabled = false;
//             statusIndicator.classList.add('active');
            
//             if (response.settings?.targetLanguage === 'original') {
//                 statusText.textContent = 'Transcribing...';
//             } else {
//                 statusText.textContent = 'Translating...';
//             }
            
//             if (response.settings && !isUserInteracting && !volumeSliderInteraction) {
//                 currentSettings = response.settings;
//                 updateUIFromSettings(response.settings);
//             }
            
//         } else {
//             isCapturing = false;
//             startBtn.disabled = false;
//             stopBtn.disabled = true;
//             statusIndicator.classList.remove('active');
            
//             if (statusText.textContent.includes('...')) {
//                 statusText.textContent = 'Ready to translate';
//             }
//         }
        
//     } catch (error) {
//         console.log('⚠️ Status check error (non-critical):', error.message);
//     }
// }

// // ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ИЗ НАСТРОЕК ====================
// function updateUIFromSettings(settings) {
//     if (!settings || isUserInteracting || volumeSliderInteraction) {
//         return;
//     }
    
//     const languageSelect = document.getElementById('languageSelect');
//     const voiceGender = document.getElementById('voiceGender');
//     const enableVoice = document.getElementById('enableVoice');
//     const originalVolume = document.getElementById('originalVolume');
//     const volumeValue = document.getElementById('volumeValue');
//     const muteOriginal = document.getElementById('muteOriginal');
//     const showSubtitles = document.getElementById('showSubtitles');
    
//     if (settings.targetLanguage && languageSelect.value !== settings.targetLanguage) {
//         languageSelect.value = settings.targetLanguage;
//     }
    
//     if (settings.voiceGender && voiceGender && voiceGender.value !== settings.voiceGender) {
//         voiceGender.value = settings.voiceGender;
//     }
    
//     if (settings.enableVoice !== undefined && enableVoice && enableVoice.checked !== settings.enableVoice) {
//         enableVoice.checked = settings.enableVoice;
//     }
    
//     if (settings.originalVolume !== undefined) {
//         const volumePercent = Math.round(settings.originalVolume * 100);
        
//         if (Math.abs(parseInt(originalVolume.value) - volumePercent) > 1) {
//             originalVolume.value = volumePercent;
//             volumeValue.textContent = volumePercent + '%';
//         }
        
//         if (settings.muteOriginal !== undefined) {
//             muteOriginal.checked = settings.muteOriginal;
            
//             if (settings.muteOriginal && volumePercent > 0) {
//                 originalVolume.value = 0;
//                 volumeValue.textContent = '0%';
//             }
//         }
//     }
    
//     if (settings.showSubtitles !== undefined) {
//         showSubtitles.checked = settings.showSubtitles;
//     }
// }

// // ==================== ОБНОВЛЕНИЕ МИНУТ ====================
// async function updateMinutesDisplay() {
//     const minutesDisplay = document.getElementById('minutesDisplay');
//     const accountEmail = document.getElementById('accountEmail');
    
//     try {
//         const result = await chrome.storage.local.get(['account']);
        
//         if (result.account) {
//             accountEmail.textContent = result.account.email || 'Not signed in';
//             minutesDisplay.textContent = result.account.minutes || '∞';
//         } else {
//             accountEmail.textContent = 'Not signed in';
//             minutesDisplay.textContent = '∞';
//         }
        
//     } catch (error) {
//         console.error('❌ Failed to update account display:', error);
//         minutesDisplay.textContent = '--';
//         accountEmail.textContent = 'Error loading';
//     }
// }

// // ==================== ПРОВЕРКА API ====================
// async function checkAPIAvailability() {
//     try {
//         if (!chrome.runtime?.id) {
//             throw new Error('Extension not loaded');
//         }
        
//         const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//         if (!tabs[0]) {
//             console.warn('⚠️ No active tab found');
//         }
        
//         console.log('✅ Chrome APIs available');
//         return true;
        
//     } catch (error) {
//         console.error('❌ Chrome APIs not available:', error);
        
//         const statusText = document.getElementById('statusText');
//         const startBtn = document.getElementById('startBtn');
        
//         statusText.textContent = 'Extension error - reload page';
//         startBtn.disabled = true;
        
//         return false;
//     }
// }

// checkAPIAvailability();

// console.log('✅ Popup ready with voice selection');

// popup.js - ПОЛНЫЙ РАБОЧИЙ КОД С ВЫБОРОМ ГОЛОСА И СТИЛЯ ПЕРЕВОДА
console.log('🔴 POPUP LOADED - ENHANCED WITH VOICE SELECTION');

let currentSettings = null;
let isCapturing = false;
let isUserInteracting = false;
let volumeSliderInteraction = false;

document.addEventListener('DOMContentLoaded', async () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const languageSelect = document.getElementById('languageSelect');
    const voiceGender = document.getElementById('voiceGender');
    const translationStyle = document.getElementById('translationStyle'); // НОВОЕ!
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
    
    function toggleCollapse() {
        const main = document.getElementById('mainContent');
        const collapsed = document.getElementById('collapsedContent');
        
        if (main.style.display !== 'none') {
            main.style.display = 'none';
            collapsed.style.display = 'block';
        } else {
            main.style.display = 'block';
            collapsed.style.display = 'none';
        }
    }
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    console.log('🔧 Initializing popup...');
    
    await loadSavedSettings();
    
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
            originalVolume.value = originalVolume.value === '0' ? '50' : originalVolume.value;
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
    languageSelect.addEventListener('change', () => {
        console.log('🌐 Language changed to:', languageSelect.value);
        saveSettings();
        sendLanguageUpdateIfActive();
    });
    
    if (voiceGender) {
        voiceGender.addEventListener('change', () => {
            console.log('👤 Voice gender changed to:', voiceGender.value);
            saveSettings();
            sendVoiceUpdateIfActive();
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
        alert('Buy minutes functionality coming soon!');
    });
    
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        const settingsPanel = document.getElementById('settingsPanel');
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    // ==================== ПРОВЕРКА СТАТУСА ====================
    await updateStatus();
    
    const statusInterval = setInterval(updateStatus, 2000);
    
    window.addEventListener('unload', () => {
        clearInterval(statusInterval);
    });
    
    console.log('✅ Popup UI initialized');
});

// ==================== ЗАГРУЗКА СОХРАНЕННЫХ НАСТРОЕК ====================
async function loadSavedSettings() {
    try {
        const result = await chrome.storage.local.get([
            'language', 'volume', 'mute', 'subtitles', 'account', 'voiceGender', 'enableVoice', 'translationStyle'
        ]);
        
        console.log('📂 Loaded saved settings:', result);
        
        const languageSelect = document.getElementById('languageSelect');
        const voiceGender = document.getElementById('voiceGender');
        const translationStyle = document.getElementById('translationStyle');
        const enableVoice = document.getElementById('enableVoice');
        const originalVolume = document.getElementById('originalVolume');
        const volumeValue = document.getElementById('volumeValue');
        const muteOriginal = document.getElementById('muteOriginal');
        const showSubtitles = document.getElementById('showSubtitles');
        const accountEmail = document.getElementById('accountEmail');
        const minutesDisplay = document.getElementById('minutesDisplay');
        
        if (result.language && languageSelect.querySelector(`option[value="${result.language}"]`)) {
            languageSelect.value = result.language;
        }
        
        if (result.voiceGender && voiceGender) {
            voiceGender.value = result.voiceGender;
        }
        
        // ЗАГРУЖАЕМ СТИЛЬ ПЕРЕВОДА
        if (result.translationStyle && translationStyle) {
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
    const languageSelect = document.getElementById('languageSelect');
    const voiceGender = document.getElementById('voiceGender');
    const translationStyle = document.getElementById('translationStyle');
    const enableVoice = document.getElementById('enableVoice');
    const originalVolume = document.getElementById('originalVolume');
    const muteOriginal = document.getElementById('muteOriginal');
    const showSubtitles = document.getElementById('showSubtitles');
    
    const settings = {
        language: languageSelect.value,
        voiceGender: voiceGender ? voiceGender.value : 'neutral',
        translationStyle: translationStyle ? translationStyle.value : 'default',
        enableVoice: enableVoice ? enableVoice.checked : true,
        volume: originalVolume.value,
        mute: muteOriginal.checked,
        subtitles: showSubtitles.checked,
        lastUpdated: Date.now()
    };
    
    chrome.storage.local.set(settings).catch(error => {
        console.error('❌ Failed to save settings:', error);
    });
}

// ==================== ПОЛУЧЕНИЕ НАСТРОЕК ====================
function getSettings() {
    const languageSelect = document.getElementById('languageSelect');
    const voiceGender = document.getElementById('voiceGender');
    const translationStyle = document.getElementById('translationStyle');
    const enableVoice = document.getElementById('enableVoice');
    const originalVolume = document.getElementById('originalVolume');
    const muteOriginal = document.getElementById('muteOriginal');
    const showSubtitles = document.getElementById('showSubtitles');
    
    return {
        targetLanguage: languageSelect.value,
        translateEnabled: languageSelect.value !== 'original',
        voiceGender: voiceGender ? voiceGender.value : 'neutral',
        translationStyle: translationStyle ? translationStyle.value : 'default',
        enableVoice: enableVoice ? enableVoice.checked : true,
        showSubtitles: showSubtitles.checked,
        muteOriginal: muteOriginal.checked,
        originalVolume: parseInt(originalVolume.value) / 100
    };
}

// ==================== ОТПРАВКА ОБНОВЛЕНИЙ ====================
async function sendVolumeUpdateIfActive() {
    if (!isCapturing) return;
    
    const originalVolume = document.getElementById('originalVolume');
    const muteOriginal = document.getElementById('muteOriginal');
    
    const volumeSettings = {
        muteOriginal: muteOriginal.checked,
        originalVolume: parseInt(originalVolume.value) / 100
    };
    
    console.log('🔊 Sending volume update:', volumeSettings);
    
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'UPDATE_VOLUME_FROM_POPUP',
            settings: volumeSettings
        });
        
        if (response?.success) {
            console.log('✅ Volume update sent successfully');
            
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    type: 'UPDATE_VOLUME',
                    settings: volumeSettings
                }).catch(error => {
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
        enableVoice: enableVoice ? enableVoice.checked : true
    };
    
    console.log('🎤 Sending voice update:', voiceSettings);
    
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'UPDATE_VOICE_FROM_POPUP',
            settings: voiceSettings
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
    
    const settings = {
        showSubtitles: showSubtitles.checked,
        enableVoice: enableVoice ? enableVoice.checked : true,
        translationStyle: translationStyle ? translationStyle.value : 'default'
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
            settings: settings
        });
        
        // 2. Отправляем прямо в offscreen
        chrome.runtime.sendMessage({
            type: 'UPDATE_SETTINGS',
            settings: settings
        }).catch(() => {});
        
        // 3. Отправляем прямо в content script для немедленного скрытия
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'UPDATE_SETTINGS',
                    settings: settings
                }).catch(() => {});
            }
        });
        
        console.log('📨 Settings sent to all:', settings.showSubtitles);
    } catch (error) {
        console.log('⚠️ Settings send error:', error.message);
    }
}

async function sendLanguageUpdateIfActive() {
    if (!isCapturing) return;
    
    const languageSelect = document.getElementById('languageSelect');
    const voiceGender = document.getElementById('voiceGender');
    const translationStyle = document.getElementById('translationStyle');
    const enableVoice = document.getElementById('enableVoice');
    const showSubtitles = document.getElementById('showSubtitles');
    const muteOriginal = document.getElementById('muteOriginal');
    const originalVolume = document.getElementById('originalVolume');
    
    console.log('🌐 Language changed to:', languageSelect.value);
    
    const newSettings = {
        targetLanguage: languageSelect.value,
        translateEnabled: languageSelect.value !== 'original',
        voiceGender: voiceGender ? voiceGender.value : 'neutral',
        translationStyle: translationStyle ? translationStyle.value : 'default',
        enableVoice: enableVoice ? enableVoice.checked : true,
        showSubtitles: showSubtitles.checked,
        muteOriginal: muteOriginal.checked,
        originalVolume: parseInt(originalVolume.value) / 100
    };
    
    const statusText = document.getElementById('statusText');
    const oldText = statusText.textContent;
    statusText.textContent = 'Language changed - updating...';
    
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'UPDATE_LANGUAGE_FROM_POPUP',
            settings: newSettings
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
    const languageSelect = document.getElementById('languageSelect');
    const voiceGender = document.getElementById('voiceGender');
    const translationStyle = document.getElementById('translationStyle');
    const enableVoice = document.getElementById('enableVoice');
    const originalVolume = document.getElementById('originalVolume');
    const muteOriginal = document.getElementById('muteOriginal');
    const showSubtitles = document.getElementById('showSubtitles');
    
    console.log('🚀 Starting translation...');
    
    if (parseInt(originalVolume.value) < 0 || parseInt(originalVolume.value) > 100) {
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
            alert('Cannot translate Chrome internal pages. Please open a website with audio/video content.');
            startBtn.disabled = false;
            return;
        }
        
        statusText.textContent = 'Requesting permissions...';
        
        currentSettings = {
            targetLanguage: languageSelect.value,
            translateEnabled: languageSelect.value !== 'original',
            voiceGender: voiceGender ? voiceGender.value : 'neutral',
            translationStyle: translationStyle ? translationStyle.value : 'default',
            enableVoice: enableVoice ? enableVoice.checked : true,
            showSubtitles: showSubtitles.checked,
            muteOriginal: muteOriginal.checked,
            originalVolume: parseInt(originalVolume.value) / 100
        };
        
        console.log('⚙️ Starting with settings:', currentSettings);
        
        saveSettings();
        
        const response = await chrome.runtime.sendMessage({
            type: 'START_TAB_CAPTURE',
            settings: currentSettings
        });
        
        console.log('📡 Start response:', response);
        
        if (response?.success) {
            isCapturing = true;
            statusText.textContent = languageSelect.value === 'original' ? 'Transcribing...' : 'Translating...';
            statusIndicator.classList.add('active');
            stopBtn.disabled = false;
            
            updateMinutesDisplay();
            
            console.log('✅ Translation started successfully');
            
        } else {
            const errorMessage = response?.error || 'Unknown error';
            alert(`Failed to start: ${errorMessage}`);
            startBtn.disabled = false;
            statusText.textContent = 'Ready to translate';
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
            type: 'STOP_TAB_CAPTURE' 
        });
        
        console.log('📡 Stop response:', response);
        
        if (response?.success) {
            isCapturing = false;
            currentSettings = null;
            isUserInteracting = false;
            volumeSliderInteraction = false;
            
            statusText.textContent = 'Ready to translate';
            statusIndicator.classList.remove('active');
            startBtn.disabled = false;
            
            updateMinutesDisplay();
            
            console.log(`✅ Stopped successfully. Duration: ${response.duration || 0}s`);
            
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
    
    try {
        const response = await chrome.runtime.sendMessage({ 
            type: 'GET_STATUS' 
        });
        
        if (response?.isCapturing) {
            isCapturing = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusIndicator.classList.add('active');
            
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
    
    const languageSelect = document.getElementById('languageSelect');
    const voiceGender = document.getElementById('voiceGender');
    const translationStyle = document.getElementById('translationStyle');
    const enableVoice = document.getElementById('enableVoice');
    const originalVolume = document.getElementById('originalVolume');
    const volumeValue = document.getElementById('volumeValue');
    const muteOriginal = document.getElementById('muteOriginal');
    const showSubtitles = document.getElementById('showSubtitles');
    
    if (settings.targetLanguage && languageSelect.value !== settings.targetLanguage) {
        languageSelect.value = settings.targetLanguage;
    }
    
    if (settings.voiceGender && voiceGender && voiceGender.value !== settings.voiceGender) {
        voiceGender.value = settings.voiceGender;
    }
    
    // ОБНОВЛЯЕМ СТИЛЬ ПЕРЕВОДА
    if (settings.translationStyle && translationStyle && translationStyle.value !== settings.translationStyle) {
        translationStyle.value = settings.translationStyle;
    }
    
    if (settings.enableVoice !== undefined && enableVoice && enableVoice.checked !== settings.enableVoice) {
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
        const result = await chrome.storage.local.get(['account']);
        
        if (result.account) {
            accountEmail.textContent = result.account.email || 'Not signed in';
            minutesDisplay.textContent = result.account.minutes || '∞';
        } else {
            accountEmail.textContent = 'Not signed in';
            minutesDisplay.textContent = '∞';
        }
        
    } catch (error) {
        console.error('❌ Failed to update account display:', error);
        minutesDisplay.textContent = '--';
        accountEmail.textContent = 'Error loading';
    }
}

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

console.log('✅ Popup ready with voice selection and translation styles');