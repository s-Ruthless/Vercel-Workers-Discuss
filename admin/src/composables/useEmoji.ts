/**
 * 表情包加载状态（响应式）
 * 解决浏览器刷新后表情渲染不出来的问题：
 * initEmojiPacks 是异步的，_packs 不是响应式变量，
 * 当 packs 加载完成时 Vue 不会自动重新渲染。
 * 通过 emojiReady 响应式标志触发重新渲染。
 */
import { ref } from 'vue';
import { initEmojiPacks } from '@shared/emoji.js';
import { fetchFeatureSettings } from '../api/admin';

const emojiReady = ref(false);
let initPromise: Promise<void> | null = null;

export async function ensureEmojiLoaded(): Promise<void> {
  if (emojiReady.value) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetchFeatureSettings();
      await initEmojiPacks(window.location.origin, res.emojiPaths);
    } catch {
      await initEmojiPacks(window.location.origin);
    }
    emojiReady.value = true;
  })();

  return initPromise;
}

export function useEmojiReady() {
  return { emojiReady, ensureEmojiLoaded };
}
