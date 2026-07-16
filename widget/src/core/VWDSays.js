/**
 * VWDSays - 说说 (Moments) Widget
 * 使用 Shadow DOM 隔离样式
 */

import { createApiClient } from './api.js';
import { SayList } from '../components/SayList.js';
import { ImagePreview } from '../components/ImagePreview.js';
import { loadEmojiPacks, replaceEmotionUrlsInHtml } from '../utils/emotion.js';
import styles from '../styles/main.css?inline';

export class VWDSays {
  constructor(config) {
    this.config = { ...config };
    if (config.siteId) {
      this.config.siteId = config.siteId;
    }
    this.hostElement = this._resolveElement(config.el);
    this.shadowRoot = null;
    this.mountPoint = null;
    this.sayList = null;
    this.imagePreview = null;
    this.api = null;
    this._mounted = false;

    this.state = {
      says: [],
      loading: true,
      error: null,
      currentPage: 1,
      totalPages: 1,
    };
  }

  _resolveElement(el) {
    if (typeof document === 'undefined') return null;
    if (!el) return null;
    if (typeof el === 'string') {
      const element = document.querySelector(el);
      if (!element || !(element instanceof HTMLElement)) return null;
      return element;
    }
    if (el instanceof HTMLElement) return el;
    return null;
  }

  mount() {
    if (this._mounted) return;

    if (this.hostElement) {
      this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });
      const styleElement = document.createElement('style');
      if (typeof styles === 'string') {
        styleElement.textContent = styles;
      } else if (styles && typeof styles === 'object' && 'default' in styles) {
        styleElement.textContent = styles.default;
      }
      this.shadowRoot.appendChild(styleElement);
      this.mountPoint = document.createElement('div');
      this.mountPoint.className = 'vwd-says-container';
      this.shadowRoot.appendChild(this.mountPoint);
      const theme = this.config.theme || 'light';
      this.mountPoint.setAttribute('data-theme', theme);
      this._applyPrimaryColor();
    }

    (async () => {
      if (!this._mounted) return;

      this.config.apiOrigin = this.config.apiBaseUrl
        ? this.config.apiBaseUrl.replace(/\/+$/, '')
        : '';

      // Load emoji packs (optional, for rendering emoji in says)
    const defaultEmoji = [
      `${this.config.apiOrigin}/emotion/alus`,
    ];
      this.config.emoji = defaultEmoji;
      this.config.emojiPacks = [];
      loadEmojiPacks(this.config.emoji, this.config.apiOrigin)
        .then((packs) => {
          this.config.emojiPacks = packs;
        })
        .catch(() => {});

      // Image lightbox
      if (this.mountPoint) {
        this.imagePreview = new ImagePreview(this.mountPoint);
        this.mountPoint.addEventListener('click', (e) => this._handleImageClick(e));
      }

      this.api = createApiClient(this.config);

      this._render();
      await this._loadSays();
    })();

    this._mounted = true;
  }

  unmount() {
    if (!this._mounted) return;
    if (this.imagePreview) {
      this.imagePreview = null;
    }
    if (this.hostElement) {
      while (this.hostElement.firstChild) {
        this.hostElement.removeChild(this.hostElement.firstChild);
      }
    }
    this.shadowRoot = null;
    this.mountPoint = null;
    this._mounted = false;
  }

  async _loadSays(page = 1) {
    this.state.loading = true;
    this.state.error = null;
    this._renderList();

    try {
      const response = await this.api.fetchSays(page, this.config.pageSize || 10);
      this.state.says = response.data || [];
      this.state.currentPage = response.pagination.page;
      this.state.totalPages = response.pagination.total;
      this.state.loading = false;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : '加载说说失败';
      this.state.loading = false;
    }
    this._renderList();
  }

  _render() {
    if (!this.mountPoint) return;
    const headerEl = document.createElement('div');
    headerEl.className = 'vwd-says-header';
    headerEl.innerHTML = `<h3 class="vwd-says-title">说说</h3>`;
    this.mountPoint.appendChild(headerEl);

    const listContainer = document.createElement('div');
    this.mountPoint.appendChild(listContainer);

    this.sayList = new SayList(listContainer, {
      says: this.state.says,
      loading: this.state.loading,
      error: this.state.error,
      currentPage: this.state.currentPage,
      totalPages: this.state.totalPages,
      apiOrigin: this.config.apiOrigin || '',
      enableComments: this.config.enableComments !== false,
      emojiPacks: this.config.emojiPacks || [],
      onLike: (id) => this._handleLike(id),
      onPrevPage: () => this._goToPage(this.state.currentPage - 1),
      onNextPage: () => this._goToPage(this.state.currentPage + 1),
      onGoToPage: (page) => this._goToPage(page),
      t: (key) => {
        const map = { loading: '加载中...', sayEmpty: '暂无说说' };
        return map[key] || key;
      },
    });
    this.sayList.render();
  }

  _renderList() {
    if (!this.sayList) return;
    this.sayList.setProps({
      says: this.state.says,
      loading: this.state.loading,
      error: this.state.error,
      currentPage: this.state.currentPage,
      totalPages: this.state.totalPages,
    });
  }

  async _handleLike(id) {
    try {
      const result = await this.api.likeSay(id);
      return result;
    } catch (e) {
      return null;
    }
  }

  _goToPage(page) {
    if (page >= 1 && page <= this.state.totalPages) {
      this._loadSays(page);
    }
  }

  _handleImageClick(e) {
    const target = e.target;
    if (target.tagName === 'IMG' && target.closest('.vwd-say-content')) {
      if (target.classList.contains('vwd-emotion-img')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (this.imagePreview) {
        this.imagePreview.open(target.src);
      }
    }
  }

  _applyPrimaryColor() {
    if (!this.mountPoint) return;
    const color = this.config.primaryColor;
    if (!color || typeof color !== 'string' || color.trim() === '') return;
    const trimmed = color.trim();
    if (!/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return;
    this.mountPoint.style.setProperty('--vwd-primary', trimmed);
    const hover = this._darkenHex(trimmed, 0.12);
    if (hover) {
      this.mountPoint.style.setProperty('--vwd-primary-hover', hover);
    }
  }

  _darkenHex(hex, amount) {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (h.length !== 6 && h.length !== 8) return null;
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const factor = 1 - amount;
    const dr = Math.round(r * factor);
    const dg = Math.round(g * factor);
    const db = Math.round(b * factor);
    return '#' + [dr, dg, db].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  getConfig() {
    return { ...this.config };
  }
}
