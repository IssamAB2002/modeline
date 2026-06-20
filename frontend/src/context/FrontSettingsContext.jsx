import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { frontSettingsDefaults } from '../data';
import { useLang } from '../hooks/useLang';

const API_URL = `${import.meta.env.VITE_API_URL}/home/front-settings/`;

const FrontSettingsContext = createContext(frontSettingsDefaults.en);

function buildSettings(apiData, lang) {
  const defaults = frontSettingsDefaults[lang] || frontSettingsDefaults.en;
  const fallbackLang = lang === 'ar' ? 'en' : 'ar';
  const merged = { ...defaults };

  if (!apiData) return merged;

  for (const key of Object.keys(defaults)) {
    const primary = apiData[`${key}_${lang}`];
    const fallback = apiData[`${key}_${fallbackLang}`];
    const direct = apiData[key]; // language-neutral fields (e.g. about_stat_1_value, about_story_image_url)

    if (typeof primary === 'string' && primary.trim() !== '') {
      merged[key] = primary;
    } else if (typeof fallback === 'string' && fallback.trim() !== '') {
      merged[key] = fallback;
    } else if (typeof direct === 'string' && direct.trim() !== '') {
      merged[key] = direct;
    }
  }

  return merged;
}

export function FrontSettingsProvider({ children }) {
  const { currentLang } = useLang();
  const lang = currentLang.split('-')[0] === 'ar' ? 'ar' : 'en';
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(API_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setApiData(data);
      })
      .catch(() => {
        // Keep defaults if the API is unreachable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const settings = useMemo(() => buildSettings(apiData, lang), [apiData, lang]);

  return <FrontSettingsContext.Provider value={settings}>{children}</FrontSettingsContext.Provider>;
}

export function useFrontSettings() {
  return useContext(FrontSettingsContext);
}

export default FrontSettingsContext;
