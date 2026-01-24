// // offscreen.js - ГОЛОС + СУБТИТРЫ
// console.log('📄 Offscreen document loaded');

// let mediaRecorder = null;
// let audioStream = null;
// let audioContext = null;
// let playbackAudioContext = null;
// let analyser = null;
// let dataArray = null;
// let gainNode = null;
// let activeSettings = null;
// let isRecording = false;
// let currentTabId = null;
// let silenceTimer = null;

// let speechQueue = [];
// let isPlaying = false;

// let conversationContext = {
//   history: [],
//   lastOriginalText: '',
//   maxHistory: 8,
// };

// const VOICE_CONFIG = {
//   male: { openai_voice: 'onyx' },
//   female: { openai_voice: 'shimmer' },
//   neutral: { openai_voice: 'nova' },
//   auto: { openai_voice: 'alloy' },
// };

// // ОРИГИНАЛЬНЫЙ РАБОЧИЙ КОД
// const OPENAI_API_KEY = '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';

// // НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ GEMINI
// const GEMINI_API_KEY = 'AIzaSyAQjnhKlojhPPkFfaNDiXl7nLmGdrq3dPg';
// const GEMINI_MODEL = 'gemini-2.0-flash-exp';

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   switch (request.type) {
//     case 'START_CAPTURE':
//       startCapture(request.streamId, request.settings, request.tabId).then(sendResponse);
//       return true;
//     case 'STOP_CAPTURE':
//       stopCapture();
//       sendResponse({ success: true });
//       return true;
//     case 'UPDATE_VOLUME':
//       updateVolume(request.settings);
//       sendResponse({ success: true });
//       return true;
//     case 'UPDATE_VOICE':
//       if (request.settings) {
//         activeSettings = { ...activeSettings, ...request.settings };
//         console.log('Voice settings updated:', activeSettings.voiceGender);
//       }
//       sendResponse({ success: true });
//       return true;
//     case 'PING':
//       sendResponse({ success: true, isRecording });
//       return true;
//     case 'UPDATE_SETTINGS':
//       if (request.settings) {
//         activeSettings = { ...activeSettings, ...request.settings };
//       }
//       sendResponse({ success: true });
//       return true;
//     default:
//       return false;
//   }
// });

// async function startCapture(streamId, settings, tabId) {
//   try {
//     stopInternal();
//     isRecording = true;
//     activeSettings = { ...settings };
//     currentTabId = tabId;

//     conversationContext.history = [];
//     conversationContext.lastOriginalText = '';
//     speechQueue = [];
//     isPlaying = false;

//     audioStream = await navigator.mediaDevices.getUserMedia({
//       audio: {
//         mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId },
//       },
//       video: false,
//     });

//     audioContext = new AudioContext();
//     const source = audioContext.createMediaStreamSource(audioStream);

//     analyser = audioContext.createAnalyser();
//     analyser.fftSize = 256;
//     source.connect(analyser);
//     dataArray = new Uint8Array(analyser.frequencyBinCount);

//     gainNode = audioContext.createGain();
//     source.connect(gainNode);
//     gainNode.connect(audioContext.destination);

//     applyVolumeSettings(activeSettings);
//     startRecording();

//     return { success: true };
//   } catch (error) {
//     isRecording = false;
//     return { success: false, error: error.message };
//   }
// }

// function startRecording() {
//   if (!isRecording || !audioStream || !audioStream.active) return;

//   try {
//     mediaRecorder = new MediaRecorder(audioStream, {
//       mimeType: 'audio/webm;codecs=opus',
//     });
//     let audioChunks = [];

//     mediaRecorder.ondataavailable = (e) => {
//       if (e.data.size > 0) audioChunks.push(e.data);
//     };

//     mediaRecorder.onstop = async () => {
//       if (audioChunks.length > 0 && isRecording) {
//         const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
//         processAudioWithContext(audioBlob);
//       }
//       if (isRecording) startRecording();
//     };

//     mediaRecorder.start();

//     const checkSilence = () => {
//       if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
//       analyser.getByteFrequencyData(dataArray);
//       let average = dataArray.reduce((a, b) => a + b) / dataArray.length;

//       if (average < 10) {
//         if (!silenceTimer) {
//           silenceTimer = setTimeout(() => {
//             if (mediaRecorder && mediaRecorder.state === 'recording') {
//               mediaRecorder.stop();
//             }
//           }, 1500);
//         }
//       } else {
//         clearTimeout(silenceTimer);
//         silenceTimer = null;
//       }
//     };

//     const vadInterval = setInterval(checkSilence, 100);
//     setTimeout(() => {
//       clearInterval(vadInterval);
//       if (mediaRecorder && mediaRecorder.state === 'recording') {
//         mediaRecorder.stop();
//       }
//     }, 4000);
//   } catch (err) {
//     console.error('MediaRecorder error:', err);
//     isRecording = false;
//   }
// }

// async function processAudioWithContext(audioBlob) {
//   if (!isRecording) return;

//   try {
//     const originalText = await transcribeWithWhisper(audioBlob);

//     if (!originalText || originalText.trim() === '') return;

//     if (originalText === conversationContext.lastOriginalText) {
//       return;
//     }

//     conversationContext.lastOriginalText = originalText;
//     const cleanText = originalText.trim();
//     let finalText = cleanText;

//     if (activeSettings?.targetLanguage && activeSettings.targetLanguage !== 'original') {
//       finalText = await translateWithContext(cleanText, activeSettings.targetLanguage);
//     }

//     if (isRecording && finalText) {
//       if (activeSettings?.showSubtitles !== false) {
//         chrome.runtime.sendMessage({
//           type: 'SUBTITLES_FROM_OFFSCREEN',
//           text: finalText,
//           tabId: currentTabId,
//           settings: activeSettings
//         }).catch(() => { });
//       }

//       if (activeSettings?.enableVoice) {
//         generateAndPlayVoice(finalText);
//       }
//     }
//   } catch (e) {
//     console.error('Process error:', e);
//   }
// }

// async function transcribeWithWhisper(blob) {
//   const formData = new FormData();
//   formData.append('file', blob, 'audio.webm');
//   formData.append('model', 'whisper-1');

//   try {
//     const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//       body: formData,
//     });

//     const data = await response.json();
//     return data.text || '';
//   } catch (error) {
//     console.error('Whisper failed:', error);
//     return '';
//   }
// }

// async function translateWithContext(text, targetLang) {
//   try {
//     const requestBody = {
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           // content: `Translate to ${targetLang}. Output ONLY translation.`,
//           // СТАЛО (вариант 1 - для озвучки):
//           content: `Translate to ${targetLang} for voiceover. Output only the ${targetLang} text. Natural speech.`,

//           // ИЛИ вариант 2 (короткий):
//           // content: `Translate to ${targetLang}. Output only translation for audio.`,

//           // ИЛИ вариант 3 (точный):
//           // content: `Translate to ${targetLang}. Provide only the ${targetLang} translation for subtitles/voiceover.`,
//         },
//         ...conversationContext.history,
//         { role: 'user', content: text },
//       ],
//       temperature: 0,
//       max_tokens: 300,
//     };

//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     const data = await response.json();
//     const translation = data.choices[0]?.message?.content?.trim() || text;

//     conversationContext.history.push(
//       { role: 'user', content: text },
//       { role: 'assistant', content: translation },
//     );

//     if (conversationContext.history.length > 16) {
//       conversationContext.history.splice(0, 2);
//     }

//     return translation;
//   } catch (e) {
//     console.error('Translation error:', e);
//     return text;
//   }
// }

// async function generateAndPlayVoice(text) {
//   if (!text || !isRecording || !activeSettings?.enableVoice) return;

//   try {
//     const voiceGender = activeSettings.voiceGender || 'neutral';
//     const voiceConfig = VOICE_CONFIG[voiceGender] || VOICE_CONFIG.neutral;

//     const requestBody = {
//       model: 'tts-1',
//       voice: voiceConfig.openai_voice,
//       input: text,
//       speed: 1.05,
//     };

//     const response = await fetch('https://api.openai.com/v1/audio/speech', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     if (!response.ok) {
//       return;
//     }

//     const arrayBuffer = await response.arrayBuffer();

//     if (!playbackAudioContext || playbackAudioContext.state === 'closed') {
//       playbackAudioContext = new AudioContext();
//     }

//     const audioBuffer = await playbackAudioContext.decodeAudioData(arrayBuffer);

//     speechQueue.push({
//       buffer: audioBuffer,
//       context: playbackAudioContext
//     });

//     if (!isPlaying) {
//       playNextInQueue();
//     }
//   } catch (e) {
//     console.error('TTS Error:', e);
//   }
// }

// function playNextInQueue() {
//   if (speechQueue.length === 0 || !isRecording) {
//     isPlaying = false;
//     return;
//   }

//   isPlaying = true;
//   const { buffer, context } = speechQueue.shift();

//   if (context.state === 'closed') {
//     playNextInQueue();
//     return;
//   }

//   const source = context.createBufferSource();
//   source.buffer = buffer;

//   if (speechQueue.length > 1) {
//     source.playbackRate.value = 1.25;
//   } else {
//     source.playbackRate.value = 1.05;
//   }

//   source.connect(context.destination);

//   source.onended = () => {
//     playNextInQueue();
//   };

//   if (context.state === 'suspended') {
//     context.resume();
//   }
//   source.start(0);
// }

// function applyVolumeSettings(s) {
//   if (!gainNode || !audioContext) return;
//   const vol = s.muteOriginal ? 0 : s.originalVolume || 1.0;
//   gainNode.gain.setTargetAtTime(vol, audioContext.currentTime, 0.01);
// }

// function updateVolume(s) {
//   activeSettings = { ...activeSettings, ...s };
//   applyVolumeSettings(activeSettings);
// }

// function stopInternal() {
//   isRecording = false;
//   isPlaying = false;
//   speechQueue = [];
//   clearTimeout(silenceTimer);

//   if (mediaRecorder && mediaRecorder.state !== 'inactive') {
//     mediaRecorder.stop();
//   }

//   if (audioStream) {
//     audioStream.getTracks().forEach(t => t.stop());
//   }

//   if (audioContext && audioContext.state !== 'closed') {
//     audioContext.close();
//   }

//   if (playbackAudioContext && playbackAudioContext.state !== 'closed') {
//     playbackAudioContext.close();
//   }

//   mediaRecorder = null;
//   audioStream = null;
//   audioContext = null;
//   playbackAudioContext = null;
//   gainNode = null;
//   analyser = null;
//   dataArray = null;
// }

// function stopCapture() {
//   stopInternal();
//   activeSettings = null;
//   currentTabId = null;
//   conversationContext.history = [];
//   conversationContext.lastOriginalText = '';
// }

// console.log('✅ Offscreen ready');

//TODO:

// offscreen.js - ГОЛОС + СУБТИТРЫ
// console.log('📄 Offscreen document loaded');

// let mediaRecorder = null;
// let audioStream = null;
// let audioContext = null;
// let playbackAudioContext = null;
// let analyser = null;
// let dataArray = null;
// let gainNode = null;
// let activeSettings = null;
// let isRecording = false;
// let currentTabId = null;
// let silenceTimer = null;

// let speechQueue = [];
// let isPlaying = false;

// let conversationContext = {
//   history: [],
//   lastOriginalText: '',
//   maxHistory: 8,
// };

// const VOICE_CONFIG = {
//   male: { openai_voice: 'onyx' },
//   female: { openai_voice: 'shimmer' },
//   neutral: { openai_voice: 'nova' },
//   auto: { openai_voice: 'alloy' },
// };

// // ==================== СТИЛИ ПЕРЕВОДА ====================
// const TRANSLATION_STYLES = {
//   DEFAULT: {
//     id: 'default',
//     name: 'Обычный',
//     prompt: (lang) => `Translate to ${lang} for voiceover. Output only the ${lang} text. Natural speech.`
//   },
//   CHILDREN: {
//     id: 'children',
//     name: 'Детский контент',
//     prompt: (lang) => `Translate to ${lang} for children's cartoons/educational content.
// RULES:
// 1. Use simple, clear, friendly language
// 2. Keep it engaging and positive
// 3. Avoid complex words
// 4. Maintain educational value
// 5. Use natural speaking style for voiceover
// OUTPUT ONLY THE TRANSLATION.`
//   },
//   SCIENCE: {
//     id: 'science',
//     name: 'Научный/Технический',
//     prompt: (lang) => `Translate to ${lang} for scientific/technical content.
// RULES:
// 1. Preserve ALL technical terms in original language (English)
// 2. Maintain precise terminology
// 3. Keep formulas, abbreviations, units unchanged
// 4. Use formal academic style but still suitable for voiceover
// 5. Add brief explanations in brackets if needed
// OUTPUT ONLY THE TRANSLATION.`
//   },
//   EDUCATIONAL: {
//     id: 'educational',
//     name: 'Обучающий/Коучинг',
//     prompt: (lang) => `Translate to ${lang} for educational/coaching content.
// RULES:
// 1. Clear, motivational tone
// 2. Keep instructional clarity
// 3. Maintain teacher-student dynamic
// 4. Use engaging but professional language
// 5. Preserve examples and analogies
// OUTPUT ONLY THE TRANSLATION.`
//   },
// //   KABBALAH: {
// //     id: 'kabbalah',
// //     name: 'Кабалистический',
// //     prompt: (lang) => `Translate to ${lang} with esoteric/kabbalistic interpretation.
// // RULES:
// // 1. Look for hidden meanings and symbolism
// // 2. Add mystical interpretations in brackets []
// // 3. Keep original text but enhance with spiritual insight
// // 4. Use elevated, philosophical language
// // 5. Connect to universal concepts
// // OUTPUT ONLY THE TRANSLATION WITH ADDED INTERPRETATIONS.`
// //   }
// KABBALAH: {
//   id: 'kabbalah',
//   name: 'Каббалистический',
//   prompt: (lang) => `Translate to ${lang} with precise Jewish mystical terminology.
// Use traditional translations for all biblical and kabbalistic concepts.
// Maintain spiritual depth and accuracy.`
// }
// };

// // Функция получения промпта по стилю
// function getTranslationPrompt(targetLang, style = 'default') {
//   const styleKey = style.toUpperCase();
//   const styleConfig = TRANSLATION_STYLES[styleKey] || TRANSLATION_STYLES.DEFAULT;
//   return styleConfig.prompt(targetLang);
// }
// // ==================== КОНЕЦ СТИЛЕЙ ПЕРЕВОДА ====================

// // ОРИГИНАЛЬНЫЙ РАБОЧИЙ КОД
// const OPENAI_API_KEY = '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';

// // НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ GEMINI
// const GEMINI_API_KEY = 'AIzaSyAQjnhKlojhPPkFfaNDiXl7nLmGdrq3dPg';
// const GEMINI_MODEL = 'gemini-2.0-flash-exp';

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   switch (request.type) {
//     case 'START_CAPTURE':
//       startCapture(request.streamId, request.settings, request.tabId).then(sendResponse);
//       return true;
//     case 'STOP_CAPTURE':
//       stopCapture();
//       sendResponse({ success: true });
//       return true;
//     case 'UPDATE_VOLUME':
//       updateVolume(request.settings);
//       sendResponse({ success: true });
//       return true;
//     case 'UPDATE_VOICE':
//       if (request.settings) {
//         activeSettings = { ...activeSettings, ...request.settings };
//         console.log('Voice settings updated:', activeSettings.voiceGender);
//       }
//       sendResponse({ success: true });
//       return true;
//     case 'PING':
//       sendResponse({ success: true, isRecording });
//       return true;
//     case 'UPDATE_SETTINGS':
//       if (request.settings) {
//         activeSettings = { ...activeSettings, ...request.settings };
//       }
//       sendResponse({ success: true });
//       return true;
//     default:
//       return false;
//   }
// });

// async function startCapture(streamId, settings, tabId) {
//   try {
//     stopInternal();
//     isRecording = true;
//     activeSettings = { ...settings };
//     currentTabId = tabId;

//     conversationContext.history = [];
//     conversationContext.lastOriginalText = '';
//     speechQueue = [];
//     isPlaying = false;

//     audioStream = await navigator.mediaDevices.getUserMedia({
//       audio: {
//         mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId },
//       },
//       video: false,
//     });

//     audioContext = new AudioContext();
//     const source = audioContext.createMediaStreamSource(audioStream);

//     analyser = audioContext.createAnalyser();
//     analyser.fftSize = 256;
//     source.connect(analyser);
//     dataArray = new Uint8Array(analyser.frequencyBinCount);

//     gainNode = audioContext.createGain();
//     source.connect(gainNode);
//     gainNode.connect(audioContext.destination);

//     applyVolumeSettings(activeSettings);
//     startRecording();

//     return { success: true };
//   } catch (error) {
//     isRecording = false;
//     return { success: false, error: error.message };
//   }
// }

// function startRecording() {
//   if (!isRecording || !audioStream || !audioStream.active) return;

//   try {
//     mediaRecorder = new MediaRecorder(audioStream, {
//       mimeType: 'audio/webm;codecs=opus',
//     });
//     let audioChunks = [];

//     mediaRecorder.ondataavailable = (e) => {
//       if (e.data.size > 0) audioChunks.push(e.data);
//     };

//     mediaRecorder.onstop = async () => {
//       if (audioChunks.length > 0 && isRecording) {
//         const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
//         processAudioWithContext(audioBlob);
//       }
//       if (isRecording) startRecording();
//     };

//     mediaRecorder.start();

//     const checkSilence = () => {
//       if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
//       analyser.getByteFrequencyData(dataArray);
//       let average = dataArray.reduce((a, b) => a + b) / dataArray.length;

//       if (average < 10) {
//         if (!silenceTimer) {
//           silenceTimer = setTimeout(() => {
//             if (mediaRecorder && mediaRecorder.state === 'recording') {
//               mediaRecorder.stop();
//             }
//           }, 1500);
//         }
//       } else {
//         clearTimeout(silenceTimer);
//         silenceTimer = null;
//       }
//     };

//     const vadInterval = setInterval(checkSilence, 100);
//     setTimeout(() => {
//       clearInterval(vadInterval);
//       if (mediaRecorder && mediaRecorder.state === 'recording') {
//         mediaRecorder.stop();
//       }
//     }, 4000);
//   } catch (err) {
//     console.error('MediaRecorder error:', err);
//     isRecording = false;
//   }
// }

// async function processAudioWithContext(audioBlob) {
//   if (!isRecording) return;

//   try {
//     const originalText = await transcribeWithWhisper(audioBlob);

//     if (!originalText || originalText.trim() === '') return;

//     if (originalText === conversationContext.lastOriginalText) {
//       return;
//     }

//     conversationContext.lastOriginalText = originalText;
//     const cleanText = originalText.trim();
//     let finalText = cleanText;

//     if (activeSettings?.targetLanguage && activeSettings.targetLanguage !== 'original') {
//       finalText = await translateWithContext(cleanText, activeSettings.targetLanguage);
//     }

//     if (isRecording && finalText) {
//       if (activeSettings?.showSubtitles !== false) {
//         chrome.runtime.sendMessage({
//           type: 'SUBTITLES_FROM_OFFSCREEN',
//           text: finalText,
//           tabId: currentTabId,
//           settings: activeSettings
//         }).catch(() => { });
//       }

//       if (activeSettings?.enableVoice) {
//         generateAndPlayVoice(finalText);
//       }
//     }
//   } catch (e) {
//     console.error('Process error:', e);
//   }
// }

// async function transcribeWithWhisper(blob) {
//   const formData = new FormData();
//   formData.append('file', blob, 'audio.webm');
//   formData.append('model', 'whisper-1');

//   try {
//     const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//       body: formData,
//     });

//     const data = await response.json();
//     return data.text || '';
//   } catch (error) {
//     console.error('Whisper failed:', error);
//     return '';
//   }
// }

// async function translateWithContext(text, targetLang) {
//   try {
//     // Получаем стиль перевода из настроек
//     const translationStyle = activeSettings?.translationStyle || 'default';
    
//     const requestBody = {
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           // Используем выбранный стиль перевода
//           content: getTranslationPrompt(targetLang, translationStyle),
//         },
//         ...conversationContext.history,
//         { role: 'user', content: text },
//       ],
//       temperature: translationStyle === 'science' ? 0.1 : 0, // Для науки чуть выше
//       max_tokens: translationStyle === 'kabbalah' ? 400 : 300, // Каббала требует больше токенов
//     };

//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     const data = await response.json();
//     const translation = data.choices[0]?.message?.content?.trim() || text;

//     conversationContext.history.push(
//       { role: 'user', content: text },
//       { role: 'assistant', content: translation },
//     );

//     if (conversationContext.history.length > 16) {
//       conversationContext.history.splice(0, 2);
//     }

//     return translation;
//   } catch (e) {
//     console.error('Translation error:', e);
//     return text;
//   }
// }

// async function generateAndPlayVoice(text) {
//   if (!text || !isRecording || !activeSettings?.enableVoice) return;

//   try {
//     const voiceGender = activeSettings.voiceGender || 'neutral';
//     const voiceConfig = VOICE_CONFIG[voiceGender] || VOICE_CONFIG.neutral;

//     const requestBody = {
//       model: 'tts-1',
//       voice: voiceConfig.openai_voice,
//       input: text,
//       speed: 1.05,
//     };

//     const response = await fetch('https://api.openai.com/v1/audio/speech', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     if (!response.ok) {
//       return;
//     }

//     const arrayBuffer = await response.arrayBuffer();

//     if (!playbackAudioContext || playbackAudioContext.state === 'closed') {
//       playbackAudioContext = new AudioContext();
//     }

//     const audioBuffer = await playbackAudioContext.decodeAudioData(arrayBuffer);

//     speechQueue.push({
//       buffer: audioBuffer,
//       context: playbackAudioContext
//     });

//     if (!isPlaying) {
//       playNextInQueue();
//     }
//   } catch (e) {
//     console.error('TTS Error:', e);
//   }
// }

// function playNextInQueue() {
//   if (speechQueue.length === 0 || !isRecording) {
//     isPlaying = false;
//     return;
//   }

//   isPlaying = true;
//   const { buffer, context } = speechQueue.shift();

//   if (context.state === 'closed') {
//     playNextInQueue();
//     return;
//   }

//   const source = context.createBufferSource();
//   source.buffer = buffer;

//   if (speechQueue.length > 1) {
//     source.playbackRate.value = 1.25;
//   } else {
//     source.playbackRate.value = 1.05;
//   }

//   source.connect(context.destination);

//   source.onended = () => {
//     playNextInQueue();
//   };

//   if (context.state === 'suspended') {
//     context.resume();
//   }
//   source.start(0);
// }

// function applyVolumeSettings(s) {
//   if (!gainNode || !audioContext) return;
//   const vol = s.muteOriginal ? 0 : s.originalVolume || 1.0;
//   gainNode.gain.setTargetAtTime(vol, audioContext.currentTime, 0.01);
// }

// function updateVolume(s) {
//   activeSettings = { ...activeSettings, ...s };
//   applyVolumeSettings(activeSettings);
// }

// function stopInternal() {
//   isRecording = false;
//   isPlaying = false;
//   speechQueue = [];
//   clearTimeout(silenceTimer);

//   if (mediaRecorder && mediaRecorder.state !== 'inactive') {
//     mediaRecorder.stop();
//   }

//   if (audioStream) {
//     audioStream.getTracks().forEach(t => t.stop());
//   }

//   if (audioContext && audioContext.state !== 'closed') {
//     audioContext.close();
//   }

//   if (playbackAudioContext && playbackAudioContext.state !== 'closed') {
//     playbackAudioContext.close();
//   }

//   mediaRecorder = null;
//   audioStream = null;
//   audioContext = null;
//   playbackAudioContext = null;
//   gainNode = null;
//   analyser = null;
//   dataArray = null;
// }

// function stopCapture() {
//   stopInternal();
//   activeSettings = null;
//   currentTabId = null;
//   conversationContext.history = [];
//   conversationContext.lastOriginalText = '';
// }

// console.log('✅ Offscreen ready');

// //TODO:

// // offscreen.js - ВЕРСИЯ СО СТИЛЯМИ И КОНТЕКСТОМ
// console.log('📄 Offscreen document loaded');

// const OPENAI_API_KEY = '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';

// let mediaRecorder = null;
// let audioStream = null;
// let audioContext = null;
// let playbackAudioContext = null;
// let analyser = null;
// let dataArray = null;
// let gainNode = null;
// let activeSettings = null;
// let isRecording = false;
// let currentTabId = null;

// let speechQueue = [];
// let isPlaying = false;
// let conversationContext = { history: [], lastOriginalText: '', maxHistory: 10 };

// // ==================== КОНФИГУРАЦИЯ СТИЛЕЙ ====================
// const TRANSLATION_STYLES = {
//   DEFAULT: "Translate to {lang}. Natural speech, clear and simple.",
//   KABBALAH: "You are an expert in Kabbalah. Translate to {lang} using precise terms: Light (Ohr), Vessel (Kli), Screen (Masach). Do not confuse names from Torah and Zohar. Output ONLY translation without explanations.",
//   KIDS: "Translate to {lang} as a fairy tale for children. Use very simple words, warm tone, and magical descriptions.",
//   SCIENTIFIC: "Translate to {lang} in a formal scientific style. Focus on logic and technical accuracy."
// };

// const VOICE_CONFIG = {
//   male: { openai_voice: 'onyx' },
//   female: { openai_voice: 'shimmer' },
//   neutral: { openai_voice: 'nova' },
//   auto: { openai_voice: 'alloy' },
// };

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   switch (request.type) {
//     case 'START_CAPTURE':
//       startCapture(request.streamId, request.settings, request.tabId).then(sendResponse);
//       return true;
//     case 'STOP_CAPTURE':
//       stopCapture();
//       sendResponse({ success: true });
//       return true;
//     case 'UPDATE_SETTINGS':
//     case 'UPDATE_VOLUME':
//       activeSettings = { ...activeSettings, ...request.settings };
//       applyVolumeSettings(activeSettings);
//       sendResponse({ success: true });
//       return true;
//     case 'PING':
//       sendResponse({ success: true, isRecording });
//       return true;
//     default:
//       return false;
//   }
// });

// async function startCapture(streamId, settings, tabId) {
//   try {
//     stopInternal();
//     isRecording = true;
//     activeSettings = { ...settings };
//     currentTabId = tabId;
//     conversationContext.history = [];

//     audioStream = await navigator.mediaDevices.getUserMedia({
//       audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } }
//     });

//     audioContext = new AudioContext();
//     const source = audioContext.createMediaStreamSource(audioStream);
//     analyser = audioContext.createAnalyser();
//     gainNode = audioContext.createGain();
//     source.connect(analyser);
//     source.connect(gainNode);
//     gainNode.connect(audioContext.destination);

//     applyVolumeSettings(activeSettings);
//     startRecordingCycle();
//     return { success: true };
//   } catch (error) {
//     isRecording = false;
//     return { success: false, error: error.message };
//   }
// }

// function startRecordingCycle() {
//   if (!isRecording || !audioStream) return;
//   mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
//   let chunks = [];
//   mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
//   mediaRecorder.onstop = async () => {
//     if (chunks.length > 0 && isRecording) processAudio(new Blob(chunks, { type: 'audio/webm' }));
//     if (isRecording) startRecordingCycle();
//   };
//   mediaRecorder.start();
//   setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 4000);
// }

// async function processAudio(blob) {
//   try {
//     const text = await transcribe(blob);
//     if (!text || text.trim().length < 3) return;
//     if (text === conversationContext.lastOriginalText) return;
//     conversationContext.lastOriginalText = text;

//     const translated = await translate(text, activeSettings.targetLanguage);

//     if (isRecording && translated) {
//       chrome.runtime.sendMessage({
//         type: 'SUBTITLES_FROM_OFFSCREEN',
//         text: translated,
//         tabId: currentTabId,
//         settings: activeSettings
//       }).catch(() => {});

//       if (activeSettings.enableVoice) generateVoice(translated);
//     }
//   } catch (e) { console.error(e); }
// }

// async function transcribe(blob) {
//   const fd = new FormData();
//   fd.append('file', blob, 'audio.webm');
//   fd.append('model', 'whisper-1');
//   fd.append('language', 'en');
//   fd.append('prompt', 'Kabbalah, Light, Vessel, spiritual context.');
//   const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//     body: fd
//   });
//   const data = await res.json();
//   return data.text || '';
// }

// async function translate(text, lang) {
//   // Выбираем стиль из настроек или ставим дефолт
//   const styleKey = (activeSettings.translationStyle || 'kabbalah').toUpperCase();
//   const systemPrompt = (TRANSLATION_STYLES[styleKey] || TRANSLATION_STYLES.DEFAULT).replace('{lang}', lang);

//   const res = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       model: 'gpt-4o-mini',
//       messages: [
//         { role: 'system', content: systemPrompt },
//         ...conversationContext.history,
//         { role: 'user', content: text }
//       ],
//       temperature: 0.1
//     })
//   });
//   const data = await res.json();
//   const result = data.choices[0].message.content.trim();

//   conversationContext.history.push({ role: 'user', content: text }, { role: 'assistant', content: result });
//   if (conversationContext.history.length > 10) conversationContext.history.splice(0, 2);
//   return result;
// }

// async function generateVoice(text) {
//   try {
//     const voice = VOICE_CONFIG[activeSettings.voiceGender || 'neutral'].openai_voice;
//     const res = await fetch('https://api.openai.com/v1/audio/speech', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify({ model: 'tts-1', voice: voice, input: text, speed: 1.1 })
//     });
//     const buffer = await (playbackAudioContext || (playbackAudioContext = new AudioContext())).decodeAudioData(await res.arrayBuffer());
//     if (speechQueue.length > 3) speechQueue.shift();
//     speechQueue.push(buffer);
//     if (!isPlaying) playQueue();
//   } catch (e) {}
// }

// function playQueue() {
//   if (speechQueue.length === 0 || !isRecording) { isPlaying = false; return; }
//   isPlaying = true;
//   const source = playbackAudioContext.createBufferSource();
//   source.buffer = speechQueue.shift();
//   source.playbackRate.value = speechQueue.length > 1 ? 1.3 : 1.1;
//   source.connect(playbackAudioContext.destination);
//   source.onended = playQueue;
//   if (playbackAudioContext.state === 'suspended') playbackAudioContext.resume();
//   source.start(0);
// }

// function applyVolumeSettings(s) {
//   if (gainNode) gainNode.gain.setTargetAtTime(s.muteOriginal ? 0 : (s.originalVolume || 1), audioContext.currentTime, 0.01);
// }

// function stopInternal() {
//   isRecording = false; isPlaying = false; speechQueue = [];
//   if (mediaRecorder) mediaRecorder.stop();
//   if (audioStream) audioStream.getTracks().forEach(t => t.stop());
//   if (audioContext) audioContext.close();
//   if (playbackAudioContext) playbackAudioContext.close();
//   mediaRecorder = null; audioStream = null; audioContext = null; playbackAudioContext = null;
// }

// function stopCapture() { stopInternal(); conversationContext.history = []; }

// offscreen.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ (КОНТЕКСТ + СТИЛИ + ФИКС ОШИБОК)
//TODO: best so far
// console.log('📄 Offscreen document loaded');

// const OPENAI_API_KEY = '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';

// let mediaRecorder = null;
// let audioStream = null;
// let audioContext = null;
// let playbackAudioContext = null;
// let analyser = null;
// let gainNode = null;
// let activeSettings = null;
// let isRecording = false;
// let currentTabId = null;

// let speechQueue = [];
// let isPlaying = false;
// let conversationContext = { history: [], lastOriginalText: '', maxHistory: 10 };

// // ==================== КОНФИГУРАЦИЯ СТИЛЕЙ ====================
// const TRANSLATION_STYLES = {
//   DEFAULT: "Translate to {lang}. Natural speech, clear and simple. Output ONLY translation.",
//   KABBALAH: "Translate to {lang}. Use Kabbalah terminology (Light, Vessel, Screen). Do not confuse names from Torah and Zohar. Output ONLY translation without explanations.",
//   KIDS: "Translate to {lang} as a fairy tale for children. Use very simple words. Output ONLY translation.",
//   SCIENTIFIC: "Translate to {lang} in a formal scientific style. Focus on logic and technical accuracy. Output ONLY translation."
// };

// const VOICE_CONFIG = {
//   male: { openai_voice: 'onyx' },
//   female: { openai_voice: 'shimmer' },
//   neutral: { openai_voice: 'nova' },
//   auto: { openai_voice: 'alloy' },
// };

// // ==================== ОБРАБОТЧИК СООБЩЕНИЙ ====================
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   switch (request.type) {
//     case 'START_CAPTURE':
//       startCapture(request.streamId, request.settings, request.tabId).then(sendResponse);
//       return true;
//     case 'STOP_CAPTURE':
//       stopCapture();
//       sendResponse({ success: true });
//       return true;
//     case 'UPDATE_SETTINGS':
//     case 'UPDATE_VOLUME':
//       activeSettings = { ...activeSettings, ...request.settings };
//       applyVolumeSettings(activeSettings);
//       sendResponse({ success: true });
//       return true;
//     case 'PING':
//       sendResponse({ success: true, isRecording });
//       return true;
//     default:
//       return false;
//   }
// });

// async function startCapture(streamId, settings, tabId) {
//   try {
//     stopInternal();
//     isRecording = true;
//     activeSettings = { ...settings };
//     currentTabId = tabId;
//     conversationContext.history = [];

//     audioStream = await navigator.mediaDevices.getUserMedia({
//       audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } }
//     });

//     audioContext = new AudioContext();
//     const source = audioContext.createMediaStreamSource(audioStream);
//     analyser = audioContext.createAnalyser();
//     gainNode = audioContext.createGain();
//     source.connect(analyser);
//     source.connect(gainNode);
//     gainNode.connect(audioContext.destination);

//     applyVolumeSettings(activeSettings);
//     startRecordingCycle();
//     return { success: true };
//   } catch (error) {
//     isRecording = false;
//     return { success: false, error: error.message };
//   }
// }

// function startRecordingCycle() {
//   if (!isRecording || !audioStream) return;

//   try {
//     mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
//     let chunks = [];

//     mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

//     mediaRecorder.onstop = async () => {
//       if (chunks.length > 0 && isRecording) {
//         processAudio(new Blob(chunks, { type: 'audio/webm' }));
//       }
//       if (isRecording) startRecordingCycle();
//     };

//     mediaRecorder.start();

//     // ФИКС ОШИБКИ: Проверка существования mediaRecorder перед остановкой
//     setTimeout(() => { 
//       if (mediaRecorder && mediaRecorder.state === 'recording') {
//         mediaRecorder.stop(); 
//       }
//     }, 4000);

//   } catch (err) {
//     console.error('Recorder error:', err);
//     isRecording = false;
//   }
// }

// async function processAudio(blob) {
//   try {
//     const text = await transcribe(blob);
//     if (!text || text.trim().length < 3) return;
//     if (text === conversationContext.lastOriginalText) return;
//     conversationContext.lastOriginalText = text;

//     const translated = await translate(text, activeSettings.targetLanguage);

//     if (isRecording && translated) {
//       chrome.runtime.sendMessage({
//         type: 'SUBTITLES_FROM_OFFSCREEN',
//         text: translated,
//         tabId: currentTabId,
//         settings: activeSettings
//       }).catch(() => {});

//       if (activeSettings.enableVoice) generateVoice(translated);
//     }
//   } catch (e) { console.error('Process error:', e); }
// }

// async function transcribe(blob) {
//   const fd = new FormData();
//   fd.append('file', blob, 'audio.webm');
//   fd.append('model', 'whisper-1');
//   fd.append('language', 'en');
//   fd.append('prompt', 'Kabbalah, Light, Vessel, spiritual context, Zohar.');
  
//   try {
//     const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//       body: fd
//     });
//     const data = await res.json();
//     return data.text || '';
//   } catch (e) { return ''; }
// }

// async function translate(text, lang) {
//   const styleKey = (activeSettings.translationStyle || 'kabbalah').toUpperCase();
//   const systemPrompt = (TRANSLATION_STYLES[styleKey] || TRANSLATION_STYLES.DEFAULT).replace('{lang}', lang);

//   try {
//     const res = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           ...conversationContext.history,
//           { role: 'user', content: text }
//         ],
//         temperature: 0 // Максимальная точность для перевода
//       })
//     });
//     const data = await res.json();
//     const result = data.choices[0].message.content.trim();

//     conversationContext.history.push({ role: 'user', content: text }, { role: 'assistant', content: result });
//     if (conversationContext.history.length > 10) conversationContext.history.splice(0, 2);
    
//     return result;
//   } catch (e) { return text; }
// }

// async function generateVoice(text) {
//   try {
//     const voice = VOICE_CONFIG[activeSettings.voiceGender || 'neutral'].openai_voice;
//     const res = await fetch('https://api.openai.com/v1/audio/speech', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify({ model: 'tts-1', voice: voice, input: text, speed: 1.1 })
//     });
    
//     if (!res.ok) return;

//     const arrayBuffer = await res.arrayBuffer();
//     if (!playbackAudioContext || playbackAudioContext.state === 'closed') {
//       playbackAudioContext = new AudioContext();
//     }

//     const buffer = await playbackAudioContext.decodeAudioData(arrayBuffer);
    
//     if (speechQueue.length > 3) speechQueue.shift();
//     speechQueue.push(buffer);
    
//     if (!isPlaying) playQueue();
//   } catch (e) { console.error('TTS error:', e); }
// }

// function playQueue() {
//   if (speechQueue.length === 0 || !isRecording) { isPlaying = false; return; }
  
//   isPlaying = true;
//   const source = playbackAudioContext.createBufferSource();
//   source.buffer = speechQueue.shift();
//   source.playbackRate.value = speechQueue.length > 1 ? 1.3 : 1.1;
  
//   source.connect(playbackAudioContext.destination);
//   source.onended = playQueue;
  
//   if (playbackAudioContext.state === 'suspended') playbackAudioContext.resume();
//   source.start(0);
// }

// function applyVolumeSettings(s) {
//   if (gainNode && audioContext) {
//     const vol = s.muteOriginal ? 0 : (s.originalVolume || 1);
//     gainNode.gain.setTargetAtTime(vol, audioContext.currentTime, 0.01);
//   }
// }

// function stopInternal() {
//   isRecording = false;
//   isPlaying = false;
//   speechQueue = [];
  
//   // ФИКС ОШИБКИ: Сначала проверяем состояние, потом останавливаем и зануляем
//   if (mediaRecorder) {
//     if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
//     mediaRecorder = null;
//   }
  
//   if (audioStream) {
//     audioStream.getTracks().forEach(t => t.stop());
//     audioStream = null;
//   }
  
//   if (audioContext && audioContext.state !== 'closed') {
//     audioContext.close();
//     audioContext = null;
//   }
  
//   if (playbackAudioContext && playbackAudioContext.state !== 'closed') {
//     playbackAudioContext.close();
//     playbackAudioContext = null;
//   }
  
//   gainNode = null;
//   analyser = null;
// }

// function stopCapture() {
//   stopInternal();
//   conversationContext.history = [];
//   conversationContext.lastOriginalText = '';
// }

// console.log('✅ Offscreen ready - Final Stable Version');

//TODO:
// offscreen.js - УНИВЕРСАЛЬНАЯ МУЛЬТИЯЗЫЧНАЯ ВЕРСИЯ (150+ ЯЗЫКОВ)
console.log('📄 Offscreen document loaded - Universal Mode');

const OPENAI_API_KEY = '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';

let mediaRecorder = null, audioStream = null, audioContext = null, playbackAudioContext = null;
let analyser = null, gainNode = null, isRecording = false, isPlaying = false;
let activeSettings = null, currentTabId = null, speechQueue = [];
let conversationContext = { history: [], lastOriginalText: '', maxHistory: 20 }; // Глубокий контекст

const TRANSLATION_STYLES = {
  DEFAULT: "Translate to {lang}. Natural speech. Output ONLY translation.",
  KABBALAH: "Translate to {lang}. Use Kabbalah terminology (Light, Vessel, Screen). Do not confuse names from Torah and Zohar. Output ONLY translation without explanations.",
  KIDS: "Translate to {lang} as a fairy tale for children. Simple words. Output ONLY translation.",
  SCIENTIFIC: "Translate to {lang} in a formal scientific style. Output ONLY translation."
};

const VOICE_CONFIG = {
  male: { openai_voice: 'onyx' },
  female: { openai_voice: 'shimmer' },
  neutral: { openai_voice: 'nova' },
  auto: { openai_voice: 'alloy' }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_CAPTURE') { startCapture(request.streamId, request.settings, request.tabId).then(sendResponse); return true; }
  if (request.type === 'STOP_CAPTURE') { stopCapture(); sendResponse({ success: true }); return true; }
  if (request.type === 'UPDATE_SETTINGS' || request.type === 'UPDATE_VOLUME') {
    activeSettings = { ...activeSettings, ...request.settings };
    if (gainNode && audioContext) gainNode.gain.setTargetAtTime(activeSettings.muteOriginal ? 0 : (activeSettings.originalVolume || 1), audioContext.currentTime, 0.01);
    sendResponse({ success: true }); return true;
  }
  if (request.type === 'PING') { sendResponse({ success: true, isRecording }); return true; }
  return false;
});

async function startCapture(streamId, settings, tabId) {
  try {
    stopInternal();
    isRecording = true; activeSettings = settings; currentTabId = tabId;
    conversationContext.history = [];
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } } });
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();
    source.connect(analyser); source.connect(gainNode); gainNode.connect(audioContext.destination);
    applyVolumeSettings(activeSettings);
    startRecordingCycle();
    return { success: true };
  } catch (e) { isRecording = false; return { success: false, error: e.message }; }
}

function startRecordingCycle() {
  if (!isRecording || !audioStream) return;
  try {
    mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
    let chunks = [];
    mediaRecorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    mediaRecorder.onstop = () => {
      if (chunks.length > 0 && isRecording) processAudio(new Blob(chunks, { type: 'audio/webm' }));
      if (isRecording) startRecordingCycle();
    };
    mediaRecorder.start();
    // 5 секунд — оптимально для смысла и задержки
    setTimeout(() => { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 5000);
  } catch (e) { isRecording = false; }
}

async function processAudio(blob) {
  try {
    const text = await transcribe(blob);
    if (!text || text.trim().length < 3 || text === conversationContext.lastOriginalText) return;
    conversationContext.lastOriginalText = text;

    const translated = await translate(text, activeSettings.targetLanguage);
    if (isRecording && translated) {
      chrome.runtime.sendMessage({ type: 'SUBTITLES_FROM_OFFSCREEN', text: translated, tabId: currentTabId, settings: activeSettings }).catch(() => {});
      if (activeSettings.enableVoice) generateVoice(translated);
    }
  } catch (e) { console.error(e); }
}

async function transcribe(blob) {
  const fd = new FormData();
  fd.append('file', blob, 'audio.webm');
  fd.append('model', 'whisper-1');
  
  // УНИВЕРСАЛЬНОСТЬ: Если в настройках есть язык оригинала (напр. 'ru', 'fr'), шлем его. 
  // Если нет — Whisper определит сам (auto-detect).
  if (activeSettings?.sourceLanguage && activeSettings.sourceLanguage !== 'auto') {
    fd.append('language', activeSettings.sourceLanguage);
  }

  fd.append('prompt', 'Technical and spiritual lecture. Maintain names and terminology.');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: fd
  });
  const data = await res.json();
  return data.text || '';
}

async function translate(text, lang) {
  const styleKey = (activeSettings.translationStyle || 'kabbalah').toUpperCase();
  const basePrompt = TRANSLATION_STYLES[styleKey] || TRANSLATION_STYLES.DEFAULT;
  
  const systemPrompt = `${basePrompt.replace('{lang}', lang)} 
  CRITICAL: Input may be cut mid-sentence. Use history to maintain flow. 
  Merge current text with previous unfinished thoughts. Output ONLY translation.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...conversationContext.history, { role: 'user', content: text }],
      temperature: 0
    })
  });
  const data = await res.json();
  const result = data.choices[0].message.content.trim();

  conversationContext.history.push({ role: 'user', content: text }, { role: 'assistant', content: result });
  if (conversationContext.history.length > 20) conversationContext.history.splice(0, 2);
  return result;
}

async function generateVoice(text) {
  try {
    const voice = VOICE_CONFIG[activeSettings.voiceGender || 'neutral'].openai_voice;
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice: voice, input: text, speed: 1.1 })
    });
    const buffer = await (playbackAudioContext || (playbackAudioContext = new AudioContext())).decodeAudioData(await res.arrayBuffer());
    if (speechQueue.length > 3) speechQueue.shift();
    speechQueue.push(buffer);
    if (!isPlaying) playQueue();
  } catch (e) {}
}

function playQueue() {
  if (speechQueue.length === 0 || !isRecording) { isPlaying = false; return; }
  isPlaying = true;
  const source = playbackAudioContext.createBufferSource();
  source.buffer = speechQueue.shift();
  source.playbackRate.value = speechQueue.length > 1 ? 1.3 : 1.1;
  source.connect(playbackAudioContext.destination);
  source.onended = playQueue;
  if (playbackAudioContext.state === 'suspended') playbackAudioContext.resume();
  source.start(0);
}

function applyVolumeSettings(s) {
  if (gainNode && audioContext) gainNode.gain.setTargetAtTime(s.muteOriginal ? 0 : (s.originalVolume || 1), audioContext.currentTime, 0.01);
}

function stopInternal() {
  isRecording = false; isPlaying = false; speechQueue = [];
  if (mediaRecorder) { if (mediaRecorder.state !== 'inactive') mediaRecorder.stop(); mediaRecorder = null; }
  if (audioStream) { audioStream.getTracks().forEach(t => t.stop()); audioStream = null; }
  if (audioContext) { audioContext.close().catch(()=>{}); audioContext = null; }
  if (playbackAudioContext) { playbackAudioContext.close().catch(()=>{}); playbackAudioContext = null; }
}

function stopCapture() { stopInternal(); conversationContext.history = []; }