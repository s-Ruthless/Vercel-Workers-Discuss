/**
 * Admin 表情渲染工具
 * 从 shared/emoji.js 引入公共逻辑，保留 TypeScript 类型声明
 */
import {
  initEmojiPacks as _initEmojiPacks,
  getEmojiPacks as _getEmojiPacks,
  reloadEmojiPacks as _reloadEmojiPacks,
  getEmojiUrl as _getEmojiUrl,
  replaceEmojiSyntax as _replaceEmojiSyntax,
  renderContent as _renderContent,
} from '@shared/emoji.js';

export interface EmojiPack {
  name: string;
  prefix: string;
  type: string;
  icon: string;
  folder: string;
  items: string[];
  remote?: boolean;
}

export const reloadEmojiPacks = _reloadEmojiPacks;
export const initEmojiPacks = _initEmojiPacks;
export const getEmojiPacks = _getEmojiPacks;
export const getEmojiUrl = _getEmojiUrl;
export const renderContent = _renderContent;

/**
 * 替换 HTML 中的 :prefix_item: 短代码为 img 标签
 */
export function replaceEmojiSyntax(html: string): string {
  return _replaceEmojiSyntax(html);
}
