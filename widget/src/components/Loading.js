/**
 * Loading 组件
 */
import { Component } from './Component.js';

export class Loading extends Component {
  constructor(container, props = {}) {
    super(container, {
      text: '加载中...',
      ...props
    });
  }

  render() {
    const root = this.createElement('div', {
      className: 'vwd-loading',
      children: [
        this.createElement('div', { className: 'vwd-spinner' }),
        this.createTextElement('span', this.props.text, 'vwd-loading-text')
      ]
    });

    this.elements.root = root;
    this.empty(this.container);
    this.container.appendChild(root);
  }

  setText(text) {
    this.props.text = text;
    const textEl = this.elements.root?.querySelector('.vwd-loading-text');
    if (textEl) {
      textEl.textContent = text;
    }
  }
}
