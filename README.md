# Translateme

Chrome extension and web platform for **real-time video translation**: subtitles, voice dubbing, summary PDF, and minute tracking via the database.

---

## Extension capabilities

### Real-time translation and voice dubbing
- **Live translation** — speech from the tab (YouTube, Vimeo, Coursera, any site with video) is recognized and translated on the fly.
- **Voice dubbing (TTS)** — translated text is spoken with OpenAI voices (male / female / neutral). You can mute the original and listen only to the translation.
- **Volume control** — separate slider for original and translation volume.

### Subtitles
- Subtitles overlay the video, including **fullscreen mode** and inside **iframes** (Vimeo, embedded players).
- Display at the bottom center; works on any site with video.

### Video summary (Summary PDF)
- Accumulated translated text over the session.
- **Summary PDF** button — generates a short summary (1–2 pages) via GPT and **downloads a PDF** with Cyrillic and any language support.

### Minutes and database
- Minute balance is fetched from the backend (API on Vercel), not only from local storage.
- Guests: free minute limit; logged-in users — paid minutes from the DB (Supabase).
- Minutes are deducted when recording translation (POST to `/api/minutes`).

### Floating panel (OPEN_UI)
- Clicking the extension icon on the page opens a floating panel with the settings iframe (same as popup), aligned to the right edge of the screen.

---

## Translation styles

In settings you can choose a **translation style** — it sets the system prompt for the model (GPT-4o-mini):

| Style | Description |
|-------|-------------|
| **Default (Natural Speech)** | Professional simultaneous interpretation: natural speech, meaning over literal wording, correct grammar in the target language. |
| **Kids** | Simple language, fairy-tale tone, for children ~5 years old. |
| **Kabbalah** | Strict technical translation for Kabbalistic texts: terms (Hebrew/Aramaic) are transliterated, the rest translated without interpretation. |
| **Scientific** | Technical/scientific style: exact terms, formal language, no simplification. |
| **Children** | “For children” variant, simple wording. |

The code also includes **Slang** (youth slang, memes) and **Poetic** (poetic translation) styles — they can be enabled in the UI if needed.

---

## Languages

### Popular and fast (Deepgram Nova-3, WebSocket)
Real-time recognition with minimal latency:

- **English** (US, UK, Australia, India, New Zealand)  
- **Russian, Ukrainian**  
- **German, French, Spanish** (incl. LatAm), **Italian, Portuguese** (and Brazilian)  
- **Chinese** (Simplified and Traditional), **Japanese, Korean**  
- **Hindi, Turkish, Polish, Dutch, Swedish, Finnish, Norwegian, Danish**  
- **Vietnamese, Thai, Indonesian, Malay**  
- **Greek, Czech, Hungarian, Romanian, Bulgarian, Croatian, Slovenian, Slovak**  
- **Estonian, Latvian, Lithuanian**  
- **Kannada, Marathi, Tamil, Telugu**  
- **Catalan**  
- **Auto (default)** — language detected by the model.

### Complex / Semitic (OpenAI Whisper, batch)
For better recognition quality for Hebrew, Arabic, and Persian, **Whisper** is used (batch processing at intervals) instead of streaming WebSocket:

- **Hebrew (he)**  
- **Arabic (ar)**  
- **Persian (fa)**  

Config: `extension/langConfig.js` — for `he`, `ar`, `fa` the `model: 'whisper-large'` and interval (e.g. 10000 ms) are set.

---

## Technologies (speed and accuracy)

- **Speech recognition (STT)**  
  - **Deepgram Nova-3** over WebSocket — main mode: fastest streaming recognition, low latency.  
  - **OpenAI Whisper** — for Hebrew, Arabic, Persian, where streaming models are weaker.

- **Translation**  
  - **OpenAI GPT-4o-mini** — fast and cost-effective model, suitable for live translation and all styles (incl. Kabbalah, Technical, Kids).

- **Voice (TTS)**  
  - **OpenAI TTS-1**, voices: **Nova** (neutral), **Shimmer** (female), **Onyx** (male), **Alloy** (auto).

- **Audio in the extension**  
  - **Audio Worklet API** (PCM 16 kHz, mono) to send the stream to Deepgram with minimal delay.  
  - Tab capture → AudioContext → Worklet → WebSocket.

- **Monitoring**  
  - **Opik (Comet)** — traces for translation, STT and TTS (duration, input/output length, etc.), UUID v7.

---

## Project stack

- **Extension**: Chrome Manifest V3, Vanilla JS, Audio Worklet, Offscreen Document.
- **Backend / minutes**: Next.js API Routes, Supabase (users, minutes), Stripe (subscriptions).
- **Site frontend**: Next.js, React, i18n, PWA.

---

## Extension installation

1. Clone the repository.
2. Create `extension/secrets.js` (from `secrets.example.js`): OpenAI, Deepgram, and optionally Opik keys.
3. In Chrome: `chrome://extensions/` → “Developer mode” → “Load unpacked” → select the `extension/` folder.

The extension calls the minutes API at `API_BASE_URL` (in code: `https://translateme-app.vercel.app`). For local development you can override the URL in `extension/background.js`.

---

## Language and voice configuration

- **Languages**: `extension/langConfig.js` — `LANGUAGE_CONFIG` (language codes, model nova-3 or whisper-large, interval).
- **TTS voices**: same file — `VOICE_CONFIG` (male, female, neutral, auto → OpenAI voice names).
- **Translation style prompts**: `extension/offscreen.js`, `prompts` object inside the translation function (DEFAULT, KIDS, KABBALAH, TECHNICAL, SLANG, POETIC).

---

## License

© 2026 Translateme. All rights reserved.
