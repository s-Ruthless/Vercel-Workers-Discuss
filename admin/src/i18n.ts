import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

const LANG_KEY = 'vwd_admin_lang';
const savedLang = localStorage.getItem(LANG_KEY);
const locale = savedLang === 'en' ? 'en' : 'zh-CN';

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': en,
  },
});

export function setLanguage(lang: 'zh-CN' | 'en') {
  i18n.global.locale.value = lang;
  localStorage.setItem(LANG_KEY, lang);
}

export function getLanguage(): 'zh-CN' | 'en' {
  return i18n.global.locale.value as 'zh-CN' | 'en';
}

export function toggleLanguage() {
  const current = getLanguage();
  setLanguage(current === 'zh-CN' ? 'en' : 'zh-CN');
}

export default i18n;
