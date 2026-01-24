import ru from '../../../messages/ru.json';
import en from '../../../messages/en.json';
import uk from '../../../messages/uk.json';
import es from '../../../messages/es.json';

// Загружаем все файлы переводов
const translations = {
  ru,
  en,
  uk,
  es,
};

// Функция для поиска вложенных ключей
const getNestedTranslation = (
  langPack: Record<string, any>, 
  key: string
): string => {
  const keys = key.split('.');
  let current: any = langPack;

  for (const part of keys) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = current[part];
    } else {
      // Если ключ не найден, возвращаем сам ключ
      return key;
    }
  }

  if (typeof current === 'string') {
    return current;
  }

  return key;
};

// Основная функция для получения перевода
export const getTranslation = (lang: string, key: string): string => {
  const langPack = translations[lang as keyof typeof translations];
  
  if (!langPack) {
    // Используем 'ru' как запасной вариант, если язык не найден
    return getNestedTranslation(translations['ru'], key);
  }
  
  return getNestedTranslation(langPack, key);
};