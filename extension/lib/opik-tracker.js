class OpikTracker {
  constructor() {
    this.enabled = false;
    this.apiKey = '';
    this.workspaceName = '';
    this.projectName = 'translateme';
    this.baseUrl = 'https://www.comet.com/opik/api/v1/private';
    this.init();
  }
  
  init() {
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
    } else {
      // console.log('📊 Opik tracker: No API key found, logging to console only');
    }
  }

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
    
    
    if (!this.enabled || !this.apiKey) return;

    try {
      const traceId = this.generateId();
      
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
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn('⚠️ Opik translation error body:', errorText);
      }
    } catch (error) {
      // console.warn('⚠️ Opik error:', error.message);
    }
  }

  async logSTT(transcript, metadata = {}) {
    const endTime = new Date();
    const startTime = metadata.startTime ? new Date(metadata.startTime) : endTime;
    const durationMs = endTime - startTime;
    
    if (!this.enabled || !this.apiKey) return;

    try {
      const traceId = this.generateId();

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
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
      }
    } catch (error) {
    }
  }

  async logTTS(text, metadata = {}) {
    const endTime = new Date();
    const startTime = metadata.startTime ? new Date(metadata.startTime) : endTime;
    const durationMs = endTime - startTime;
    
    
    if (!this.enabled || !this.apiKey) return;

    try {
      const traceId = this.generateId();

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

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
      }
    } catch (error) {
      // console.warn('⚠️ Opik TTS error:', error.message);
    }
  }

  generateId() {
    const timestamp = Date.now();
    const timestampHex = timestamp.toString(16).padStart(12, '0');
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const randomBytes = (n) => Array(n).fill(0).map(randomHex).join('');
    
    const uuid = [
      timestampHex.slice(0, 8),
      timestampHex.slice(8, 12) + randomBytes(0),
      '7' + randomBytes(3),
      (0x8 | (Math.random() * 4 | 0)).toString(16) + randomBytes(3),
      randomBytes(12)
    ].join('-');
    
    return uuid;
  }
}

window.opikTracker = new OpikTracker();