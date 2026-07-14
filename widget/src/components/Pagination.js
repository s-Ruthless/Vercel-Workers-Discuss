/**
 * Pagination 分页组件
 */
import { Component } from './Component.js';

export class Pagination extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.state = {
      currentPage: props.currentPage || 1,
      totalPages: props.totalPages || 1
    };
  }

  getDisplayedPages() {
    const { currentPage, totalPages } = this.state;
    const pages = [];
    const maxVisible = 5;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    for (let i = end - maxVisible + 1; i <= end; i++) {
      if (i >= 1) {
        pages.push(i);
      }
    }

    return pages.slice(0, maxVisible);
  }

  render() {
    if (this.state.totalPages <= 1) {
      this.empty(this.container);
      return;
    }

    const displayedPages = this.getDisplayedPages();

    const root = this.createElement('div', {
      className: 'vwd-pagination',
      children: [
        this.createElement('button', {
          className: 'vwd-page-btn',
          attributes: {
            type: 'button',
            disabled: this.state.currentPage === 1,
            onClick: () => this.handlePrev()
          },
          text: '上一页'
        }),
        this.createElement('div', {
          className: 'vwd-page-numbers',
          children: displayedPages.map(page =>
            this.createElement('button', {
              className: `vwd-page-num ${page === this.state.currentPage ? 'vwd-page-num-active' : ''}`,
              attributes: {
                type: 'button',
                onClick: () => this.handleGoTo(page)
              },
              text: page.toString()
            })
          )
        }),
        this.createElement('button', {
          className: 'vwd-page-btn',
          attributes: {
            type: 'button',
            disabled: this.state.currentPage === this.state.totalPages,
            onClick: () => this.handleNext()
          },
          text: '下一页'
        })
      ]
    });

    this.elements.root = root;
    this.empty(this.container);
    this.container.appendChild(root);
  }

  updateProps() {
    this.state.currentPage = this.props.currentPage;
    this.state.totalPages = this.props.totalPages;
    this.render();
  }

  handlePrev() {
    if (this.props.onPrev) this.props.onPrev();
  }

  handleNext() {
    if (this.props.onNext) this.props.onNext();
  }

  handleGoTo(page) {
    if (this.props.onGoTo) this.props.onGoTo(page);
  }
}
