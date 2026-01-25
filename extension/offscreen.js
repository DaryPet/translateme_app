// ============================================================
// DEEPGRAM WEBSOCKET LIVE STREAMING VERSION
// ============================================================
console.log('=== OFFSCREEN.JS STARTED - WEBSOCKET LIVE MODE ===');

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
      `&endpointing=300` + // Определение конца фразы через 300ms тишины
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
      translateAndVoice(text);
    }
  } catch (e) {
    console.error('❌ Whisper STT Error:', e);
  }
}

// ============================================================
// TRANSLATION
// ============================================================
async function translateAndVoice(text) {
  if (!isRecording || !text?.trim()) return;

  try {
    const targetLang = activeSettings?.targetLanguage || 'ru';
    const style = (activeSettings?.translationStyle || 'DEFAULT').toUpperCase();

    console.log(`🌐 Translating to ${targetLang}:`, text);

    const prompts = {
      // DEFAULT: `Professional interpreter. Translate to ${targetLang}. Natural spoken style. ONLY translation.`,
      // KABBALAH: `Translate to ${targetLang}. Use Kabbalah terms (Light, Vessel, Screen). ONLY translation.`,
      // KIDS: `Translate to ${targetLang} as a fairy tale. Simple words. ONLY translation.`
      DEFAULT: `Translate to ${targetLang} accurately and naturally. Keep original meaning.`,
      KIDS: `Translate to ${targetLang} for a 5-year-old child. Use simple words, fairy tale style. Make it magical and fun!`,
      KABBALAH: `Translate to ${targetLang} using Kabbalah concepts.  Use Kabbalah terms (Light, Vessel, Screen). ONLY translation.`,
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
          ...history.slice(-6),
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      }),
    });

    const data = await res.json();
    const translatedText = data?.choices?.[0]?.message?.content;

    if (!translatedText) {
      console.error('❌ No translation received');
      return;
    }

    console.log('✅ Translation:', translatedText);

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
    if (history.length > 12) history.splice(0, 2);

    if (activeSettings?.enableVoice) playTTS(translatedText);
  } catch (e) {
    console.error('❌ Translation Error:', e);
  }
}

// ============================================================
// TTS
// ============================================================
async function playTTS(text) {
  if (!isRecording || !text?.trim()) return;

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
