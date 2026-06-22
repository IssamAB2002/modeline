import { useEffect } from 'react';
import i18n from '../i18n';

export function useLang() {
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return {
    currentLang: 'ar',
    isRTL: true,
    t: i18n.t.bind(i18n),
  };
}

export default useLang;
