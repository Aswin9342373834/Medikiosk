import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import { 
  SupportedLanguageCode, 
  LegacyLanguageName, 
  normalizeLanguageCode, 
  SUPPORTED_LANGUAGES 
} from '../contexts/LanguageContext';

export type SupportedLanguage = LegacyLanguageName | SupportedLanguageCode;

export { SUPPORTED_LANGUAGES, normalizeLanguageCode };
export type { SupportedLanguageCode, LegacyLanguageName };

const dictionaries: Record<SupportedLanguageCode, any> = {
  en,
  ta,
  hi
};

export function getTranslation(key: string, lang: SupportedLanguage = 'en'): string {
  const code = normalizeLanguageCode(lang);
  const dict = dictionaries[code] || dictionaries.en;
  
  if (dict[key] !== undefined) return dict[key];
  
  // Resolve dot notation
  const parts = key.split('.');
  let current: any = dict;
  for (const part of parts) {
    if (current === undefined || current === null) break;
    current = current[part];
  }
  
  if (current !== undefined && typeof current === 'string') {
    return current;
  }
  
  // English fallback
  if (code !== 'en') {
    let enCurrent: any = dictionaries.en;
    for (const part of parts) {
      if (enCurrent === undefined || enCurrent === null) break;
      enCurrent = enCurrent[part];
    }
    if (enCurrent !== undefined && typeof enCurrent === 'string') {
      return enCurrent;
    }
  }

  return key;
}

export function getSpeechLangCode(lang: SupportedLanguage = 'en'): string {
  const code = normalizeLanguageCode(lang);
  switch (code) {
    case 'ta':
      return 'ta-IN';
    case 'hi':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}
