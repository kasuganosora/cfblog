/**
 * i18n (Internationalization) Utility
 * Supports multiple languages and browser detection
 */

// Available languages
const SUPPORTED_LANGUAGES = {
  'zh-cn': '简体中文',
  'en-us': 'English',
};

const DEFAULT_LANGUAGE = 'zh-cn';

// Get user's preferred language
function getBrowserLanguage() {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;

  const browserLang = navigator.language.toLowerCase();
  
  // Check exact match first
  if (SUPPORTED_LANGUAGES[browserLang]) {
    return browserLang;
  }
  
  // Check partial match (e.g., 'zh' -> 'zh-cn')
  const langPrefix = browserLang.split('-')[0];
  for (const [code] of Object.entries(SUPPORTED_LANGUAGES)) {
    if (code.startsWith(langPrefix)) {
      return code;
    }
  }
  
  return DEFAULT_LANGUAGE;
}

// Get user's saved language from localStorage
function getUserLanguage() {
  try {
    const saved = localStorage.getItem('cfblog_language');
    if (saved && SUPPORTED_LANGUAGES[saved]) {
      return saved;
    }
  } catch (e) {
    // localStorage not available
  }
  return getBrowserLanguage();
}

// Set user's preferred language
function setUserLanguage(lang) {
  if (SUPPORTED_LANGUAGES[lang]) {
    try {
      localStorage.setItem('cfblog_language', lang);
    } catch (e) {
      // localStorage not available
    }
    return true;
  }
  return false;
}

// Load language pack
async function loadLanguagePack(lang) {
  try {
    const module = await import(`../i18n/${lang}.js`);
    return module.default || module;
  } catch (e) {
    console.error(`Failed to load language pack: ${lang}`, e);
    // Fallback to default
    const defaultModule = await import(`../i18n/${DEFAULT_LANGUAGE}.js`);
    return defaultModule.default || defaultModule;
  }
}

// Translate text
let currentLanguagePack = null;
let currentLanguage = null;

async function initI18n() {
  currentLanguage = getUserLanguage();
  currentLanguagePack = await loadLanguagePack(currentLanguage);
  return currentLanguagePack;
}

function t(key, params = {}) {
  if (!currentLanguagePack) {
    console.warn('i18n not initialized. Call initI18n() first.');
    return key;
  }
  
  let text = currentLanguagePack[key] || key;
  
  // Replace parameters
  for (const [param, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${param}}`, 'g'), value);
  }
  
  return text;
}

function getCurrentLanguage() {
  return currentLanguage;
}

function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

// Export for use in frontend
if (typeof window !== 'undefined') {
  window.CFBlogI18n = {
    init: initI18n,
    t,
    setLanguage: setUserLanguage,
    getLanguage: getCurrentLanguage,
    getSupportedLanguages: getSupportedLanguages,
  };
}

export {
  initI18n,
  t,
  setUserLanguage,
  getUserLanguage,
  getCurrentLanguage,
  getBrowserLanguage,
  getSupportedLanguages,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
};
