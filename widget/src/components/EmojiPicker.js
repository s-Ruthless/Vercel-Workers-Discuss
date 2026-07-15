/**
 * EmojiPicker 表情选择器组件 (Waline 风格)
 * 支持前端配置表情包，使用 :prefix_item: 短代码
 */
import { Component } from './Component.js';
import { getEmojiUrl, getTabIconUrl } from '../utils/emotion.js';

export class EmojiPicker extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.state = {
      activeCategory: 0,
      open: false,
      loading: false,
      loaded: false,
    };
    this._outsideClickHandler = null;
  }

  _buildGridChildren() {
    const packs = this.props.emojiPacks || [];
    if (packs.length === 0) {
      return [
        this.createElement('div', {
          className: 'vwd-emoji-empty',
          text: '...',
        }),
      ];
    }

    const activePack = packs[this.state.activeCategory];
    if (!activePack || !activePack.items) return [];

    const self = this;
    const gridItems = activePack.items.map(function (item) {
      const title = activePack.textMap && activePack.textMap[item] ? activePack.textMap[item] : item;
      if (activePack.type === 'text') {
        // 文本表情：直接显示文本
        return self.createElement('div', {
          className: 'vwd-emoji-item vwd-emoji-item-text',
          attributes: {
            title: title,
            onClick: function () { self.handleSelectText(item); },
          },
          text: item,
        });
      }
      // 图片表情
      const imgUrl = getEmojiUrl(activePack, item);
      return self.createElement('div', {
        className: 'vwd-emoji-item',
        attributes: {
          title: title,
          onClick: function () { self.handleSelect(activePack.prefix, item); },
        },
        children: [
          self.createElement('img', {
            attributes: {
              src: imgUrl,
              alt: title,
              loading: 'lazy',
              referrerpolicy: 'no-referrer',
            },
          }),
        ],
      });
    });

    // Tab 栏：显示每个包的代表图标或名称
    const tabs = packs.map(function (pack, index) {
      const tabChildren = [];
      if (pack.type === 'text') {
        // 文本表情包：显示名称
        tabChildren.push(self.createTextNode(pack.name || '颜'));
      } else {
        const iconUrl = getTabIconUrl(pack);
        if (iconUrl) {
          tabChildren.push(self.createElement('img', {
            attributes: {
              src: iconUrl,
              alt: pack.name,
              loading: 'lazy',
              referrerpolicy: 'no-referrer',
            },
          }));
        } else {
          tabChildren.push(self.createTextNode(pack.name || ''));
        }
      }
      return self.createElement('div', {
        className: 'vwd-emoji-tab ' + (index === self.state.activeCategory ? 'vwd-emoji-tab-active' : ''),
        attributes: {
          onClick: function (e) { self.handleTabChange(index, e); },
          title: pack.name || '',
        },
        children: tabChildren,
      });
    });

    return [
      this.createElement('div', {
        className: 'vwd-emoji-grid',
        children: gridItems,
      }),
      this.createElement('div', {
        className: 'vwd-emoji-tabs',
        children: tabs,
      }),
    ];
  }

  render() {
    const packs = this.props.emojiPacks || [];
    const isLoading = this.state.loading && packs.length === 0;

    let panelChildren = [];
    if (isLoading) {
      panelChildren = [
        this.createElement('div', {
          className: 'vwd-emoji-loading',
          text: '...',
        }),
      ];
    } else {
      panelChildren = this._buildGridChildren();
    }

    let rootChildren = [];
    if (this.state.open) {
      rootChildren = [
        this.createElement('div', {
          className: 'vwd-emoji-panel',
          children: panelChildren,
        }),
      ];
    }

    const root = this.createElement('div', {
      className: 'vwd-emoji-picker',
      children: rootChildren,
    });

    this.elements.root = root;
    this.empty(this.container);
    this.container.appendChild(root);
  }

  _bindOutsideClick() {
    const self = this;
    this._outsideClickHandler = function (e) {
      if (!self.container) return;
      if (self.container.contains(e.target)) return;
      self.close();
    };
    setTimeout(function () {
      document.addEventListener('click', self._outsideClickHandler);
    }, 0);
  }

  _unbindOutsideClick() {
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
  }

  updateProps(prevProps) {
    const oldPacks = prevProps?.emojiPacks;
    const newPacks = this.props.emojiPacks;
    if (oldPacks !== newPacks) {
      this.render();
    }
  }

  async toggle() {
    this.state.open = !this.state.open;
    if (this.state.open) {
      this.render();
      this._bindOutsideClick();
    } else {
      this._unbindOutsideClick();
      this.render();
    }
  }

  async open() {
    this.state.open = true;
    this.render();
    this._bindOutsideClick();
  }

  close() {
    this.state.open = false;
    this._unbindOutsideClick();
    this.render();
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  destroy() {
    this._unbindOutsideClick();
    super.destroy && super.destroy();
  }

  handleTabChange(index, e) {
    if (e) { e.stopPropagation(); }
    this.state.activeCategory = index;
    this.render();
  }

  handleSelect(prefix, item) {
    const insertText = ` :${prefix}${item}: `;
    if (this.props.onSelect) {
      this.props.onSelect(insertText);
    }
    this.close();
  }

  handleSelectText(text) {
    const insertText = ` ${text} `;
    if (this.props.onSelect) {
      this.props.onSelect(insertText);
    }
    this.close();
  }
}
