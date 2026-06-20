import { useCallback, useEffect, useState } from 'react';
import i18n from '../i18n';

const RTL_LANGS = ['ar', 'he', 'fa', 'ur'];

export function useLang() {
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  // Forces a re-render whenever i18next resources finish loading, even if
  // the resolved language matches the 'en' default used before i18next
  // was ready (in which case setCurrentLang('en') alone would be a no-op).
  const [, forceUpdate] = useState(0);
  const isRTL = RTL_LANGS.includes(currentLang.split('-')[0]);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLang(lng);
      forceUpdate((tick) => tick + 1);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, []);

  const changeLanguage = useCallback(async (lng) => {
    await i18n.changeLanguage(lng);
  }, []);

  const toggleLanguage = useCallback(async () => {
    const next = currentLang.startsWith('ar') ? 'en' : 'ar';
    await i18n.changeLanguage(next);
  }, [currentLang]);

  useEffect(() => {
    // Update document direction on language change
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang;
  }, [isRTL, currentLang]);

  return {
    currentLang,
    isRTL,
    changeLanguage,
    toggleLanguage,
    t: i18n.t.bind(i18n),
  };
}

export default useLang;
