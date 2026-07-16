/**
 * 说说列表组件
 */
import { SayItem } from './SayItem.js';
import { Pagination } from './Pagination.js';
import { Loading } from './Loading.js';

export class SayList {
  constructor(container, props) {
    this.container = container;
    this.props = props;
    this.sayItemInstances = new Map();
  }

  setProps(props) {
    this.props = { ...this.props, ...props };
    this.render();
  }

  render() {
    if (!this.container) return;
    const { says, loading, error, currentPage, totalPages, t } = this.props;

    this.container.innerHTML = '';

    if (loading) {
      const loadingEl = document.createElement('div');
      this.container.appendChild(loadingEl);
      new Loading(loadingEl, { text: t ? t('loading') : '加载中...' }).render();
      return;
    }

    if (error) {
      this.container.innerHTML = `<div class="vwd-say-error">${error}</div>`;
      return;
    }

    if (!says || says.length === 0) {
      this.container.innerHTML = `<div class="vwd-say-empty">${t ? t('sayEmpty') : '暂无说说'}</div>`;
      return;
    }

    const listEl = document.createElement('div');
    listEl.className = 'vwd-say-list';
    this.container.appendChild(listEl);

    this.sayItemInstances.clear();

    for (const say of says) {
      const itemContainer = document.createElement('div');
      listEl.appendChild(itemContainer);

      const item = new SayItem(itemContainer, {
        say,
        apiOrigin: this.props.apiOrigin,
        enableComments: this.props.enableComments,
        emojiPacks: this.props.emojiPacks || [],
        liked: false,
        onLike: this.props.onLike,
        t: this.props.t,
      });
      item.render();
      this.sayItemInstances.set(say.id, item);
    }

    // Pagination
    if (totalPages > 1) {
      const paginationContainer = document.createElement('div');
      this.container.appendChild(paginationContainer);
      const pagination = new Pagination(paginationContainer, {
        currentPage,
        totalPages,
        onPrevPage: () => this.props.onPrevPage(),
        onNextPage: () => this.props.onNextPage(),
        onGoToPage: (page) => this.props.onGoToPage(page),
        t: this.props.t,
      });
      pagination.render();
    }
  }
}
