/**
 * 共享表情包逻辑（Admin 和 Widget 通用）
 * 不依赖任何框架，纯 JS 实现
 */

let _packs = [];
let _loaded = false;
let _loadingPromise = null;

/**
 * 标记需要重新加载（不清空已有数据，避免渲染中断）
 */
export function reloadEmojiPacks() {
  _loaded = false;
  _loadingPromise = null;
}

/**
 * 初始化表情包
 * @param {string} apiOrigin - API 源地址
 * @param {string[]} [emojiPaths] - 用户配置的表情包路径数组（可选）
 * @returns {Promise<Array>}
 */
export async function initEmojiPacks(apiOrigin, emojiPaths) {
  if (_loaded) return _packs;
  if (_loadingPromise) return _loadingPromise;

  const origin = (apiOrigin || '').replace(/\/+$/, '');
  const defaultEmoji = [
    `${origin}/emotion/alus`,
  ];

  _loadingPromise = (async () => {
    const packs = [];

    // 加载颜文字（文本表情）
    try {
      const res = await fetch(`${origin}/emotion/emoticons.json`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.container)) {
          packs.push({
            name: '颜文字',
            type: 'text',
            prefix: '',
            icon: '',
            items: data.container.map((i) => i.icon),
            folder: '',
          });
        }
      }
    } catch (e) {
      console.error('Failed to load emoticons:', e);
    }

    // 用户配置的表情包路径优先，否则使用默认
    const emojiUrls = (emojiPaths && emojiPaths.length > 0) ? emojiPaths : defaultEmoji;

    for (const url of emojiUrls) {
      try {
        const folder = url.replace(/\/+$/, '');
        const res = await fetch(`${folder}/info.json`);
        if (res.ok) {
          const info = await res.json();
          packs.push({
            ...info,
            folder,
            remote: true,
          });
        }
      } catch (e) {
        console.error('Failed to load emoji pack:', url, e);
      }
    }

    _packs = packs;
    _loaded = true;
    _loadingPromise = null;
    return packs;
  })();

  return _loadingPromise;
}

/**
 * 获取已加载的表情包
 * @returns {Array}
 */
export function getEmojiPacks() {
  return _packs;
}

/**
 * 构造表情图片 URL
 * @param {object} pack - 表情包对象
 * @param {string} item - 表情项名称
 * @returns {string}
 */
export function getEmojiUrl(pack, item) {
  const folder = (pack.folder || '').replace(/\/+$/, '');
  const ext = pack.type || 'png';
  const prefix = pack.prefix || '';
  return `${folder}/${prefix}${item}.${ext}`;
}

/**
 * 替换文本中的 :prefix_item: 短代码为 HTML img 标签
 * @param {string} text - 包含短代码的文本
 * @param {Array} [packs] - 表情包数组（可选，默认用已加载的）
 * @returns {string}
 */
export function replaceEmojiSyntax(text, packs) {
  if (!text) return text;
  const usePacks = packs || _packs;
  if (!usePacks || usePacks.length === 0) return text;

  const prefixMap = {};
  for (const pack of usePacks) {
    if (pack.prefix) {
      prefixMap[pack.prefix] = pack;
    }
  }

  return text.replace(/:([a-zA-Z]+)_(\w+):/g, (match, packKey, item) => {
    const prefix = packKey + '_';
    const pack = prefixMap[prefix];
    if (!pack) return match;

    const url = getEmojiUrl(pack, item);
    return `<img src="${url}" alt="${packKey}_${item}" class="vwd-emotion-img" referrerpolicy="no-referrer" loading="lazy">`;
  });
}

/**
 * 渲染内容（处理表情短代码）
 * @param {string} html - HTML 内容
 * @returns {string}
 */
export function renderContent(html) {
  if (!html) return html;
  return replaceEmojiSyntax(html);
}
