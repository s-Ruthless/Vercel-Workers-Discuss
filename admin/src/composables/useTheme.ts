import { ref } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'vwd_admin_theme';
const theme = ref<Theme>('system');

export function useTheme() {
  function applyTheme() {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const isDark =
      theme.value === 'dark' ||
      (theme.value === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme();
  }

  function initTheme() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      theme.value = stored;
    } else {
      theme.value = 'system';
    }
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.onchange = () => {
      if (theme.value === 'system') {
        applyTheme();
      }
    };
  }

  return { theme, setTheme, initTheme };
}
