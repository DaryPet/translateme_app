// ============================================================
// DEEPGRAM WEBSOCKET LIVE STREAMING VERSION
// ============================================================
console.log('=== OFFSCREEN.JS STARTED - WEBSOCKET LIVE MODE ===');
console.log('🔍 Opik check:', {
  secretsLoaded: !!window.SECRETS,
  opikConfigExists: !!window.SECRETS?.OPIK,
  hasKey: window.SECRETS?.OPIK?.apiKey ? 'YES' : 'NO',
  enabled: window.SECRETS?.OPIK?.enabled ?? 'no prop',
  trackerLoaded: !!window.opikTracker,
});

// API ключи загружаются из secrets.js (добавлен в .gitignore)
const DEEPGRAM_KEY = window.SECRETS?.DEEPGRAM_API_KEY || '';
const OPENAI_KEY = window.SECRETS?.OPENAI_API_KEY || '';

if (!DEEPGRAM_KEY || !OPENAI_KEY) {
  console.error(
    '❌ API keys not found! Make sure secrets.js exists and contains SECRETS object',
  );
}

// Проверяем конфиги
console.log('📋 LANGUAGE_CONFIG loaded:', !!window.LANGUAGE_CONFIG);
console.log('🎤 VOICE_CONFIG loaded:', !!window.VOICE_CONFIG);
console.log('📊 OPIK tracker loaded:', !!window.opikTracker);
if (!window.opikTracker) {
  console.warn(
    '⚠️ Opik tracker not loaded. Check offscreen.html script order.',
  );
}

let audioStream = null,
  audioContext = null;
let analyser = null,
  gainNode = null,
  playbackContext = null;
let activeSettings = null,
  isRecording = false,
  currentTabId = null;
let speechQueue = [],
  isPlaying = false,
  history = [];

// Накопление транскрипта для Summary
let transcriptHistory = [];
let sessionStartTime = null;

// WebSocket для Deepgram
let deepgramSocket = null;
let mediaRecorder = null;
let workletNode = null;

// Режим работы: 'websocket' (Deepgram live) или 'whisper' (OpenAI batch)
let captureMode = 'websocket';

// --- МЕХАНИЗМ ВЫЖИВАНИЯ (KEEP-ALIVE) ---
setInterval(() => {
  if (isRecording) {
    chrome.runtime
      .sendMessage({ type: 'OFFSCREEN_KEEP_ALIVE' })
      .catch(() => {});
    // Также поддерживаем WebSocket живым
    if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
      deepgramSocket.send(JSON.stringify({ type: 'KeepAlive' }));
    }
  }
}, 10000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎧 Offscreen received:', request.type);

  if (request.type === 'PING') {
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'START_CAPTURE') {
    console.log('🚀 WebSocket LIVE capture starting...');
    initCapture(request.streamId, request.settings, request.tabId)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.type === 'STOP_CAPTURE') {
    stopRecording();
    sendResponse({ success: true });
  }

  if (request.type === 'UPDATE_SETTINGS') {
    console.log('⚙️ Updating settings:', request.settings);
    activeSettings = { ...activeSettings, ...request.settings };
    updateVolume();
    sendResponse({ success: true });
  }

  if (request.type === 'UPDATE_VOLUME') {
    console.log('🔊 Updating volume:', request.settings);
    activeSettings = { ...activeSettings, ...request.settings };
    updateVolume();
    sendResponse({ success: true });
  }

  if (request.type === 'UPDATE_VOICE') {
    console.log('🎤 Updating voice:', request.settings);
    activeSettings = { ...activeSettings, ...request.settings };
    sendResponse({ success: true });
  }

  if (request.type === 'UPDATE_SETTINGS_FROM_POPUP') {
    console.log('📨 Updating settings from popup:', request.settings);
    activeSettings = { ...activeSettings, ...request.settings };
    updateVolume();
    sendResponse({ success: true });
  }

  // === TRANSCRIPT HISTORY ===
  if (request.type === 'GET_TRANSCRIPT') {
    const fullText = transcriptHistory.map((t) => t.translated).join('\n\n');
    const duration = sessionStartTime
      ? Math.round((Date.now() - sessionStartTime) / 60000)
      : 0;
    sendResponse({
      success: true,
      transcript: fullText,
      entries: transcriptHistory.length,
      durationMinutes: duration,
      targetLanguage: activeSettings?.targetLanguage || 'ru',
    });
    return true;
  }

  if (request.type === 'CLEAR_TRANSCRIPT') {
    transcriptHistory = [];
    sessionStartTime = null;
    console.log('🗑️ Transcript history cleared');
    sendResponse({ success: true });
    return true;
  }

  // if (request.type === 'GENERATE_SUMMARY') {
  //   console.log('📝 Generating summary...');
  //   generateSummary(request.text, request.targetLang)
  //     .then((summary) => sendResponse({ success: true, summary }))
  //     .catch((err) => sendResponse({ success: false, error: err.message }));
  //   return true;
  // }

  // СТАЛО:
  if (request.type === 'GENERATE_SUMMARY') {
    console.log('📝 Generating summary...');

    const duration =
      request.durationMinutes ||
      (sessionStartTime
        ? Math.round((Date.now() - sessionStartTime) / 60000)
        : 0);

    generateSummary(request.text, request.targetLang, duration)
      .then((summary) => sendResponse({ success: true, summary }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
  //

  if (request.type === 'CREATE_PDF') {
    console.log('📄 Creating summary file...');
    createPDF(request.summary, request.title, request.duration)
      .then((dataUrl) => sendResponse({ success: true, pdfDataUrl: dataUrl }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  return true;
});

// ============================================================
// WEBSOCKET CONNECTION TO DEEPGRAM
// ============================================================
function connectDeepgramWebSocket(lang) {
  return new Promise((resolve, reject) => {
    const model = 'nova-3';

    // URL с параметрами для минимальной задержки
    const wsUrl =
      `wss://api.deepgram.com/v1/listen?` +
      `model=${model}` +
      `&language=${lang}` +
      `&encoding=linear16` + // PCM 16-bit
      `&sample_rate=16000` + // 16kHz
      `&channels=1` + // Моно
      `&interim_results=true` +
      `&endpointing=1500` + // Определение конца фразы через 300ms тишины
      `&punctuate=true` +
      `&smart_format=true`;

    console.log('🔌 Connecting to Deepgram WebSocket:', wsUrl);

    deepgramSocket = new WebSocket(wsUrl, ['token', DEEPGRAM_KEY]);

    deepgramSocket.onopen = () => {
      console.log('✅ Deepgram WebSocket CONNECTED!');
      resolve();
    };

    deepgramSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Получаем транскрипцию
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        const isFinal = data.is_final;
        const confidence = data.channel?.alternatives?.[0]?.confidence || 0;

        console.log(
          `📝 Deepgram: "${transcript}" (final: ${isFinal}, conf: ${confidence})`,
        );

        // Обрабатываем только финальные результаты с текстом
        if (transcript && transcript.trim().length > 2 && isFinal) {
          console.log('🎯 Final transcript, sending to translate:', transcript);

          // 📊 Opik: логируем STT
          window.opikTracker?.logSTT(transcript, {
            provider: 'deepgram',
            language: lang,
            confidence,
            duration: data.duration,
          });

          translateAndVoice(transcript);
        }
      } catch (e) {
        console.error('❌ Error parsing Deepgram response:', e);
      }
    };

    deepgramSocket.onerror = (error) => {
      console.error('❌ Deepgram WebSocket ERROR:', error);
      reject(error);
    };

    deepgramSocket.onclose = (event) => {
      console.log('📴 Deepgram WebSocket closed:', event.code, event.reason);
      // Автоматическое переподключение если запись активна
      if (isRecording && event.code !== 1000) {
        console.log('🔄 Attempting to reconnect...');
        setTimeout(() => {
          if (isRecording) {
            connectDeepgramWebSocket(
              activeSettings?.sourceLanguage || 'en',
            ).catch(console.error);
          }
        }, 2000);
      }
    };
  });
}

// ============================================================
// MAIN CAPTURE FUNCTION (HYBRID: WebSocket for nova-3, Whisper for he/ar/fa)
// ============================================================
async function initCapture(streamId, settings, tabId) {
  try {
    if (isRecording) stopRecording();

    activeSettings = settings;
    currentTabId = tabId;
    const lang = settings?.sourceLanguage || 'en';

    // Определяем режим на основе конфига языка
    const langConfig = (window.LANGUAGE_CONFIG &&
      window.LANGUAGE_CONFIG[lang]) ||
      window.LANGUAGE_CONFIG?.default || { model: 'nova-3' };

    // Если модель whisper-* — используем batch mode (OpenAI Whisper)
    captureMode = langConfig.model?.startsWith('whisper')
      ? 'whisper'
      : 'websocket';

    console.log(
      `🎤 Starting capture: lang=${lang}, mode=${captureMode}, model=${langConfig.model}`,
    );

    // 1. Захватываем аудио с вкладки
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
    });
    console.log('✅ Audio stream obtained');

    // 2. Настраиваем AudioContext для контроля громкости
    // Для WebSocket нужен 16kHz, для Whisper можно 48kHz (но 16kHz тоже ок)
    const sampleRate = captureMode === 'websocket' ? 16000 : 48000;
    audioContext = new AudioContext({ sampleRate });
    const source = audioContext.createMediaStreamSource(audioStream);
    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();

    source.connect(analyser);
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    isRecording = true;
    updateVolume();

    if (captureMode === 'websocket') {
      // ============ WEBSOCKET MODE (Deepgram Live) ============
      await connectDeepgramWebSocket(lang);
      console.log('✅ Deepgram WebSocket connected');

      // Загружаем AudioWorklet для конвертации в PCM
      await audioContext.audioWorklet.addModule('pcm-processor.js');
      console.log('✅ PCM Processor loaded');

      workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

      // Получаем PCM данные от worklet и отправляем в WebSocket
      workletNode.port.onmessage = (event) => {
        if (
          !isRecording ||
          !deepgramSocket ||
          deepgramSocket.readyState !== WebSocket.OPEN
        ) {
          return;
        }
        deepgramSocket.send(event.data);
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      console.log('✅ WebSocket pipeline ready');
    } else {
      // ============ WHISPER MODE (OpenAI Batch) ============
      console.log('🎙️ Using Whisper mode for', lang);
      startWhisperLoop(langConfig.interval || 5000);
    }

    console.log('✅ Capture started for tab:', tabId);
    return { success: true };
  } catch (e) {
    console.error('❌ Init Error:', e);
    isRecording = false;
    return { success: false, error: e.message };
  }
}

// ============================================================
// WHISPER MODE (Batch processing for Hebrew, Arabic, Persian)
// ============================================================
let lastWhisperText = '';

function startWhisperLoop(interval) {
  if (!isRecording || !audioStream) return;

  console.log(`🎙️ Starting Whisper loop with ${interval}ms interval`);

  mediaRecorder = new MediaRecorder(audioStream, {
    mimeType: 'audio/webm;codecs=opus',
  });
  let chunks = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    if (chunks.length > 0 && isRecording) {
      const blob = new Blob(chunks, { type: 'audio/webm' });

      // Проверка активности звука
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avgVolume = data.reduce((a, b) => a + b) / data.length;

      if (avgVolume > 2) {
        await processWhisperSTT(blob);
      }
    }
    // Продолжаем цикл
    if (isRecording) {
      setTimeout(() => startWhisperLoop(interval), 50);
    }
  };

  mediaRecorder.start();
  setTimeout(() => {
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  }, interval);
}

async function processWhisperSTT(blob) {
  if (!isRecording) return;

  try {
    const lang = activeSettings?.sourceLanguage || 'en';
    console.log(`🎙️ Sending to Whisper (${lang})...`);

    const fd = new FormData();
    fd.append('file', blob, 'audio.webm');
    fd.append('model', 'whisper-1');
    fd.append('language', lang);
    fd.append('response_format', 'json');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: fd,
    });

    const data = await res.json();
    const text = data?.text?.trim();

    if (text && text.length > 2 && text !== lastWhisperText) {
      lastWhisperText = text;
      console.log('🎙️ Whisper transcript:', text);

      // 📊 Opik: логируем Whisper STT
      window.opikTracker?.logSTT(text, {
        provider: 'whisper',
        language: lang,
      });

      translateAndVoice(text);
    }
  } catch (e) {
    console.error('❌ Whisper STT Error:', e);
  }
}

// ============================================================
// TRANSLATION
// ============================================================
// async function translateAndVoice(text) {
//   if (!isRecording || !text?.trim()) return;

//   const startTime = new Date().toISOString();

//   try {
//     const targetLang = activeSettings?.targetLanguage || 'ru';
//     const sourceLang = activeSettings?.sourceLanguage || 'auto';
//     const style = (activeSettings?.translationStyle || 'DEFAULT').toUpperCase();

//     console.log(`🌐 Translating to ${targetLang}:`, text);

//     const prompts = {
//       // DEFAULT: `Translate to ${targetLang} accurately and naturally. Keep original meaning.`,
//       DEFAULT: `You are a professional interpreter. Translate to ${targetLang} for real-time spoken interpretation.Produce translations that sound natural to native speakers. Avoid literal translations.
// When encountering idioms, use equivalent phrases in ${targetLang}.
// Translation should feel like original speech. Please keep previous context in mind.`,

//       KIDS: `Translate to ${targetLang} for a 5-year-old child. Use simple words, fairy tale style. Make it magical and fun!`,
//       // KABBALAH: `Translate to ${targetLang} using Kabbalah concepts. Use kabalistic terminology. Hewbrew words transcription, keep consistancy. Translation ONLY!!!! Do not intrpritate! When encountering idioms, use equivalent phrases in ${targetLang}.`,
//       KABBALAH: `You are a strictly technical translation engine for Kabbalah study. Your task has THREE RULES:
// 1. All Hebrew and Aramaic terms transcription (e.g., "Sefirot", "Tzimtzum", "Ein Sof", "Atika Kadisha", "Zeir Anpin", "Malchut", "Keter", "Chochma", "Binah", "Da'at", "Yesod", "Malkhut") using standard academic Romanization. NEVER translate these terms.
// 2. TRANSLATE all other text accurately to ${targetLang}, maintaining the original sentence structure and formality.
// 3. DO NOT INTERPRET, EXPLAIN, or ADD any commentary, examples, or personal insights. Provide only the direct translation with transliterated terms. Keep all Hebrew and Aramaic words in their original form.`,
//       TECHNICAL: `Technical translation to ${targetLang}. Keep all terms exact (do NOT simplify). Use formal style.`,
//       SLANG: `Translate to ${targetLang} using modern youth slang, memes, casual speech. Sound like a TikTok teen.`,
//       POETIC: `Translate to ${targetLang} poetically. Use metaphors, beautiful language, rhythm. Make it sound like a poem.`,
//     };

//     const res = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           { role: 'system', content: prompts[style] || prompts.DEFAULT },
//           ...history.slice(-24),
//           { role: 'user', content: text },
//         ],
//         temperature: 0.1,
//       }),
//     });

//     const data = await res.json();
//     const translatedText = data?.choices?.[0]?.message?.content;

//     if (!translatedText) {
//       console.error('❌ No translation received');
//       return;
//     }

//     console.log('✅ Translation:', translatedText);

//     // 📊 Opik: логируем перевод
//     window.opikTracker?.logTranslation(text, translatedText, {
//       sourceLang,
//       targetLang,
//       style,
//       mode: captureMode,
//       startTime,
//     });

//     // 📜 Сохраняем в историю для Summary
//     if (!sessionStartTime) sessionStartTime = Date.now();
//     transcriptHistory.push({
//       original: text,
//       translated: translatedText,
//       timestamp: Date.now(),
//     });

//     // Отправка субтитров
//     chrome.runtime
//       .sendMessage({
//         type: 'SUBTITLES_FROM_OFFSCREEN',
//         text: translatedText,
//         tabId: currentTabId,
//       })
//       .catch(() => {});

//     history.push(
//       { role: 'user', content: text },
//       { role: 'assistant', content: translatedText },
//     );
//     if (history.length > 40) history.splice(0, 10);

//     if (activeSettings?.enableVoice) playTTS(translatedText);
//   } catch (e) {
//     console.error('❌ Translation Error:', e);
//   }
// }
// async function translateAndVoice(text) {
//   if (!isRecording || !text?.trim()) return;

//   const startTime = new Date().toISOString();

//   try {
//     const targetLang = activeSettings?.targetLanguage || 'ru';
//     const sourceLang = activeSettings?.sourceLanguage || 'auto';
//     const style = (activeSettings?.translationStyle || 'DEFAULT').toUpperCase();

//     console.log(`🌐 Translating to ${targetLang}:`, text);

//     // ———————————————————————————
//     // 🔹 Системный промпт с контекстом
//     const basePrompt = {
//       DEFAULT: `You are a professional simultaneous interpreter.
// Translate spoken text accurately and naturally.
// Preserve meaning, emotion, and intent.
// Use proper grammar, number, gender, and case in ${targetLang}.
// Sound like a native speaker.
// Previous translations:
// ${transcriptHistory.slice(-5).map(h => `- "${h.original}" → "${h.translated}"`).join('\n')}
// Translate the following text now. Output ONLY the translation. No explanations.`,

//       KIDS: `Translate to ${targetLang} for a 5-year-old child.
// Use very simple words.
// Fairy-tale tone.
// Fun, warm, magical.
// Previous translations:
// ${transcriptHistory.slice(-5).map(h => `- "${h.original}" → "${h.translated}"`).join('\n')}
// Output ONLY the translation.`,

//       KABBALAH: `You are a strictly technical translation engine for Kabbalah study.
// Rules:
// 1. NEVER translate Hebrew or Aramaic terms. Use standard academic Romanization only.
// 2. Translate all other text accurately to ${targetLang}.
// 3. Preserve original structure and formality.
// 4. Do NOT interpret, explain, or add anything.
// 5. Previous translations:
// ${transcriptHistory.slice(-5).map(h => `- "${h.original}" → "${h.translated}"`).join('\n')}
// Output ONLY the translation.`,

//       TECHNICAL: `Technical translation to ${targetLang}.
// Keep all terms exact. Do NOT simplify. Formal style.
// Previous translations:
// ${transcriptHistory.slice(-5).map(h => `- "${h.original}" → "${h.translated}"`).join('\n')}
// Output ONLY the translation.`,

//       SLANG: `Translate to ${targetLang} using modern youth slang.
// Casual, meme-aware, TikTok-style.
// Previous translations:
// ${transcriptHistory.slice(-5).map(h => `- "${h.original}" → "${h.translated}"`).join('\n')}
// Output ONLY the translation.`,

//       POETIC: `Translate to ${targetLang} poetically.
// Use rhythm, metaphors, expressive language.
// Sound like original poetry.
// Previous translations:
// ${transcriptHistory.slice(-5).map(h => `- "${h.original}" → "${h.translated}"`).join('\n')}
// Output ONLY the translation.`,
//     };

//     // ———————————————————————————
//     const res = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           { role: 'system', content: basePrompt[style] || basePrompt.DEFAULT },
//           ...history.slice(-24),
//           { role: 'user', content: text },
//         ],
//         temperature: style === 'TECHNICAL' || style === 'KABBALAH' ? 0.1 : 0.35,
//         top_p: 0.9,
//       }),
//     });

//     const data = await res.json();
//     const translatedText = data?.choices?.[0]?.message?.content;

//     if (!translatedText) {
//       console.error('❌ No translation received');
//       return;
//     }

//     console.log('✅ Translation:', translatedText);

//     // 📊 Логируем перевод
//     window.opikTracker?.logTranslation(text, translatedText, {
//       sourceLang,
//       targetLang,
//       style,
//       mode: captureMode,
//       startTime,
//     });

//     // 📜 Сохраняем в историю для summary
//     if (!sessionStartTime) sessionStartTime = Date.now();
//     transcriptHistory.push({
//       original: text,
//       translated: translatedText,
//       timestamp: Date.now(),
//     });

//     // Отправка субтитров
//     chrome.runtime.sendMessage({
//       type: 'SUBTITLES_FROM_OFFSCREEN',
//       text: translatedText,
//       tabId: currentTabId,
//     }).catch(() => {});

//     // Обновляем историю (для UI, но не для mini)
//     history.push(
//       { role: 'user', content: text },
//       { role: 'assistant', content: translatedText },
//     );
//     if (history.length > 40) history.splice(0, 10);

//     // Воспроизведение голоса
//     if (activeSettings?.enableVoice) playTTS(translatedText);

//   } catch (e) {
//     console.error('❌ Translation Error:', e);
//   }
// }

// ============================================================
// TTS
// ============================================================
async function translateAndVoice(text) {
  if (!isRecording || !text?.trim()) return;

  const startTime = new Date().toISOString();

  try {
    const targetLang = activeSettings?.targetLanguage || 'ru';
    const sourceLang = activeSettings?.sourceLanguage || 'auto';
    const style = (activeSettings?.translationStyle || 'DEFAULT').toUpperCase();

    console.log(`🌐 Translating to ${targetLang}:`, text);

    const prompts = {
      DEFAULT: `You are a professional simultaneous interpreter for live speech.

TRANSLATION PRINCIPLES for ${targetLang}:
1. **MEANING OVER WORDS** - Convey the meaning, don't translate words literally
2. **GRAMMAR NATIVE** - Use natural ${targetLang} grammar structures
3. **SPOKEN LANGUAGE** - Optimize for oral delivery, not written text
4. **CONTEXT AWARE** - Consider conversation flow and previous dialogue
5. **NATURAL FLOW** - Make it sound like original speech in ${targetLang}`,

      KIDS: `Translate to ${targetLang} for a 5-year-old child. Use simple words, fairy tale style. Make it magical and fun!`,
      KABBALAH: `You are a strictly technical translation engine for Kabbalah study. Translate context usinh kabbalistic terminology
//       Your task has THREE RULES:
// 1. All Hebrew and Aramaic terms transcription (e.g., "Sefirot", "Tzimtzum", "Ein Sof", "Atika Kadisha", "Zeir Anpin", "Malchut", "Keter", "Chochma", "Binah", "Da'at", "Yesod", "Malkhut") using ${targetLang} literation. NEVER translate these terms.
// 2. TRANSLATE all other text accurately to ${targetLang}, maintaining the original sentence structure and formality.
// 3. DO NOT INTERPRET, EXPLAIN, or ADD any commentary, examples, or personal insights. Provide only the direct translation with transliterated terms.`,
      TECHNICAL: `Technical translation to ${targetLang}. Keep all terms exact (do NOT simplify). Use formal style.`,
      SLANG: `Translate to ${targetLang} using modern youth slang, memes, casual speech. Sound like a TikTok teen.`,
      POETIC: `Translate to ${targetLang} poetically. Use metaphors, beautiful language, rhythm. Make it sound like a poem.`,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompts[style] || prompts.DEFAULT },
          ...history.slice(-24),
          { role: 'user', content: text },
        ],
        temperature: style === 'TECHNICAL' || style === 'KABBALAH' ? 0.1 : 0.35,
        top_p: 0.9,
      }),
    });

    const data = await res.json();
    const translatedText = data?.choices?.[0]?.message?.content;

    if (!translatedText) {
      console.error('❌ No translation received');
      return;
    }

    console.log('✅ Translation:', translatedText);

    // 📊 Opik: логируем перевод
    window.opikTracker?.logTranslation(text, translatedText, {
      sourceLang,
      targetLang,
      style,
      mode: captureMode,
      startTime,
    });

    // 📜 Сохраняем в историю для Summary
    if (!sessionStartTime) sessionStartTime = Date.now();
    transcriptHistory.push({
      original: text,
      translated: translatedText,
      timestamp: Date.now(),
    });

    // Отправка субтитров
    chrome.runtime
      .sendMessage({
        type: 'SUBTITLES_FROM_OFFSCREEN',
        text: translatedText,
        tabId: currentTabId,
      })
      .catch(() => {});

    history.push(
      { role: 'user', content: text },
      { role: 'assistant', content: translatedText },
    );
    if (history.length > 40) history.splice(0, 10);

    if (activeSettings?.enableVoice) playTTS(translatedText);
  } catch (e) {
    console.error('❌ Translation Error:', e);
  }
}

async function playTTS(text) {
  if (!isRecording || !text?.trim()) return;

  const startTime = new Date().toISOString();

  try {
    const voiceKey = activeSettings?.voiceGender || 'neutral';
    const voice =
      (window.VOICE_CONFIG && window.VOICE_CONFIG[voiceKey]) || 'nova';
    console.log(`🎭 TTS with voice: ${voiceKey} -> ${voice}`);

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, speed: 1.05 }),
    });

    const buffer = await res.arrayBuffer();
    if (!playbackContext) playbackContext = new AudioContext();

    const audioBuffer = await playbackContext.decodeAudioData(buffer);
    speechQueue.push(audioBuffer);
    if (!isPlaying) handleQueue();

    // 📊 Opik: логируем TTS
    window.opikTracker?.logTTS(text, { voice, speed: 1.05, startTime });
  } catch (e) {
    console.error('TTS Error:', e);
  }
}

function handleQueue() {
  if (!speechQueue.length || !isRecording) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const source = playbackContext.createBufferSource();
  source.buffer = speechQueue.shift();
  source.connect(playbackContext.destination);
  source.onended = handleQueue;
  source.start(0);

  if (playbackContext.state === 'suspended') playbackContext.resume();
}

// ============================================================
// VOLUME CONTROL
// ============================================================
function updateVolume() {
  if (!gainNode || !audioContext) {
    console.log('🔇 Volume update skipped - no audio context');
    return;
  }
  const vol = activeSettings?.muteOriginal
    ? 0
    : activeSettings?.originalVolume || 1;
  console.log(
    '🔊 Setting volume to:',
    vol,
    'mute:',
    activeSettings?.muteOriginal,
  );
  gainNode.gain.setTargetAtTime(vol, audioContext.currentTime, 0.1);
}

// ============================================================
// PDF GENERATION (через Canvas для поддержки Unicode)
// ============================================================
function createPDF(summaryText, title = 'Video Summary', durationMinutes = 0) {
  return new Promise((resolve) => {
    const { jsPDF } = window.jspdf;

    // Создаём canvas для рендеринга текста
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Размеры страницы A4 в пикселях (72 DPI)
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 18;
    const fontSize = 12;
    const titleFontSize = 20;

    canvas.width = pageWidth;
    canvas.height = pageHeight;

    // Функция для разбиения текста на строки
    function wrapText(text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      ctx.font = `${fontSize}px Arial, sans-serif`;

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    // Разбиваем весь текст на параграфы и строки
    const paragraphs = summaryText.split('\n');
    const allLines = [];

    for (const para of paragraphs) {
      if (para.trim() === '') {
        allLines.push({ text: '', isBold: false, isTitle: false });
      } else {
        const isBold = para.includes('**');
        const cleanPara = para.replace(/\*\*/g, '');
        const wrapped = wrapText(cleanPara, contentWidth);
        for (const line of wrapped) {
          allLines.push({ text: line, isBold, isTitle: false });
        }
      }
    }

    // Создаём PDF
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pages = [];
    let currentPage = [];
    let y = margin + titleFontSize + 40; // После заголовка

    // Добавляем заголовок на первую страницу
    currentPage.push({ text: title, y: margin + titleFontSize, isTitle: true });

    // Дата
    const dateStr = new Date().toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    currentPage.push({
      text: dateStr + (durationMinutes > 0 ? ` • ${durationMinutes} мин` : ''),
      y: margin + titleFontSize + 20,
      isMeta: true,
    });

    y = margin + titleFontSize + 50;

    for (const line of allLines) {
      if (y + lineHeight > pageHeight - margin) {
        pages.push(currentPage);
        currentPage = [];
        y = margin;
      }
      currentPage.push({ ...line, y });
      y += lineHeight;
    }
    if (currentPage.length > 0) pages.push(currentPage);

    // Рендерим каждую страницу
    for (let p = 0; p < pages.length; p++) {
      if (p > 0) doc.addPage();

      // Белый фон
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageWidth, pageHeight);

      for (const item of pages[p]) {
        if (item.isTitle) {
          ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
          ctx.fillStyle = '#1e40af';
          ctx.textAlign = 'center';
          ctx.fillText(item.text, pageWidth / 2, item.y);
        } else if (item.isMeta) {
          ctx.font = `${fontSize - 2}px Arial, sans-serif`;
          ctx.fillStyle = '#666666';
          ctx.textAlign = 'center';
          ctx.fillText(item.text, pageWidth / 2, item.y);
        } else {
          ctx.font = item.isBold
            ? `bold ${fontSize}px Arial, sans-serif`
            : `${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = item.isBold ? '#1e40af' : '#333333';
          ctx.textAlign = 'left';
          ctx.fillText(item.text, margin, item.y);
        }
      }

      // Добавляем canvas как изображение в PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth * 0.75, pageHeight * 0.75);
    }

    resolve(doc.output('dataurlstring'));
  });
}

// ============================================================
// SUMMARY GENERATION
// ============================================================
// async function generateSummary(text, targetLang = 'ru') {
//   if (!text || text.trim().length < 100) {
//     throw new Error('Not enough text for summary');
//   }

//   console.log(
//     `📝 Generating summary in ${targetLang}, text length: ${text.length}`,
//   );

//   const langNames = {
//     ru: 'Russian',
//     en: 'English',
//     he: 'Hebrew',
//     es: 'Spanish',
//     fr: 'French',
//     de: 'German',
//     it: 'Italian',
//     pt: 'Portuguese',
//     zh: 'Chinese',
//     ja: 'Japanese',
//     ko: 'Korean',
//     ar: 'Arabic',
//   };

//   const langName = langNames[targetLang] || targetLang;

//   const systemPrompt = `You are an expert summarizer. Create a comprehensive summary in ${langName}.

// Structure your summary as follows:
// 1. **Overview** (2-3 sentences about the main topic)
// 2. **Key Points** (bullet points of the most important information)
// 3. **Main Topics Discussed** (detailed breakdown of topics)
// 4. **Notable Quotes or Statements** (if any memorable phrases)
// 5. **Conclusions** (main takeaways)

// The summary should be 1-2 pages when printed. Be thorough but concise.
// Write ONLY in ${langName}.`;

//   try {
//     const res = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: `Summarize this transcript:\n\n${text}` },
//         ],
//         temperature: 0.1,
//         max_tokens: 2000,
//       }),
//     });

//     const data = await res.json();
//     const summary = data?.choices?.[0]?.message?.content;

//     if (!summary) {
//       throw new Error('No summary generated');
//     }

//     console.log('✅ Summary generated, length:', summary.length);
//     return summary;
//   } catch (e) {
//     console.error('❌ Summary generation error:', e);
//     throw e;
//   }
// }

// ============================================================
// SUMMARY GENERATION WITH SELF-CHECK QUESTIONS
// ============================================================
async function generateSummary(text, targetLang = 'ru', durationMinutes = 0) {
  if (!text || text.trim().length < 100) {
    throw new Error('Not enough text for summary');
  }

  console.log(
    `📝 Generating summary in ${targetLang}, text length: ${text.length}, duration: ${durationMinutes} min`,
  );

  const langNames = {
    ru: 'Russian',
    en: 'English',
    he: 'Hebrew',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
  };

  const langName = langNames[targetLang] || targetLang;

  // Определяем количество вопросов на основе длительности
  let numQuestions = 3; // По умолчанию 3 вопроса
  if (durationMinutes <= 3) {
    numQuestions = 1;
  } else if (durationMinutes <= 10) {
    numQuestions = 2;
  }
  // Для видео 60-120 минут всё равно 3 вопроса (как указано в ТЗ)

  const systemPrompt = `You are an expert summarizer and educator. Create a comprehensive summary in ${langName}.

Structure your summary as follows:
1. **Overview** (2-3 sentences about the main topic)
2. **Key Points** (bullet points of the most important information)
3. **Main Topics Discussed** (detailed breakdown of topics)
4. **Notable Quotes or Statements** (if any memorable phrases)
5. **Conclusions** (main takeaways)
6. **Self-Check Questions** (exactly ${numQuestions} ${numQuestions === 1 ? 'question' : 'questions'} for self-assessment and learning)

For the Self-Check Questions section:
- Create EXACTLY ${numQuestions} thought-provoking ${numQuestions === 1 ? 'question' : 'questions'} based on the video content
- Questions should test understanding of KEY CONCEPTS from the video
- Make questions challenging but fair
- Format: "**Question ${numQuestions === 1 ? '1' : '1-' + numQuestions}:**" followed by the question
- Do NOT provide answers - these are for self-reflection

The summary should be 1-2 pages when printed. Be thorough but concise.
Write ONLY in ${langName}.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Video duration: ${durationMinutes} minutes\n\nSummarize this transcript and create ${numQuestions} self-check ${numQuestions === 1 ? 'question' : 'questions'}:\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    const data = await res.json();
    const summary = data?.choices?.[0]?.message?.content;

    if (!summary) {
      throw new Error('No summary generated');
    }

    console.log('✅ Summary with questions generated, length:', summary.length);
    return summary;
  } catch (e) {
    console.error('❌ Summary generation error:', e);
    throw e;
  }
}

// ============================================================
// STOP
// ============================================================
function stopRecording() {
  console.log('🛑 Stopping recording...');
  isRecording = false;
  isPlaying = false;
  speechQueue = [];
  history = [];
  lastWhisperText = '';

  // Закрываем WebSocket (если был)
  if (deepgramSocket) {
    deepgramSocket.close(1000, 'User stopped');
    deepgramSocket = null;
  }

  // Отключаем worklet (если был)
  if (workletNode) {
    workletNode.disconnect();
    workletNode = null;
  }

  if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop();
  mediaRecorder = null;

  if (audioStream) audioStream.getTracks().forEach((t) => t.stop());
  if (audioContext) audioContext.close().catch(() => {});
  if (playbackContext) playbackContext.close().catch(() => {});

  audioContext = null;
  playbackContext = null;
  audioStream = null;
  captureMode = 'websocket';

  console.log('✅ Recording stopped');
}
