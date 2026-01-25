// Скопируй этот файл в secrets.js и вставь свои API ключи
// secrets.js добавлен в .gitignore и не будет закоммичен

window.SECRETS = {
  DEEPGRAM_API_KEY: 'YOUR_DEEPGRAM_API_KEY_HERE',
  OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY_HERE',
  
  // Opik (Comet) для мониторинга LLM - опционально
  OPIK: {
    enabled: false,  // Включить/выключить трекинг
    apiKey: 'YOUR_OPIK_API_KEY_HERE',
    workspaceName: '',  // Имя workspace в Comet (опционально)
    projectName: 'translateme'
  }
};
