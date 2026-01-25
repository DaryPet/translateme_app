// Глобальные конфиги для языков (доступны в window.LANGUAGE_CONFIG и window.VOICE_CONFIG)
window.LANGUAGE_CONFIG = {
  // --- Whisper (Семитские и сложные языки для Live) ---
  'he': { name: 'Hebrew', model: 'whisper-large', interval: 10000 },
  'ar': { name: 'Arabic', model: 'whisper-large', interval: 10000},
  'fa': { name: 'Persian', model: 'whisper-large', interval: 10000},

  // --- NOVA-3 (Официальный список из документации) ---
  'bg': { name: 'Bulgarian', model: 'nova-3', interval: 100 },
  'ca': { name: 'Catalan', model: 'nova-3', interval: 100 },
  'cs': { name: 'Czech', model: 'nova-3', interval: 100 },
  'da': { name: 'Danish', model: 'nova-3', interval: 100 },
  'de': { name: 'German', model: 'nova-3', interval: 100 },
  'el': { name: 'Greek', model: 'nova-3', interval: 100 },
  'en': { name: 'English (US)', model: 'nova-3', interval: 100 },
  'en-AU': { name: 'English (Australia)', model: 'nova-3', interval:100 },
  'en-GB': { name: 'English (UK)', model: 'nova-3', interval: 100 },
  'en-IN': { name: 'English (India)', model: 'nova-3', interval: 100 },
  'en-NZ': { name: 'English (New Zealand)', model: 'nova-3', interval: 100 },
  'es': { name: 'Spanish', model: 'nova-3', interval: 100 },
  'es-419': { name: 'Spanish (LatAm)', model: 'nova-3', interval: 100 },
  'et': { name: 'Estonian', model: 'nova-3', interval: 100 },
  'fi': { name: 'Finnish', model: 'nova-3', interval: 100 },
  'fr': { name: 'French', model: 'nova-3', interval: 100 },
  'hi': { name: 'Hindi', model: 'nova-3', interval: 100 },
  'hr': { name: 'Croatian', model: 'nova-3', interval: 100 },
  'hu': { name: 'Hungarian', model: 'nova-3', interval: 100 },
  'id': { name: 'Indonesian', model: 'nova-3', interval: 100 },
  'it': { name: 'Italian', model: 'nova-3', interval: 100 },
  'ja': { name: 'Japanese', model: 'nova-3', interval: 100 },
  'kn': { name: 'Kannada', model: 'nova-3', interval: 100 },
  'ko': { name: 'Korean', model: 'nova-3', interval: 100 },
  'lt': { name: 'Lithuanian', model: 'nova-3', interval: 100 },
  'lv': { name: 'Latvian', model: 'nova-3', interval: 100 },
  'mr': { name: 'Marathi', model: 'nova-3', interval: 100 },
  'ms': { name: 'Malay', model: 'nova-3', interval: 100 },
  'nl': { name: 'Dutch', model: 'nova-3', interval: 100 },
  'no': { name: 'Norwegian', model: 'nova-3', interval:100 },
  'pl': { name: 'Polish', model: 'nova-3', interval: 100 },
  'pt': { name: 'Portuguese', model: 'nova-3', interval: 100 },
  'pt-BR': { name: 'Portuguese (Brazil)', model: 'nova-3', interval: 100 },
  'ro': { name: 'Romanian', model: 'nova-3', interval: 100 },
  'ru': { name: 'Russian', model: 'nova-3', interval: 100 },
  'sk': { name: 'Slovak', model: 'nova-3', interval: 100 },
  'sl': { name: 'Slovenian', model: 'nova-3', interval: 100 },
  'sv': { name: 'Swedish', model: 'nova-3', interval: 100 },
  'ta': { name: 'Tamil', model: 'nova-3', interval: 100 },
  'te': { name: 'Telugu', model: 'nova-3', interval: 100 },
  'th': { name: 'Thai', model: 'nova-3', interval: 100 },
  'tr': { name: 'Turkish', model: 'nova-3', interval: 100 },
  'uk': { name: 'Ukrainian', model: 'nova-3', interval: 100 },
  'vi': { name: 'Vietnamese', model: 'nova-3', interval: 100 },
  'zh': { name: 'Chinese (Simplified)', model: 'nova-3', interval: 100 },
  'zh-TW': { name: 'Chinese (Traditional)', model: 'nova-3', interval: 100 },

  'default': { name: 'Auto', model: 'nova-3', interval: 100 }
};

window.VOICE_CONFIG = {
  male: 'onyx',
  female: 'shimmer',
  neutral: 'nova',
  auto: 'alloy'
};