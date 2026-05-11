import { useState, useCallback, createContext, useContext } from 'react';

type Lang = 'zh' | 'en';

interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (zh: string, en: string) => string;
}

export const LangContext = createContext<LangContextType>({
  lang: 'zh',
  toggleLang: () => {},
  t: (zh: string) => zh,
});

export function useLanguage() {
  return useContext(LangContext);
}

export function useLanguageProvider() {
  const [lang, setLang] = useState<Lang>('zh');

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  }, []);

  const t = useCallback((zh: string, en: string) => {
    return lang === 'zh' ? zh : en;
  }, [lang]);

  return { lang, toggleLang, t };
}
