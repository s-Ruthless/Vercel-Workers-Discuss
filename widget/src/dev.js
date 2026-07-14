/**
 * 开发调试脚本
 */
import { VWDComments } from './index.js';

const STORAGE_KEY = 'vwd-dev-config';

const DEFAULT_CONFIG = {
  el: '#comments',
  apiBaseUrl: 'http://localhost:3000',
  siteId: 'vwd-dev-config',
  theme: 'light',
  postSlug: '',
};

let widgetInstance = null;

function loadConfigFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_CONFIG;
}

function saveConfigToStorage(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {}
}

function populateInputs(config) {
  const apiBaseUrlInput = document.getElementById('apiBaseUrl');
  const themeSelect = document.getElementById('theme');
  const siteIdInput = document.getElementById('siteId');
  const postSlugInput = document.getElementById('postSlug');

  if (apiBaseUrlInput) apiBaseUrlInput.value = config.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
  if (themeSelect) themeSelect.value = config.theme || DEFAULT_CONFIG.theme;
  if (siteIdInput) siteIdInput.value = config.siteId || DEFAULT_CONFIG.siteId || '';
  if (postSlugInput) postSlugInput.value = config.postSlug || DEFAULT_CONFIG.postSlug || '';
}

function getConfigFromInputs() {
  const apiBaseUrl = document.getElementById('apiBaseUrl')?.value || DEFAULT_CONFIG.apiBaseUrl;
  const theme = document.getElementById('theme')?.value || DEFAULT_CONFIG.theme;
  const siteId = document.getElementById('siteId')?.value || DEFAULT_CONFIG.siteId || '';
  const postSlug = document.getElementById('postSlug')?.value || DEFAULT_CONFIG.postSlug || '';
  return { apiBaseUrl, theme, siteId, postSlug };
}

async function initWidget() {
  const config = getConfigFromInputs();
  saveConfigToStorage(config);

  if (widgetInstance) {
    widgetInstance.unmount();
    widgetInstance = null;
  }

  const container = document.getElementById('comments');
  if (container) {
    container.innerHTML = '';
  }

  try {
    widgetInstance = new VWDComments({
      el: '#comments',
      apiBaseUrl: config.apiBaseUrl,
      siteId: config.siteId,
      postSlug: config.postSlug,
      theme: config.theme,
    });
    widgetInstance.mount();
  } catch (error) {
    console.error('Failed to init widget:', error);
  }
}

function toggleTheme() {
  if (!widgetInstance) return;

  const currentConfig = widgetInstance.getConfig();
  const newTheme = currentConfig.theme === 'light' ? 'dark' : 'light';
  widgetInstance.updateConfig({ theme: newTheme });

  const themeSelect = document.getElementById('theme');
  if (themeSelect) {
    themeSelect.value = newTheme;
  }

  const config = getConfigFromInputs();
  config.theme = newTheme;
  saveConfigToStorage(config);
}

// 初始化
const savedConfig = loadConfigFromStorage();
populateInputs(savedConfig);
initWidget();

// 暴露到全局
window.initWidget = initWidget;
window.toggleTheme = toggleTheme;
