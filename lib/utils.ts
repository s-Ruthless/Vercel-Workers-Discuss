/**
 * 工具函数
 */
import type { Context } from 'hono';
import { createHash } from 'node:crypto';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 递归解码 URL 编码的 slug
 */
export function decodePostSlug(slug: string): string {
  if (!slug) return slug;
  let decoded = slug.trim();
  let prev = '';
  while (prev !== decoded) {
    prev = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
  }
  return decoded;
}

/**
 * 获取所有可能的 slug 格式（编码/解码）
 */
export function getAllSlugFormats(slug: string): string[] {
  if (!slug) return [];
  const decoded = decodePostSlug(slug);
  const formats = new Set<string>();
  formats.add(decoded);
  if (decoded !== slug) {
    formats.add(slug);
  }
  const encoded = encodeURI(decoded);
  if (encoded !== decoded && !formats.has(encoded)) {
    formats.add(encoded);
  }
  return Array.from(formats);
}

/**
 * 获取客户端 IP（Vercel 环境下从 header 获取）
 */
export function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * 生成 Gravatar 头像 URL
 */
export async function getCravatar(
  email: string | null | undefined,
  name?: string | null | undefined,
  prefix?: string
): Promise<string> {
  const avatarPrefix = prefix || 'https://gravatar.com/avatar';
  const DEFAULT_HASH = '00000000000000000000000000000000';

  const pickIdentifier = (value: string | null | undefined) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed || null;
  };

  const identifier = pickIdentifier(email) || pickIdentifier(name);
  if (!identifier) {
    return `${avatarPrefix}/${DEFAULT_HASH}?s=120&d=retro`;
  }

  const hashHex = createHash('md5').update(identifier).digest('hex');

  return `${avatarPrefix}/${hashHex}?s=120&d=retro`;
}

/**
 * 表情语法替换
 * ::pkg:icon:: → <img> 标签（兼容旧版 vwd.js）
 * :prefix_item: → 保留为文本（新版 vwd.js 前端渲染）
 */
export function replaceEmotionSyntax(content: string, emotionUrl?: string): string {
  if (!content) return content;
  // ::pkg:icon:: → <img> 标签（使用服务器 URL，兼容旧版 vwd.js）
  const baseUrl = (emotionUrl || '').replace(/\/+$/, '');
  let result = content.replace(/::(\w+):(\w+)::/g, (match, pkg, icon) => {
    if (!/^[a-zA-Z]+$/.test(pkg) || !/^[a-zA-Z0-9]+$/.test(icon)) {
      return match;
    }
    if (baseUrl) {
      return `<img src="${baseUrl}/${pkg}/${icon}.png" alt="${icon}" title="${icon}" class="vwd-emotion-img" referrerpolicy="no-referrer" loading="lazy">`;
    }
    return match;
  });
  // :prefix_item: → 保留为文本（新版前端用 replaceEmojiSyntax 渲染）
  return result;
}

/**
 * 内容安全检查 - 去除 script 标签并 trim
 */
export function checkContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  return content.replace(/<script[\s\S]*?<\/script>/g, '').trim();
}
