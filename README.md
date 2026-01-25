# Translateme 🌐

Translateme is a powerful Chrome extension and web platform designed for real-time video translation, voice dubbing, and AI-driven content analysis.

## 🚀 Key Features

### 🧩 Chrome Extension
- **Live Translation**: Real-time speech-to-text and translation for any video content (YouTube, Vimeo, Coursera, etc.).
- **Voice Dubbing**: High-quality AI voiceovers using OpenAI TTS.
- **Smart Subtitles**: Dynamic subtitle overlay that works perfectly in fullscreen mode and within iframes.
- **AI Video Summary**: Generate a concise 1-2 page summary of any video and download it as a professional PDF.
- **Dual AI Engines**: Support for both OpenAI (Whisper, GPT-4, TTS) and Google Gemini for flexibility and fallback.
- **Low Latency**: Optimized audio processing using Audio Worklet API for minimal delay.

### 🌐 Web Platform (Next.js)
- **Subscription Management**: Full-featured billing system integrated with Stripe.
- **Landing Page**: Modern, responsive UI with internationalization (i18n) support.
- **User Dashboard**: Manage translations, credits, and subscription status.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Material UI (MUI), Tailwind CSS.
- **Extension**: Vanilla JS, Chrome Extension Manifest V3, Audio Worklet API.
- **AI/LLM**: OpenAI (GPT-4o-mini, TTS-1), Google Gemini (2.5 Flash), Deepgram (Live STT).
- **Monitoring**: Opik (Comet) for LLM trace monitoring and analytics.
- **Backend/Auth**: Supabase.
- **Payments**: Stripe.

## 📦 Installation

### Chrome Extension (Manual Load)
1. Clone the repository.
2. Go to `chrome://extensions/` in your browser.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the `extension/` folder.


## 📊 Monitoring
We use **Opik** for real-time tracking of AI performance. It monitors:
- Speech-to-text accuracy and duration.
- Translation latency and token usage.
- TTS generation costs.
- Trace IDs (UUID v7) for deep debugging.

## 📄 License
All rights reserved. 2026 Translateme Team.
