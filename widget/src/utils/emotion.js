/**
 * Widget 表情工具
 * 从 shared/emoji.js 引入公共逻辑，保留 Widget 特有函数
 */
export {
  initEmojiPacks,
  getEmojiPacks,
  reloadEmojiPacks,
  getEmojiUrl,
  replaceEmojiSyntax,
  renderContent,
} from '@shared/emoji.js';

import { initEmojiPacks as _initEmojiPacks } from '@shared/emoji.js';

/**
 * 加载表情包（Widget 兼容函数，参数顺序与 initEmojiPacks 相反）
 * @param {Array} emojiPaths - 表情包路径数组
 * @param {string} apiOrigin - API 源地址
 * @returns {Promise<Array>}
 */
export function loadEmojiPacks(emojiPaths, apiOrigin) {
  return _initEmojiPacks(apiOrigin, emojiPaths);
}

/**
 * 替换 HTML 中旧版表情图片的 URL（向后兼容）
 * @param {string} html - 包含旧版表情图片的 HTML
 * @param {string} origin - API 源地址
 * @returns {string}
 */
export function replaceEmotionUrlsInHtml(html, origin) {
  if (!html) return html;
  const baseOrigin = (origin || '').replace(/\/+$/, '');
  if (!baseOrigin) return html;
  return html.replace(
    /src=["'](https?:\/\/[^"']*?\/emotion\/(\w+)\/(\w+)\.\w+)["']/gi,
    (match, oldUrl, pkg, icon) => {
      return `src="${baseOrigin}/emotion/${pkg}/${icon}.png"`;
    }
  );
}

/**
 * 向后兼容：旧版 ::pkg:icon:: 语法转新版 :pkg_icon: 短代码
 */
export function replaceEmotionSyntax(text) {
  if (!text) return text;
  return text.replace(/::(\w+):(\w+)::/g, (match, pkg, icon) => {
    if (!/^[a-zA-Z]+$/.test(pkg) || !/^[a-zA-Z0-9]+$/.test(icon)) {
      return match;
    }
    return `:${pkg}_${icon}:`;
  });
}
