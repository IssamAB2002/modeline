export const i18nConfig = {
  fallbackLng: 'ar',
  debug: import.meta.env.DEV,

  interpolation: {
    escapeValue: false,
  },

  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },

  react: {
    useSuspense: true,
  },

  ns: ['common', 'home', 'shop', 'product', 'about', 'contact', 'cart'],
  defaultNS: 'common',

  supportedLngs: ['ar'],
  nonExplicitSupportedLngs: false,
};

export default i18nConfig;
