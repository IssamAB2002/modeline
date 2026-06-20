import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

export const i18nConfig = {
  fallbackLng: 'en',
  debug: import.meta.env.DEV,

  interpolation: {
    escapeValue: false,
  },

  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },

  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },

  react: {
    useSuspense: true,
  },

  // Load all namespaces by default
  ns: ['common', 'home', 'shop', 'product', 'about', 'contact', 'cart'],
  defaultNS: 'common',

  supportedLngs: ['en', 'ar'],
  nonExplicitSupportedLngs: true,
};

export default i18nConfig;
