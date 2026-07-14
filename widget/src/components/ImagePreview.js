/**
 * ImagePreview 图片预览组件
 */
import { Component } from './Component.js';

export class ImagePreview extends Component {
  constructor(container) {
    super(container);
    this.visible = false;
    this.imageUrl = '';
  }

  render() {
    if (!this.visible) {
      if (this.elements.root) {
        this.elements.root.remove();
        this.elements.root = null;
      }
      return;
    }

    const root = this.createElement('div', {
      className: 'vwd-image-preview-overlay',
      attributes: {
        role: 'dialog',
        'aria-modal': 'true',
        onClick: (e) => this.handleOverlayClick(e)
      },
      children: [
        this.createElement('div', {
          className: 'vwd-image-preview-content',
          children: [
            this.createElement('img', {
              className: 'vwd-image-preview-img',
              attributes: {
                src: this.imageUrl,
                alt: 'Preview'
              }
            }),
            this.createElement('button', {
              className: 'vwd-image-preview-close',
              attributes: {
                type: 'button',
                'aria-label': 'Close preview',
                onClick: () => this.close()
              },
              html: '&times;'
            })
          ]
        })
      ]
    });

    this.elements.root = root;
    this.container.appendChild(root);
  }

  open(url) {
    this.imageUrl = url;
    this.visible = true;
    this.render();
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.visible = false;
    this.imageUrl = '';
    this.render();
    document.body.style.overflow = '';
  }

  handleOverlayClick(e) {
    if (e.target.classList.contains('vwd-image-preview-overlay') ||
        e.target.classList.contains('vwd-image-preview-content')) {
      this.close();
    }
  }
}
