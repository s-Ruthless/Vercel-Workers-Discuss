/**
 * 表情工具模块 (Waline 风格)
 * 支持前端配置表情包，使用 :prefix_item: 短代码语法
 */

/**
 * 加载表情包
 * @param {Array} emojiConfig - 表情包配置数组，每项可以是 URL 字符串或配置对象
 * @param {string} apiOrigin - API 源地址（用于本地默认包）
 * @returns {Promise<Array>} 加载完成的表情包数组
 */
export async function loadEmojiPacks(emojiConfig, apiOrigin) {
  const origin = (apiOrigin || '').replace(/\/+$/, '');
  const config = Array.isArray(emojiConfig) ? emojiConfig : [];

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
          items: data.container.map(i => i.icon),
          textMap: Object.fromEntries(data.container.map(i => [i.icon, i.text || ''])),
          folder: '',
          prefix: '',
        });
      }
    }
  } catch (e) {
    console.error('Failed to load emoticons:', e);
  }

  for (const entry of config) {
    if (typeof entry === 'string') {
      // URL 模式：从 URL 加载 info.json
      try {
        const folder = entry.replace(/\/+$/, '');
        const res = await fetch(`${folder}/info.json`);
        if (res.ok) {
          const info = await res.json();
          // 尝试加载 meta.json 获取中文文本映射
          let textMap = {};
          try {
            const metaRes = await fetch(`${folder}/meta.json`);
            if (metaRes.ok) {
              const meta = await metaRes.json();
              if (meta.items) {
                textMap = meta.items;
              }
            }
          } catch (e) {}
          packs.push({
            ...info,
            folder,
            remote: true,
            textMap,
          });
        }
      } catch (e) {
        console.error('Failed to load emoji pack:', entry, e);
      }
    } else if (entry && typeof entry === 'object') {
      if (!entry.folder && entry.name) {
        entry.folder = `${origin}/emotion/${entry.name}`;
      }
      packs.push({ remote: false, ...entry });
    }
  }

  return packs;
}

/**
 * 获取表情图片 URL
 * prefix 仅用于短代码语法（:aru_smile:），不参与文件名
 * @param {Object} pack - 表情包对象
 * @param {string} item - 表情项名称
 * @returns {string} 图片 URL
 */
export function getEmojiUrl(pack, item) {
  const folder = (pack.folder || '').replace(/\/+$/, '');
  const ext = pack.type || 'png';
  return `${folder}/${item}.${ext}`;
}

/**
 * 替换文本中的 :prefix_item: 短代码为 HTML img 标签
 * @param {string} text - 包含短代码的文本
 * @param {Array} packs - 表情包数组
 * @returns {string} 替换后的文本
 */
export function replaceEmojiSyntax(text, packs) {
  if (!text || !packs || packs.length === 0) return text;

  // 构建 prefix -> pack 映射
  const prefixMap = {};
  for (const pack of packs) {
    if (pack.prefix) {
      prefixMap[pack.prefix] = pack;
    }
  }

  // 匹配 :prefix_item: 格式
  return text.replace(/:([a-zA-Z]+)_(\w+):/g, (match, packKey, item) => {
    const prefix = packKey + '_';
    const pack = prefixMap[prefix];
    if (!pack) return match;

    const url = getEmojiUrl(pack, item);
    return `<img src="${url}" alt="${packKey}_${item}" class="vwd-emotion-img" referrerpolicy="no-referrer" loading="lazy">`;
  });
}

/**
 * 替换 HTML 中旧版表情图片的 URL（向后兼容）
 * @param {string} html - 包含旧版表情图片的 HTML
 * @param {string} origin - API 源地址
 * @returns {string} 替换后的 HTML
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

// 向后兼容导出
export function replaceEmotionSyntax(text) {
  if (!text) return text;
  return text.replace(/::(\w+):(\w+)::/g, (match, pkg, icon) => {
    if (!/^[a-zA-Z]+$/.test(pkg) || !/^[a-zA-Z0-9]+$/.test(icon)) {
      return match;
    }
    return `:${pkg}_${icon}:`;
  });
}
