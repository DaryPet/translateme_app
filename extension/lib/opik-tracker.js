// 📁 lib/opik-tracker.js
// Opik трекер для мониторинга LLM вызовов

class OpikTracker {
  constructor() {
    // Конфиг берётся из window.SECRETS (загружается из secrets.js)
    this.enabled = false;
    this.apiKey = '';
    this.workspaceName = '';
    this.projectName = 'translateme';
    this.baseUrl = 'https://www.comet.com/opik/api/v1/private';
    
    // Инициализация после загрузки secrets.js
    this.init();
  }
  
  init() {
    // Получаем конфиг из secrets
    const opikConfig = window.SECRETS?.OPIK;
    if (opikConfig?.apiKey) {
      this.enabled = opikConfig.enabled !== false;
      this.apiKey = opikConfig.apiKey;
      this.workspaceName = opikConfig.workspaceName || '';
      this.projectName = opikConfig.projectName || 'translateme';
      const maskedKey =
        this.apiKey.length > 6
          ? `${this.apiKey.slice(0, 3)}...${this.apiKey.slice(-3)}`
          : '***';
      console.log('📊 Opik tracker initialized:', this.enabled ? 'ENABLED' : 'DISABLED');
      console.log('📊 Opik config:', {
        projectName: this.projectName,
        workspaceName: this.workspaceName || '(default)',
        apiKey: maskedKey,
        baseUrl: this.baseUrl,
      });
    } else {
      console.log('📊 Opik tracker: No API key found, logging to console only');
    }
  }

  // Логирование перевода
  async logTranslation(original, translated, metadata = {}) {
    const endTime = new Date();
    const startTime = metadata.startTime ? new Date(metadata.startTime) : endTime;
    const durationMs = endTime - startTime;
    
    const logData = {
      original: original?.substring(0, 100) + (original?.length > 100 ? '...' : ''),
      translated: translated?.substring(0, 100) + (translated?.length > 100 ? '...' : ''),
      duration_ms: durationMs,
      ...metadata,
      timestamp: endTime.toISOString()
    };
    
    // Всегда логируем в консоль
    console.log('📊 [Opik] Translation:', logData);
    
    if (!this.enabled || !this.apiKey) return;

    try {
      const traceId = this.generateId();
      console.log('📊 [Opik] Sending translation trace:', {
        traceId,
        duration_ms: durationMs,
        projectName: this.projectName,
      });
      
      const response = await fetch(`${this.baseUrl}/traces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.workspaceName && { 'Comet-Workspace': this.workspaceName })
        },
        body: JSON.stringify({
          id: traceId,
          name: 'translation',
          input: { text: original },
          output: { translation: translated },
          project_name: this.projectName,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          metadata: {
            source_lang: metadata.sourceLang || 'auto',
            target_lang: metadata.targetLang || 'unknown',
            style: metadata.style || 'default',
            mode: metadata.mode || 'websocket',
            duration_ms: durationMs,
            input_length: original?.length || 0,
            output_length: translated?.length || 0
          }
        })
      });
      
      console.log('📊 [Opik] Translation response:', {
        traceId,
        status: response.status,
        ok: response.ok,
        duration_ms: durationMs
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn('⚠️ Opik translation error body:', errorText);
      }
    } catch (error) {
      console.warn('⚠️ Opik error:', error.message);
    }
  }

  // Логирование STT (speech-to-text)
  async logSTT(transcript, metadata = {}) {
    const endTime = new Date();
    const startTime = metadata.startTime ? new Date(metadata.startTime) : endTime;
    const durationMs = endTime - startTime;
    
    console.log('📊 [Opik] STT:', {
      transcript: transcript?.substring(0, 50),
      provider: metadata.provider,
      confidence: metadata.confidence,
      duration_ms: durationMs
    });
    
    if (!this.enabled || !this.apiKey) return;

    try {
      const traceId = this.generateId();
      console.log('📊 [Opik] Sending STT trace:', {
        traceId,
        duration_ms: durationMs,
        projectName: this.projectName,
      });

      const response = await fetch(`${this.baseUrl}/traces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.workspaceName && { 'Comet-Workspace': this.workspaceName })
        },
        body: JSON.stringify({
          id: traceId,
          name: 'stt',
          input: { audio_duration_ms: metadata.audioDuration },
          output: { transcript },
          project_name: this.projectName,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          metadata: {
            provider: metadata.provider || 'deepgram',
            language: metadata.language || 'auto',
            confidence: metadata.confidence,
            duration_ms: durationMs,
            transcript_length: transcript?.length || 0
          }
        })
      });
      console.log('📊 [Opik] STT response:', {
        traceId,
        status: response.status,
        ok: response.ok,
        duration_ms: durationMs
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn('⚠️ Opik STT error body:', errorText);
      }
    } catch (error) {
      console.warn('⚠️ Opik STT error:', error.message);
    }
  }

  // Логирование TTS (text-to-speech)
  async logTTS(text, metadata = {}) {
    const endTime = new Date();
    const startTime = metadata.startTime ? new Date(metadata.startTime) : endTime;
    const durationMs = endTime - startTime;
    
    console.log('📊 [Opik] TTS:', {
      text: text?.substring(0, 50),
      voice: metadata.voice,
      duration_ms: durationMs
    });
    
    if (!this.enabled || !this.apiKey) return;

    try {
      const traceId = this.generateId();
      console.log('📊 [Opik] Sending TTS trace:', {
        traceId,
        duration_ms: durationMs,
        projectName: this.projectName,
      });

      const response = await fetch(`${this.baseUrl}/traces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.workspaceName && { 'Comet-Workspace': this.workspaceName })
        },
        body: JSON.stringify({
          id: traceId,
          name: 'tts',
          input: { text },
          output: { audio_generated: true },
          project_name: this.projectName,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          metadata: {
            voice: metadata.voice || 'nova',
            speed: metadata.speed || 1.0,
            duration_ms: durationMs,
            text_length: text?.length || 0
          }
        })
      });
      console.log('📊 [Opik] TTS response:', {
        traceId,
        status: response.status,
        ok: response.ok,
        duration_ms: durationMs
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn('⚠️ Opik TTS error body:', errorText);
      }
    } catch (error) {
      console.warn('⚠️ Opik TTS error:', error.message);
    }
  }

  generateId() {
    // Opik требует UUID версии 7 (time-based)
    // Формат: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
    // Первые 48 бит = timestamp в миллисекундах
    const timestamp = Date.now();
    const timestampHex = timestamp.toString(16).padStart(12, '0');
    
    // Генерируем случайные байты
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const randomBytes = (n) => Array(n).fill(0).map(randomHex).join('');
    
    // UUID v7: timestamp (48 bits) + version (4 bits) + random (12 bits) + variant (2 bits) + random (62 bits)
    const uuid = [
      timestampHex.slice(0, 8),                           // 8 hex chars (32 bits of timestamp)
      timestampHex.slice(8, 12) + randomBytes(0),         // 4 hex chars (16 bits of timestamp)
      '7' + randomBytes(3),                               // version 7 + 12 random bits
      (0x8 | (Math.random() * 4 | 0)).toString(16) + randomBytes(3), // variant + 14 random bits
      randomBytes(12)                                     // 48 random bits
    ].join('-');
    
    return uuid;
  }
}

// Глобальный экземпляр
window.opikTracker = new OpikTracker();