/**
 * EmojiPicker 表情选择器组件
 * 表情数据从后端 /api/emotions 接口异步获取
 */
import { Component } from './Component.js';
import { fetchEmotionData, getEmotionImageUrl } from '../utils/emotion.js';

export class EmojiPicker extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.state = {
      activeCategory: 0,
      open: false,
      owoData: {},
      loading: false,
      loaded: false,
    };
    this._outsideClickHandler = null;
  }

  async _loadData() {
    if (this.state.loaded || this.state.loading) return;
    this.state.loading = true;
    this.render();
    const data = await fetchEmotionData();
    this.state.owoData = data;
    this.state.loaded = true;
    this.state.loading = false;
    this.render();
  }

  _buildGridChildren(emotionUrl) {
    const categories = Object.keys(this.state.owoData);
    if (categories.length === 0) {
      return [
        this.createElement('div', {
          className: 'vwd-emoji-empty',
          text: '...',
        }),
      ];
    }
    const activeKey = categories[this.state.activeCategory];
    const activeData = this.state.owoData[activeKey];
    if (!activeData || !activeData.container) return [];

    const self = this;
    const gridItems = activeData.container.map(function (item) {
      if (activeData.type === 'image') {
        const packageName = activeData.name;
        const imgUrl = getEmotionImageUrl(packageName, item.icon, emotionUrl);
        return self.createElement('div', {
          className: 'vwd-emoji-item',
          attributes: {
            title: item.text || item.icon,
            onClick: function () { self.handleSelect(packageName, item.icon, 'image'); },
          },
          children: [
            self.createElement('img', {
              attributes: {
                src: imgUrl,
                alt: item.text || item.icon,
                loading: 'eager',
                referrerpolicy: 'no-referrer',
              },
            }),
          ],
        });
      }
      return self.createElement('div', {
        className: 'vwd-emoji-item vwd-emoji-item-text',
        attributes: {
          title: item.text || item.icon,
          onClick: function () { self.handleSelect(null, item.icon, 'text'); },
        },
        text: item.icon,
      });
    });

    const tabs = categories.map(function (cat, index) {
      return self.createElement('div', {
        className: 'vwd-emoji-tab ' + (index === self.state.activeCategory ? 'vwd-emoji-tab-active' : ''),
        attributes: {
          onClick: function (e) { self.handleTabChange(index, e); },
        },
        text: cat,
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
    const emotionUrl = this.props.emotionUrl;
    const isLoading = this.state.loading && !this.state.loaded;

    let panelChildren = [];
    if (isLoading) {
      panelChildren = [
        this.createElement('div', {
          className: 'vwd-emoji-loading',
          text: '...',
        }),
      ];
    } else {
      panelChildren = this._buildGridChildren(emotionUrl);
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
    if (this.props.emotionUrl !== prevProps?.emotionUrl) {
      this.render();
    }
  }

  async toggle() {
    this.state.open = !this.state.open;
    if (this.state.open) {
      if (!this.state.loaded) {
        await this._loadData();
      } else {
        this.render();
      }
      this._bindOutsideClick();
    } else {
      this._unbindOutsideClick();
      this.render();
    }
  }

  async open() {
    this.state.open = true;
    if (!this.state.loaded) {
      await this._loadData();
    } else {
      this.render();
    }
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

  handleSelect(packageName, iconName, type) {
    let insertText;
    if (type === 'image') {
      insertText = ' ::' + packageName + ':' + iconName + ':: ';
    } else {
      insertText = iconName;
    }

    if (this.props.onSelect) {
      this.props.onSelect(insertText);
    }

    this.close();
  }
}
