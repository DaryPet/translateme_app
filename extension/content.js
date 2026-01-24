
// console.log('🎯 Subtitles script - NO ANIMATION VERSION');

// let isTranslating = false;
// let subtitlesContainer = null; // переименовано для единообразия
// let subtitleBuffer = [];
// let isPlayingBuffer = false;
// let hideTimer = null;

// // ==================== ОБРАБОТЧИК СООБЩЕНИЙ ====================
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log('📩 Content received:', request.type);
  
//   switch (request.type) {
//     case 'SHOW_SUBTITLES':
//       addToBuffer(request.text);
//       isTranslating = true;
      
//       // ПРОСТО ОТПРАВЛЯЕМ ГРОМКОСТЬ
//       if (request.settings) {
//         chrome.runtime.sendMessage({
//           type: 'UPDATE_VOLUME',
//           settings: request.settings
//         });
//       }
      
//       sendResponse({ success: true });
//       return true;
      
//     case 'STOP_SUBTITLES':
//       clearBuffer();
//       removeSubtitles();
//       isTranslating = false;
//       sendResponse({ success: true });
//       return true;
      
//     case 'GET_TRANSLATION_STATUS':
//       sendResponse({ isTranslating });
//       return true;
      
//     default:
//       return false;
//   }
// });

// // ==================== БУФЕР И ПОКАЗ ====================
// function addToBuffer(text) {
//   if (!text || text.trim() === '') return;
  
//   const cleanText = text.trim();
  
//   subtitleBuffer.push({
//     text: cleanText,
//     displayTime: calculateDisplayTime(cleanText)
//   });
  
//   if (subtitleBuffer.length > 3) {
//     subtitleBuffer.shift();
//   }
  
//   if (!isPlayingBuffer) {
//     processBuffer();
//   }
  
//   resetHideTimer();
// }

// function calculateDisplayTime(text) {
//   const words = text.split(/\s+/).length;
//   return Math.max(1500, Math.min(4000, words * 200));
// }

// async function processBuffer() {
//   isPlayingBuffer = true;
  
//   while (subtitleBuffer.length > 0) {
//     const item = subtitleBuffer.shift();
    
//     showSubtitlesNow(item.text);
//     const actualWaitTime = subtitleBuffer.length > 0 ? 1200 : item.displayTime;
    
//     await wait(actualWaitTime);
    
//     // await wait(item.displayTime);
    
//     // if (subtitleBuffer.length > 0) {
//     //   await wait(300);
//     // }
//   }
  
//   isPlayingBuffer = false;
// }

// function wait(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// function clearBuffer() {
//   subtitleBuffer = [];
//   isPlayingBuffer = false;
// }

// // ==================== ПОКАЗ СУБТИТРОВ ====================
// function showSubtitlesNow(text) {
//   if (!subtitlesContainer) {
//     createSubtitlesContainer();
//   }
  
//   subtitlesContainer.innerHTML = '';
//   const textElement = document.createElement('div');
//   textElement.textContent = text;
//   textElement.style.cssText = `
//     min-height: 24px;
//     font-size: 19px;
//     font-weight: 500;
//     line-height: 1.4;
//     text-align: center;
//   `;
  
//   subtitlesContainer.appendChild(textElement);
//   // УБРАНА АНИМАЦИЯ opacity
//   subtitlesContainer.style.display = 'block';
// }

// function createSubtitlesContainer() {
//   subtitlesContainer = document.createElement('div');
//   subtitlesContainer.id = 'translateme-subtitles';
//   subtitlesContainer.style.cssText = `
//     position: fixed;
//     bottom: 100px;
//     left: 50%;
//     transform: translateX(-50%);
//     background: rgba(0, 0, 0, 0.9);
//     color: white;
//     padding: 16px 28px;
//     border-radius: 12px;
//     max-width: 80%;
//     z-index: 1000000;
//     backdrop-filter: blur(10px);
//     border: 1px solid rgba(255, 255, 255, 0.3);
//     box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
//     /* УБРАНА АНИМАЦИЯ */
//     /* transition: opacity 0.3s ease; */
//     /* opacity: 0; */
//     display: none; /* Вместо opacity: 0 */
//     pointer-events: none;
//     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//     word-wrap: break-word;
//   `;
  
//   document.body.appendChild(subtitlesContainer);
// }

// function resetHideTimer() {
//   if (hideTimer) clearTimeout(hideTimer);
  
//   hideTimer = setTimeout(() => {
//     if (subtitlesContainer && subtitleBuffer.length === 0) {
//       // УБРАНА АНИМАЦИЯ
//       subtitlesContainer.style.display = 'none';
//       // УБРАН setTimeout для анимации
//     }
//   }, 2000);
// }

// function removeSubtitles() {
//   if (subtitlesContainer) {
//     subtitlesContainer.style.display = 'none'; // ИСПРАВЛЕНО: subtitlesContainer вместо container
//     setTimeout(() => { // Оставляем задержку перед удалением
//       if (subtitlesContainer) {
//         subtitlesContainer.remove();
//         subtitlesContainer = null;
//       }
//     }, 50);
//   }
  
//   if (hideTimer) {
//     clearTimeout(hideTimer);
//     hideTimer = null;
//   }
  
//   clearBuffer();
//   isTranslating = false;
// }

// // ==================== ОЧИСТКА ====================
// window.addEventListener('beforeunload', () => {
//   if (isTranslating) {
//     clearBuffer();
//     removeSubtitles();
//   }
// });

// console.log('🚀 Content script ready');

// console.log('🎯 Subtitles script - NO FLASHING - PERMANENT TEXT');

// let isTranslating = false;
// let subtitlesContainer = null;

// // ==================== ОБРАБОТЧИК СООБЩЕНИЙ ====================
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === 'SHOW_SUBTITLES') {
//     isTranslating = true;
//     updateSubtitlesPermanent(request.text);
    
//     // Пересылка настроек громкости
//     if (request.settings) {
//       chrome.runtime.sendMessage({
//         type: 'UPDATE_VOLUME',
//         settings: request.settings
//       });
//     }
//     sendResponse({ success: true });
//   } else if (request.type === 'STOP_SUBTITLES') {
//     isTranslating = false;
//     hardRemoveSubtitles();
//     sendResponse({ success: true });
//   }
//   return true;
// });

// // ==================== ЛОГИКА "БЕЗ МИГАНИЯ" ====================
// function updateSubtitlesPermanent(text) {
//   if (!text || text.trim() === '') return;

//   if (!subtitlesContainer) {
//     createSubtitlesContainer();
//   }

//   // 1. Принудительно держим блок включенным
//   subtitlesContainer.style.display = 'block';
  
//   // 2. Просто меняем текст. Старый текст мгновенно заменяется новым.
//   // НИКАКИХ setTimeout, НИКАКИХ скрытий.
//   subtitlesContainer.textContent = text.trim();
// }

// function createSubtitlesContainer() {
//   // Если вдруг контейнер уже есть в DOM — используем его
//   subtitlesContainer = document.getElementById('audio-translator-subtitles-stable');
  
//   if (!subtitlesContainer) {
//     subtitlesContainer = document.createElement('div');
//     subtitlesContainer.id = 'audio-translator-subtitles-stable';
//     subtitlesContainer.style.cssText = `
//       position: fixed;
//       bottom: 100px;
//       left: 50%;
//       transform: translateX(-50%);
//       background: rgba(0, 0, 0, 0.85);
//       color: white;
//       padding: 16px 28px;
//       border-radius: 12px;
//       max-width: 85%;
//       z-index: 2147483647;
//       text-align: center;
//       pointer-events: none;
//       font-family: Arial, sans-serif;
//       font-size: 22px;
//       font-weight: 500;
//       line-height: 1.4;
//       /* ПОЛНЫЙ ЗАПРЕТ АНИМАЦИЙ */
//       transition: none !important;
//       animation: none !important;
//       display: block;
//     `;
//     document.body.appendChild(subtitlesContainer);
//   }
// }

// // Только эта функция может убрать субтитры с экрана
// function hardRemoveSubtitles() {
//   if (subtitlesContainer) {
//     subtitlesContainer.style.display = 'none';
//     subtitlesContainer.remove();
//     subtitlesContainer = null;
//   }
// }

// // Очистка при закрытии вкладки
// window.addEventListener('beforeunload', () => {
//   if (isTranslating) {
//     hardRemoveSubtitles();
//   }
// });

// console.log('🚀 Content script ready - NO-GAPS-MODE');

console.log('🎯 Subtitles script - WITH TOGGLE SUPPORT');

let isTranslating = false;
let subtitlesContainer = null;
let currentSettings = null;

// ==================== ОБРАБОТЧИК СООБЩЕНИЙ ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎯 Content script received:', request.type);
  
  if (request.type === 'SHOW_SUBTITLES') {
    isTranslating = true;
    
    // Сохраняем настройки
    if (request.settings) {
      currentSettings = request.settings;
    }
    
    // Проверяем, нужно ли показывать субтитры
    if (currentSettings?.showSubtitles !== false && request.text) {
      updateSubtitlesPermanent(request.text);
    } else {
      // Если субтитры выключены - скрываем их
      hideSubtitles();
    }
    
    sendResponse({ success: true });
    
  } else if (request.type === 'STOP_SUBTITLES') {
    isTranslating = false;
    hardRemoveSubtitles();
    sendResponse({ success: true });
    
  } else if (request.type === 'UPDATE_SETTINGS') {
    // ОБРАБОТКА ПЕРЕКЛЮЧЕНИЯ СУБТИТРОВ
    if (request.settings) {
      currentSettings = { ...currentSettings, ...request.settings };
      console.log('🎯 Settings updated:', currentSettings.showSubtitles);
      
      // Если субтитры выключены - СРАЗУ скрываем
      if (currentSettings?.showSubtitles === false) {
        hideSubtitles();
      }
    }
    sendResponse({ success: true });
  }
  return true;
});

// ==================== ЛОГИКА "БЕЗ МИГАНИЯ" ====================
function updateSubtitlesPermanent(text) {
  if (!text || text.trim() === '') return;
  
  // Проверяем, что субтитры включены
  if (currentSettings?.showSubtitles === false) {
    console.log('🎯 Subtitles disabled, not showing');
    hideSubtitles();
    return;
  }

  if (!subtitlesContainer) {
    createSubtitlesContainer();
  }

  // Показываем субтитры
  subtitlesContainer.style.display = 'block';
  subtitlesContainer.textContent = text.trim();
  console.log('🎯 Showing subtitles:', text.substring(0, 50) + '...');
}

function createSubtitlesContainer() {
  subtitlesContainer = document.getElementById('audio-translator-subtitles-stable');
  
  if (!subtitlesContainer) {
    subtitlesContainer = document.createElement('div');
    subtitlesContainer.id = 'audio-translator-subtitles-stable';
    subtitlesContainer.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 16px 28px;
      border-radius: 12px;
      max-width: 85%;
      z-index: 2147483647;
      text-align: center;
      pointer-events: none;
      font-family: Arial, sans-serif;
      font-size: 22px;
      font-weight: 500;
      line-height: 1.4;
      transition: none !important;
      animation: none !important;
      display: none; /* По умолчанию скрыт */
    `;
    document.body.appendChild(subtitlesContainer);
  }
}

// Функция скрытия субтитров
function hideSubtitles() {
  console.log('🎯 Hiding subtitles');
  if (subtitlesContainer) {
    subtitlesContainer.style.display = 'none';
    // Очищаем текст чтобы не висели старые слова
    subtitlesContainer.textContent = '';
  }
}

// Только эта функция может убрать субтитры с экрана
function hardRemoveSubtitles() {
  console.log('🎯 Removing subtitles');
  if (subtitlesContainer) {
    subtitlesContainer.style.display = 'none';
    subtitlesContainer.remove();
    subtitlesContainer = null;
  }
}

// Очистка при закрытии вкладки
window.addEventListener('beforeunload', () => {
  if (isTranslating) {
    hardRemoveSubtitles();
  }
});

console.log('🚀 Content script ready - WITH TOGGLE SUPPORT');