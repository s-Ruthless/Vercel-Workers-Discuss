import { ref } from 'vue';

export type AccentPreset = {
  name: string;
  color: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: '蓝色', color: '#007aff' },
  { name: '紫色', color: '#af52de' },
  { name: '粉色', color: '#ff2d55' },
  { name: '红色', color: '#ff3b30' },
  { name: '橙色', color: '#ff9500' },
  { name: '绿色', color: '#34c759' },
  { name: '青色', color: '#5ac8fa' },
  { name: '靛蓝', color: '#5856d6' },
];

const STORAGE_KEY = 'vwd_admin_accent';

const accentColor = ref<string>('#007aff');

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount;
  return '#' + [r, g, b].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useAccentColor() {
  function applyAccent(color: string) {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const hover = darken(color, 0.12);
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--primary-hover', hover);
    root.style.setProperty('--primary-light', rgba(color, 0.08));
    root.style.setProperty('--text-link', color);
    root.style.setProperty('--bg-active', rgba(color, 0.1));
    root.style.setProperty('--shadow-focus', `0 0 0 4px ${rgba(color, 0.15)}`);
    root.style.setProperty('--vwd-primary', color);
    root.style.setProperty('--vwd-primary-hover', hover);
  }

  function setAccent(color: string) {
    accentColor.value = color;
    localStorage.setItem(STORAGE_KEY, color);
    applyAccent(color);
  }

  function initAccent() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && /^#[0-9a-fA-F]{6}$/.test(stored)) {
      accentColor.value = stored;
      applyAccent(stored);
    }
  }

  return { accentColor, setAccent, initAccent, applyAccent, ACCENT_PRESETS };
}
