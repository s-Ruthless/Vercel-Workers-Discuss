/**
 * ReplyEditor 回复编辑器组件
 */
import { Component } from './Component.js';
import { EmojiPicker } from './EmojiPicker.js';
import { renderMarkdown } from '../utils/markdown.js';
import { replaceEmojiSyntax } from '../utils/emotion.js';

export class ReplyEditor extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.t = props.t || ((k) => k);
    const { currentUser } = props;
    this.state = {
      content: props.content || '',
      showUserInfo: !currentUser || !currentUser.name || !currentUser.email,
      showPreview: false,
      showEmojiPicker: false,
    };
    this.emojiPicker = null;
  }

  render() {
    const { currentUser } = this.props;
    const { showUserInfo } = this.state;
    const placeholderText = this.props.placeholder || '';

    const root = this.createElement('div', {
      className: 'vwd-reply-editor',
      children: [
        this.createElement('div', {
          className: 'vwd-reply-header',
          children: [
            this.createTextElement('span', `${this.t('reply')} @${this.props.replyToAuthor}`, 'vwd-reply-to'),
            this.createElement('button', {
              className: 'vwd-btn-close',
              attributes: {
                type: 'button',
                onClick: () => this.handleCancel(),
              },
              text: '✕',
            }),
          ],
        }),

        ...(showUserInfo
          ? [
              this.createElement('div', {
                className: 'vwd-form-row',
                attributes: {
                  style: 'margin-bottom: 12px;',
                },
                children: [
                  this.createFormField(this.t('nickname'), 'text', 'name', currentUser?.name),
                  this.createFormField(this.t('email'), 'email', 'email', currentUser?.email),
                  this.createFormField(this.t('website'), 'url', 'url', currentUser?.url),
                ],
              }),
            ]
          : []),

        this.createElement('textarea', {
          className: 'vwd-reply-textarea',
          attributes: {
            rows: 3,
            placeholder: placeholderText,
            disabled: this.props.submitting,
            onInput: (e) => this.handleInput(e),
            onKeydown: (e) => this.handleTextareaKeydown(e),
          },
        }),

        ...(this.props.error
          ? [
              this.createElement('div', {
                className: 'vwd-error-inline vwd-error-small',
                children: [
                  this.createTextElement('span', this.props.error),
                  this.createElement('button', {
                    className: 'vwd-error-close',
                    attributes: {
                      type: 'button',
                      onClick: () => this.handleClearError(),
                    },
                    text: '✕',
                  }),
                ],
              }),
            ]
          : []),

        this.createElement('div', {
          className: 'vwd-reply-actions',
          children: [
            ...(this.props.enableEmoji !== false ? [
              this.createElement('div', {
                className: 'vwd-emoji-btn-wrapper',
                children: [
                  this.createElement('button', {
                    className: 'vwd-btn vwd-btn-secondary vwd-btn-emoji vwd-btn-small',
                    attributes: {
                      type: 'button',
                      disabled: this.props.submitting,
                      onClick: (e) => {
                        e.preventDefault();
                        this.toggleEmojiPicker();
                      },
                    },
                    text: '😊 ' + this.t('emoji'),
                  }),
                  this.createElement('div', {
                    className: 'vwd-emoji-picker-container',
                  }),
                ],
              }),
            ] : []),
            this.createElement('button', {
              className: `vwd-btn vwd-btn-secondary vwd-btn-small vwd-btn-preview ${this.state.showPreview ? 'vwd-btn-active' : ''}`,
              attributes: {
                type: 'button',
                disabled: this.props.submitting || !this.state.content.trim(),
                onClick: () => this.togglePreview(),
              },
              text: this.state.showPreview ? this.t('close') : this.t('preview'),
            }),
            this.createElement('button', {
              className: 'vwd-btn vwd-btn-primary vwd-btn-small',
              attributes: {
                type: 'button',
                disabled: this.props.submitting || !this.state.content.trim(),
                onClick: () => this.handleSubmit(),
              },
              text: this.props.submitting ? this.t('submitting') : this.t('submit'),
            }),
            this.createElement('button', {
              className: 'vwd-btn vwd-btn-secondary vwd-btn-small',
              attributes: {
                type: 'button',
                disabled: this.props.submitting,
                onClick: () => this.handleCancel(),
              },
              text: this.t('cancel'),
            }),
          ],
        }),

        ...(this.state.showPreview && this.state.content
          ? [
              this.createElement('div', {
                className: 'vwd-preview-container',
                children: [
                  this.createElement('div', {
                    className: 'vwd-preview-content vwd-comment-content',
                    html: renderMarkdown(replaceEmojiSyntax(this.state.content, this.props.emojiPacks || [])),
                  }),
                ],
              }),
            ]
          : []),
      ],
    });

    const textarea = root.querySelector('textarea');
    if (textarea) {
      textarea.value = this.state.content;
    }

    const emojiContainer = root.querySelector('.vwd-emoji-picker-container');
    if (emojiContainer && this.props.enableEmoji !== false) {
      this.emojiPicker = new EmojiPicker(emojiContainer, {
        emojiPacks: this.props.emojiPacks || [],
        onSelect: (insertText) => this.insertEmoji(insertText),
        onClose: () => { this.state.showEmojiPicker = false; },
      });
      this.emojiPicker.render();
      if (this.state.showEmojiPicker) {
        this.emojiPicker.open();
      }
    }

    this.elements.root = root;
    this.empty(this.container);
    this.container.appendChild(root);
  }

  updateProps(prevProps) {
    if (this.props.content !== this.state.content && this.props.content !== prevProps?.content) {
      this.state.content = this.props.content;
      this.render();
      return;
    }

    // 更新表情选择器
    if (this.emojiPicker && this.props.emojiPacks !== prevProps?.emojiPacks) {
      this.emojiPicker.setProps({ emojiPacks: this.props.emojiPacks || [] });
    }

    if (JSON.stringify(this.props.currentUser) !== JSON.stringify(prevProps?.currentUser)) {
      this.render();
      return;
    }

    if (this.props.error !== prevProps?.error) {
      this.render();
      return;
    }

    if (this.props.submitting !== prevProps?.submitting) {
      this.render();
      return;
    }
  }

  handleTextareaKeydown(e) {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.stopPropagation();
    }
  }

  togglePreview() {
    this.state.showPreview = !this.state.showPreview;
    this.render();
  }

  handleInput(e) {
    this.state.content = e.target.value;

    const submitBtn = this.elements.root?.querySelector('.vwd-btn-primary');
    if (submitBtn) {
      submitBtn.disabled = this.props.submitting || !this.state.content.trim();
    }

    const previewBtn = this.elements.root?.querySelector('.vwd-btn-preview');
    if (previewBtn) {
      previewBtn.disabled = this.props.submitting || !this.state.content.trim();
    }

    if (this.props.onUpdate) {
      this.props.onUpdate(this.state.content);
    }

    if (this.state.showPreview) {
      this.updatePreviewContent(this.state.content);
    }
  }

  updatePreviewContent(content) {
    const previewContent = this.elements.root?.querySelector('.vwd-preview-content');
    if (previewContent) {
      previewContent.innerHTML = renderMarkdown(replaceEmojiSyntax(content, this.props.emojiPacks || []));
    }
  }

  toggleEmojiPicker() {
    this.state.showEmojiPicker = !this.state.showEmojiPicker;
    if (this.emojiPicker) {
      if (this.state.showEmojiPicker) {
        this.emojiPicker.open();
      } else {
        this.emojiPicker.close();
      }
    }
  }

  insertEmoji(insertText) {
    const textarea = this.elements.root?.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.slice(0, start) + insertText + value.slice(end);
      textarea.value = newValue;
      const newPos = start + insertText.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
      this.state.content = newValue;
      if (this.props.onUpdate) {
        this.props.onUpdate(newValue);
      }
      if (this.state.showPreview) {
        this.updatePreviewContent(newValue);
      }
    }
    this.state.showEmojiPicker = false;
  }

  handleSubmit() {
    if (this.props.onSubmit) {
      this.props.onSubmit();
    }
  }

  handleCancel() {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }

  handleClearError() {
    if (this.props.onClearError) {
      this.props.onClearError();
    }
  }

  setContent(content) {
    this.state.content = content;
    const textarea = this.elements.root?.querySelector('textarea');
    if (textarea) {
      textarea.value = content;
    }
  }

  getContent() {
    return this.state.content;
  }

  focus() {
    const textarea = this.elements.root?.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  }

  handleUserInfoChange(field, value) {
    if (this.props.onUpdateUserInfo) {
      this.props.onUpdateUserInfo(field, value);
    }
  }

  createFormField(placeholder, type, field, value) {
    return this.createElement('div', {
      className: 'vwd-form-field',
      children: [
        this.createElement('input', {
          className: 'vwd-form-input',
          attributes: {
            type,
            placeholder,
            value: value || '',
            disabled: this.props.submitting,
            onInput: (e) => this.handleUserInfoChange(field, e.target.value),
            onKeydown: (e) => this.handleTextareaKeydown(e),
          },
        }),
      ],
    });
  }
}
