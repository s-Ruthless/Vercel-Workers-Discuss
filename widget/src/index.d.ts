export interface VWDCommentsConfig {
  /**
   * Selector or DOM element to mount the widget
   */
  el: string | HTMLElement;

  /**
   * Base URL of the VWD Comments API
   */
  apiBaseUrl: string;

  /**
   * Site ID for multi-site support
   */
  siteId?: string;

  /**
   * Current post slug (defaults to window.location.pathname)
   */
  postSlug?: string;

  /**
   * Current post title (defaults to document.title)
   */
  postTitle?: string;

  /**
   * Current post URL (defaults to window.location.href)
   */
  postUrl?: string;

  /**
   * Widget theme
   * @default 'light'
   */
  theme?: 'light' | 'dark' | string;

  /**
   * Comments per page
   * @default 20
   */
  pageSize?: number;

  /**
   * Widget language (only zh-CN is supported)
   * @default 'zh-CN'
   */
  lang?: 'zh-CN';

  /**
   * Custom CSS URL to load
   */
  customCssUrl?: string;

  /**
   * Primary color (hex)
   */
  primaryColor?: string;

  /**
   * Enable/Disable comment likes
   */
  enableCommentLike?: boolean;

  /**
   * Enable/Disable article likes
   */
  enableArticleLike?: boolean;

  /**
   * Enable/Disable image lightbox
   */
  enableImageLightbox?: boolean;

  /**
   * Placeholder text for comment input
   */
  commentPlaceholder?: string;

  /**
   * Emoji pack configuration (Waline style)
   * Configured in admin settings, loaded from server config.
   * @deprecated Use admin settings instead
   */
  emoji?: (string | object)[];

  /**
   * Enable/Disable emoji picker
   */
  enableEmoji?: boolean;

  /**
   * Widget mode: 'comments' (default) or 'says'
   * When set to 'says', renders the says (moments) feed instead of comments
   */
  mode?: 'comments' | 'says';
}

export class VWDComments {
  constructor(config: VWDCommentsConfig);

  /**
   * Mount the widget to the DOM
   */
  mount(): void;

  /**
   * Unmount the widget and clean up
   */
  unmount(): void;

  /**
   * Update widget configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<VWDCommentsConfig>): void;

  /**
   * Get current configuration
   */
  getConfig(): VWDCommentsConfig;
}

export default VWDComments;
