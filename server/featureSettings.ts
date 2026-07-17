/**
 * 功能开关设置
 */
import { getSettings, setSetting } from './db.js';

export type FeatureSettings = {
  enableCommentLike: boolean;
  enableArticleLike: boolean;
  enableImageLightbox: boolean;
  enableEmoji: boolean;
  enableSayLike: boolean;
  commentPlaceholder?: string;
  emojiPaths?: string[];
  visibleDomains?: string[];
};

export async function loadFeatureSettings(): Promise<FeatureSettings> {
  const map = await getSettings([
    'comment_feature_comment_like',
    'comment_feature_article_like',
    'comment_feature_image_lightbox',
    'comment_feature_emoji',
    'comment_feature_say_like',
    'comment_feature_placeholder',
    'comment_feature_emoji_paths',
    'admin_visible_domains',
  ]);

  const enableCommentLike = map.get('comment_feature_comment_like') !== '0';
  const enableArticleLike = map.get('comment_feature_article_like') !== '0';
  const enableImageLightbox = map.get('comment_feature_image_lightbox') === '1';
  const enableEmoji = map.get('comment_feature_emoji') !== '0';
  const enableSayLike = map.get('comment_feature_say_like') !== '0';
  const commentPlaceholder = map.get('comment_feature_placeholder') || undefined;

  let emojiPaths: string[] | undefined;
  const rawEmojiPaths = map.get('comment_feature_emoji_paths');
  if (rawEmojiPaths) {
    try { emojiPaths = JSON.parse(rawEmojiPaths); } catch { /* ignore */ }
  }

  let visibleDomains: string[] | undefined;
  const raw = map.get('admin_visible_domains');
  if (raw) {
    try { visibleDomains = JSON.parse(raw); } catch { /* ignore */ }
  }

  return {
    enableCommentLike, enableArticleLike, enableImageLightbox, enableEmoji, enableSayLike,
    commentPlaceholder, emojiPaths, visibleDomains,
  };
}

export async function saveFeatureSettings(settings: Partial<FeatureSettings>): Promise<void> {
  if (settings.enableCommentLike !== undefined)
    await setSetting('comment_feature_comment_like', settings.enableCommentLike ? '1' : '0');
  if (settings.enableArticleLike !== undefined)
    await setSetting('comment_feature_article_like', settings.enableArticleLike ? '1' : '0');
  if (settings.enableImageLightbox !== undefined)
    await setSetting('comment_feature_image_lightbox', settings.enableImageLightbox ? '1' : '0');
  if (settings.enableEmoji !== undefined)
    await setSetting('comment_feature_emoji', settings.enableEmoji ? '1' : '0');
  if (settings.enableSayLike !== undefined)
    await setSetting('comment_feature_say_like', settings.enableSayLike ? '1' : '0');
  if (settings.commentPlaceholder !== undefined)
    await setSetting('comment_feature_placeholder', settings.commentPlaceholder);
  if (settings.emojiPaths !== undefined)
    await setSetting('comment_feature_emoji_paths', JSON.stringify(settings.emojiPaths));
  if (settings.visibleDomains !== undefined)
    await setSetting('admin_visible_domains', JSON.stringify(settings.visibleDomains));
}
