
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languagedetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        resources: {
            en: {
                translation: en
            },
            zh: {
                translation: zh
            },
            'zh-TW': {
                translation: zhTW
            },
            // Handling 'zh-CN' as 'zh' (Simplified Chinese)
            'zh-CN': {
                translation: zh
            },
            // Handling 'zh-HK' and 'zh-MO' as 'zh-TW' (Traditional Chinese)
            'zh-HK': {
                translation: zhTW
            }
        },
        fallbackLng: 'en',
        debug: false, // Set to true for development

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });

export default i18n;
