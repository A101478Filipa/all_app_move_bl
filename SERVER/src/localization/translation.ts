import pt from './pt.json';
import en from './en.json';

const translations: Record<string, any> = { pt, en };

export function getTranslation(
  lang: string, 
  key: string, 
  params?: Record<string, string>
): string {

  const locale = translations[lang] || translations['pt'];
  

  let text = locale[key] || translations['pt'][key] || key;


  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(`{${paramKey}}`, paramValue);
    }
  }

  return text;
}