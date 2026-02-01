console.log('🎯 Subtitles script - FULLSCREEN FIXED');

let isTranslating = false;
let subtitlesContainer = null;
let currentSettings = null;

const isInIframe = window !== window.top;

// ==================== ОТКРЫТИЕ МЕНЮ (FLOATING UI) ====================
function injectFloatingUI() {
  if (document.getElementById('translateme-frame')) return;

  const frame = document.createElement('iframe');
  frame.id = 'translateme-frame';
  frame.src = chrome.runtime.getURL('popup.html');
  
  frame.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: 340px !important;
    height: 600px !important;
    border: none !important;
    z-index: 2147483647 !important;
    box-shadow: 0 12px 48px rgba(0,0,0,0.5) !important;
    border-radius: 12px !important;
    background: transparent !important;
  `;

  // Сразу проверяем, не в полноэкранном ли мы режиме
  const fsEl = getFullscreenElement();
  if (fsEl) {
    fsEl.appendChild(frame);
    frame.style.position = 'absolute';
  } else {
    document.body.appendChild(frame);
  }
}

// ==================== FULLSCREEN LOGIC ====================
function getFullscreenElement() {
  return document.fullscreenElement || 
         document.webkitFullscreenElement || 
         document.mozFullScreenElement ||
         document.msFullscreenElement;
}

function handleFullscreenChange() {
  const fsEl = getFullscreenElement();
  const frame = document.getElementById('translateme-frame');
  const target = fsEl || document.body;
  const pos = fsEl ? 'absolute' : 'fixed';

  // Перекидываем меню
  if (frame) {
    target.appendChild(frame);
    frame.style.position = pos;
  }

  // Перекидываем субтитры
  if (subtitlesContainer) {
    target.appendChild(subtitlesContainer);
    subtitlesContainer.style.position = pos;
    subtitlesContainer.style.zIndex = "2147483647";
    
    // Если перевод идет — принудительно показываем
    if (isTranslating && currentSettings?.showSubtitles !== false) {
      subtitlesContainer.style.display = 'block';
    }
  }
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

// // ==================== MESSAGES ====================
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'OPEN_UI') {
//     injectFloatingUI();
//     sendResponse({ success: true });
//     return true;
//   }

//   if (request.type === 'SHOW_SUBTITLES') {
//     isTranslating = true;
//     if (request.settings) currentSettings = request.settings;
    
//     if (currentSettings?.showSubtitles !== false && request.text) {
//       updateSubtitlesPermanent(request.text);
//     } else {
//       hideSubtitles();
//     }
//     sendResponse({ success: true });
//   } else if (request.type === 'STOP_SUBTITLES') {
//     isTranslating = false;
//     hardRemoveSubtitles();
//     sendResponse({ success: true });
//   } else if (request.type === 'UPDATE_SETTINGS') {
//     if (request.settings) {
//       currentSettings = { ...currentSettings, ...request.settings };
//       if (currentSettings?.showSubtitles === false) hideSubtitles();
//     }
//     sendResponse({ success: true });
//   }
//   return true;
// });

// ==================== MESSAGES ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // --- ДОБАВЛЕНО ДЛЯ СВОРАЧИВАНИЯ ---
  if (request.type === 'RESIZE_FRAME') {
    const frame = document.getElementById('translateme-frame');
    if (frame) {
      if (request.minimized) {
        // Когда свернуто: делаем узкую полоску
        frame.style.width = '250px'; 
        frame.style.height = '50px'; 
      } else {
        // Когда развернуто: возвращаем как было
        frame.style.width = '340px';
        frame.style.height = '600px';
      }
    }
    sendResponse({ success: true });
    return true;
  }
  // ----------------------------------

  if (request.action === 'OPEN_UI') {
    injectFloatingUI();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'SHOW_SUBTITLES') {
    isTranslating = true;
    if (request.settings) currentSettings = request.settings;
    
    if (currentSettings?.showSubtitles !== false && request.text) {
      updateSubtitlesPermanent(request.text);
    } else {
      hideSubtitles();
    }
    sendResponse({ success: true });
  } else if (request.type === 'STOP_SUBTITLES') {
    isTranslating = false;
    hardRemoveSubtitles();
    sendResponse({ success: true });
  } else if (request.type === 'UPDATE_SETTINGS') {
    if (request.settings) {
      currentSettings = { ...currentSettings, ...request.settings };
      if (currentSettings?.showSubtitles === false) hideSubtitles();
    }
    sendResponse({ success: true });
  }
  return true;
});

// ==================== SUBTITLES CORE ====================
function updateSubtitlesPermanent(text) {
  if (!text || text.trim() === '') return;
  if (currentSettings?.showSubtitles === false) return;

  const fsEl = getFullscreenElement();
  const correctParent = fsEl || document.body;
  
  // Если контейнера нет или он в старом родителе (вышли/зашли в FS) — создаем заново
  if (!subtitlesContainer || subtitlesContainer.parentElement !== correctParent) {
    createSubtitlesContainer();
  }

  if (subtitlesContainer) {
    subtitlesContainer.style.display = 'block';
    subtitlesContainer.textContent = text.trim();
  }
}

function createSubtitlesContainer() {
  const existing = document.getElementById('audio-translator-subtitles-stable');
  if (existing) existing.remove();
  
  subtitlesContainer = document.createElement('div');
  subtitlesContainer.id = 'audio-translator-subtitles-stable';
  
  const fsEl = getFullscreenElement();
  
  subtitlesContainer.style.cssText = `
    position: ${fsEl ? 'absolute' : 'fixed'};
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 14px 28px;
    border-radius: 8px;
    max-width: 85%;
    z-index: 2147483647;
    text-align: center;
    pointer-events: none;
    font-family: Arial, sans-serif;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.4;
    display: block;
  `;
  
  const target = fsEl || document.body;
  target.appendChild(subtitlesContainer);
}

function hideSubtitles() {
  if (subtitlesContainer) {
    subtitlesContainer.style.display = 'none';
    subtitlesContainer.textContent = '';
  }
}

function hardRemoveSubtitles() {
  if (subtitlesContainer) {
    subtitlesContainer.remove();
    subtitlesContainer = null;
  }
}

window.addEventListener('beforeunload', () => {
  if (isTranslating) hardRemoveSubtitles();
});