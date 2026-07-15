/**
 * 单条说说组件
 */
import { replaceEmotionUrlsInHtml } from '../utils/emotion.js';

export class SayItem {
  constructor(container, props) {
    this.container = container;
    this.props = props;
    this.liked = props.liked || false;
  }

  setProps(props) {
    this.props = { ...this.props, ...props };
    this.render();
  }

  render() {
    if (!this.container) return;
    const { say, apiOrigin, enableComments, t } = this.props;

    const html = say.contentHtml
      ? replaceEmotionUrlsInHtml(say.contentHtml, apiOrigin || '')
      : '';

    const tagsHtml = say.tags && say.tags.length > 0
      ? say.tags.map(tag => `<span class="vwd-say-tag">${tag}</span>`).join('')
      : '';

    const date = new Date(say.created);
    const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    this.container.innerHTML = `
      <div class="vwd-say-item" data-say-id="${say.id}">
        <div class="vwd-say-header">
          <span class="vwd-say-time">${timeStr}</span>
          <div class="vwd-say-actions">
            <button type="button" class="vwd-say-like-btn" data-liked="${this.liked}">
              <svg class="vwd-say-like-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21c-.4 0-.8-.1-1.1-.4L4.5 15C3 13.6 2 11.7 2 9.6 2 6.5 4.5 4 7.6 4c1.7 0 3.3.8 4.4 2.1C13.1 4.8 14.7 4 16.4 4 19.5 4 22 6.5 22 9.6c0 2.1-1 4-2.5 5.4l-6.4 5.6c-.3.3-.7.4-1.1.4z"></path>
              </svg>
              <span class="vwd-say-like-count">${say.likes || 0}</span>
            </button>
          </div>
        </div>
        <div class="vwd-say-content">${html}</div>
        ${tagsHtml ? `<div class="vwd-say-tags">${tagsHtml}</div>` : ''}
      </div>
    `;

    const likeBtn = this.container.querySelector('.vwd-say-like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', () => this._handleLike());
    }
  }

  async _handleLike() {
    const { say, onLike } = this.props;
    if (this.liked) return;
    if (onLike) {
      const result = await onLike(say.id);
      if (result) {
        this.liked = true;
        const countEl = this.container?.querySelector('.vwd-say-like-count');
        if (countEl) countEl.textContent = String(result.totalLikes || say.likes + 1);
        const btn = this.container?.querySelector('.vwd-say-like-btn');
        if (btn) btn.dataset.liked = 'true';
      }
    }
  }
}
