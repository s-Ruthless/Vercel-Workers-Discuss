/**
 * 表情渲染工具 (Waline 风格)
 * 将 :prefix_item: 短代码渲染为 <img> 标签
 */

export interface EmojiPack {
  name: string;
  prefix: string;
  type: string;
  icon: string;
  folder: string;
  items: string[];
  remote?: boolean;
}

let _packs: EmojiPack[] = [];
let _loaded = false;
let _loadingPromise: Promise<EmojiPack[]> | null = null;

/**
 * 初始化表情包
 * @param apiOrigin - API 源地址
 */
export async function initEmojiPacks(apiOrigin: string): Promise<EmojiPack[]> {
  if (_loaded) return _packs;
  if (_loadingPromise) return _loadingPromise;

  const origin = (apiOrigin || '').replace(/\/+$/, '');
  const defaultEmoji = [
    `${origin}/emotion/aru`,
    `${origin}/emotion/twemoji`,
  ];

  _loadingPromise = (async () => {
    const packs: EmojiPack[] = [];

    for (const url of defaultEmoji) {
      try {
        const folder = url.replace(/\/+$/, '');
        const res = await fetch(`${folder}/info.json`);
        if (res.ok) {
          const info = await res.json();
          packs.push({
            ...info,
            folder,
            remote: false,
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
 */
export function getEmojiPacks(): EmojiPack[] {
  return _packs;
}

/**
 * 替换 HTML 中的 :prefix_item: 短代码为 img 标签
 */
export function replaceEmojiSyntax(html: string): string {
  if (!html || _packs.length === 0) return html;

  const prefixMap: Record<string, EmojiPack> = {};
  for (const pack of _packs) {
    if (pack.prefix) {
      prefixMap[pack.prefix] = pack;
    }
  }

  return html.replace(/:([a-zA-Z]+)_(\w+):/g, (match, packKey, item) => {
    const prefix = packKey + '_';
    const pack = prefixMap[prefix];
    if (!pack) return match;

    const folder = (pack.folder || '').replace(/\/+$/, '');
    const ext = pack.type || 'png';
    const url = `${folder}/${item}.${ext}`;

    return `<img src="${url}" alt="${packKey}_${item}" class="vwd-emotion-img" referrerpolicy="no-referrer" loading="lazy" style="display:inline-block;vertical-align:middle;height:1.5em;width:auto;margin:0 2px;">`;
  });
}

/**
 * 渲染评论内容（处理旧版 img URL + 新版短代码）
 */
export function renderContent(html: string): string {
  if (!html) return html;
  return replaceEmojiSyntax(html);
}
