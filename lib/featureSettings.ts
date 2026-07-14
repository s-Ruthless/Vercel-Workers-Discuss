/**
 * 功能开关设置
 */
import { getSettings, setSetting } from './db.js';

export type FeatureSettings = {
  enableCommentLike: boolean;
  enableArticleLike: boolean;
  enableImageLightbox: boolean;
  enableEmoji: boolean;
  commentPlaceholder?: string;
  visibleDomains?: string[];
  adminLanguage?: string;
  widgetLanguage?: string;
  emotionUrl?: string;
};

export async function loadFeatureSettings(): Promise<FeatureSettings> {
  const map = await getSettings([
    'comment_feature_comment_like',
    'comment_feature_article_like',
    'comment_feature_image_lightbox',
    'comment_feature_emoji',
    'comment_feature_placeholder',
    'admin_visible_domains',
    'admin_language',
    'widget_language',
    'comment_feature_emotion_url',
  ]);

  const enableCommentLike = map.get('comment_feature_comment_like') !== '0';
  const enableArticleLike = map.get('comment_feature_article_like') !== '0';
  const enableImageLightbox = map.get('comment_feature_image_lightbox') === '1';
  const enableEmoji = map.get('comment_feature_emoji') !== '0';
  const commentPlaceholder = map.get('comment_feature_placeholder') || undefined;
  const adminLanguage = map.get('admin_language') || undefined;
  const widgetLanguage = map.get('widget_language') || undefined;
  const emotionUrl = map.get('comment_feature_emotion_url') || undefined;

  let visibleDomains: string[] | undefined;
  const raw = map.get('admin_visible_domains');
  if (raw) {
    try { visibleDomains = JSON.parse(raw); } catch { /* ignore */ }
  }

  return {
    enableCommentLike, enableArticleLike, enableImageLightbox, enableEmoji,
    commentPlaceholder, visibleDomains, adminLanguage, widgetLanguage, emotionUrl,
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
  if (settings.commentPlaceholder !== undefined)
    await setSetting('comment_feature_placeholder', settings.commentPlaceholder);
  if (settings.visibleDomains !== undefined)
    await setSetting('admin_visible_domains', JSON.stringify(settings.visibleDomains));
  if (settings.adminLanguage !== undefined)
    await setSetting('admin_language', settings.adminLanguage);
  if (settings.widgetLanguage !== undefined)
    await setSetting('widget_language', settings.widgetLanguage);
  if (settings.emotionUrl !== undefined)
    await setSetting('comment_feature_emotion_url', settings.emotionUrl);
}
