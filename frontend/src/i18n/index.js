import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import { i18nConfig } from './config';

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init(i18nConfig);

export default i18n;
