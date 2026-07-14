/**
 * CommentForm 评论表单组件
 */
import { Component } from './Component.js';
import { AdminAuthModal } from './AdminAuthModal.js';
import { EmojiPicker } from './EmojiPicker.js';
import { auth } from '../utils/auth.js';
import { renderMarkdown } from '../utils/markdown.js';
import { replaceEmotionSyntax } from '../utils/emotion.js';

export class CommentForm extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.t = props.t || ((k) => k);
    const initialForm = props.form || {};
    this.state = {
      localForm: {
        name: initialForm.name || '',
        email: initialForm.email || '',
        url: initialForm.url || '',
        content: initialForm.content || '',
      },
      activeTab: 'write',
      showPreview: false,
      showEmojiPicker: false,
    };
    this.modal = null;
    this.emojiPicker = null;
  }

  render() {
    const { formErrors, submitting } = this.props;
    const { localForm } = this.state;

    const canSubmit = localForm.name.trim() && localForm.email.trim() && localForm.content.trim();
    const isAdmin = this.props.adminEmail && localForm.email.trim() === this.props.adminEmail;
    const isVerified = isAdmin && auth.hasToken();
    const placeholderText = this.props.placeholder || '';

    const root = this.createElement('form', {
      className: 'vwd-comment-form',
      attributes: {
        novalidate: true,
        onSubmit: (e) => this.handleSubmit(e),
      },
      children: [
        this.createTextElement('h3', this.t('formTitle'), 'vwd-form-title'),

        this.createElement('div', {
          className: 'vwd-form-fields',
          children: [
            this.createElement('div', {
              className: 'vwd-form-row',
              children: [
                this.createFormField(this.t('nickname'), 'text', 'name', localForm.name, formErrors.name),
                this.createElement('div', {
                  className: 'vwd-form-field-wrapper',
                  children: [
                    this.createFormField(this.t('email'), 'email', 'email', localForm.email, formErrors.email),
                    isVerified
                      ? this.createElement('div', {
                          className: 'vwd-admin-controls',
                          children: [
                            this.createElement('button', {
                              className: 'vwd-btn-text',
                              text: this.t('verifyAdmin'),
                              attributes: {
                                type: 'button',
                                title: '清除管理员凭证',
                                onClick: () => {
                                  auth.clearToken();
                                  this.render();
                                },
                              },
                            }),
                          ],
                        })
                      : null,
                  ],
                }),
                this.createFormField(this.t('website'), 'url', 'url', localForm.url, formErrors.url),
              ],
            }),

            this.createElement('div', {
              className: 'vwd-form-field',
              children: [
                this.createTextElement('label', this.t('writeComment'), 'vwd-form-label'),
                this.createElement('textarea', {
                  className: `vwd-form-textarea ${formErrors.content ? 'vwd-input-error' : ''}`,
                  attributes: {
                    rows: 4,
                    placeholder: placeholderText,
                    disabled: submitting,
                    onInput: (e) => this.handleFieldChange('content', e.target.value),
                    onKeydown: (e) => this.handleContentKeydown(e),
                  },
                }),
                ...(formErrors.content ? [this.createTextElement('span', formErrors.content, 'vwd-error-text')] : []),
              ],
            }),
          ],
        }),

        this.createElement('div', {
          className: 'vwd-form-actions',
          children: [
            ...(this.props.enableEmoji !== false ? [
              this.createElement('div', {
                className: 'vwd-emoji-btn-wrapper',
                children: [
                  this.createElement('button', {
                    className: 'vwd-btn vwd-btn-secondary vwd-btn-emoji',
                    attributes: {
                      type: 'button',
                      disabled: submitting,
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
              className: `vwd-btn vwd-btn-secondary vwd-btn-preview ${this.state.showPreview ? 'vwd-btn-active' : ''}`,
              attributes: {
                type: 'button',
                disabled: submitting || !localForm.content?.trim(),
                style: localForm.content?.trim() ? '' : 'display:none;',
                onClick: () => this.togglePreview(),
              },
              text: this.state.showPreview ? this.t('close') : this.t('preview'),
            }),
            this.createElement('button', {
              className: 'vwd-btn vwd-btn-primary',
              attributes: {
                type: 'submit',
                disabled: submitting || !canSubmit,
              },
              text: submitting ? this.t('submitting') : this.t('submit'),
            }),
          ],
        }),

        ...(this.state.showPreview && localForm.content
          ? [
              this.createElement('div', {
                className: 'vwd-preview-container',
                children: [
                  this.createElement('div', {
                    className: 'vwd-preview-content vwd-comment-content',
                    html: renderMarkdown(replaceEmotionSyntax(localForm.content, this.props.emotionUrl || '')),
                  }),
                ],
              }),
            ]
          : []),
      ],
    });

    this.setInputValues(root, localForm);

    const emojiContainer = root.querySelector('.vwd-emoji-picker-container');
    if (emojiContainer && this.props.enableEmoji !== false) {
      this.emojiPicker = new EmojiPicker(emojiContainer, {
        emotionUrl: this.props.emotionUrl || '',
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
    if (!this.props.submitting && this.props.form !== prevProps.form) {
      const currentName = this.state.localForm.name || '';
      const currentEmail = this.state.localForm.email || '';
      const currentUrl = this.state.localForm.url || '';
      const currentContent = this.state.localForm.content || '';

      this.state.localForm = {
        name: this.props.form.name || currentName,
        email: this.props.form.email || currentEmail,
        url: this.props.form.url || currentUrl,
        content: this.props.form.content !== undefined ? this.props.form.content : currentContent,
      };

      if (this.elements.root) {
        this.setInputValues(this.elements.root, this.state.localForm);
      }
    }

    if (this.elements.root) {
      this.updateFormState();
    }
  }

  updateFormState() {
    const { formErrors, submitting } = this.props;
    const { localForm } = this.state;

    const canSubmit = localForm.name.trim() && localForm.email.trim() && localForm.content.trim();

    const submitBtn = this.elements.root.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = submitting || !canSubmit;
      submitBtn.textContent = submitting ? this.t('submitting') : this.t('submit');
    }

    const previewBtn = this.elements.root.querySelector('.vwd-btn-preview');
    if (previewBtn) {
      const hasContent = !!localForm.content?.trim();
      previewBtn.disabled = submitting || !hasContent;
      previewBtn.style.display = hasContent ? '' : 'none';
      if (!hasContent) {
        this.state.showPreview = false;
        const previewContainer = this.elements.root.querySelector('.vwd-preview-container');
        if (previewContainer) {
          previewContainer.remove();
        }
        previewBtn.textContent = this.t('preview');
      } else {
        previewBtn.textContent = this.state.showPreview ? this.t('close') : this.t('preview');
      }
    }

    const inputs = this.elements.root.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      input.disabled = submitting;
    });

    this.updateErrors(formErrors);
  }

  updateErrors(formErrors) {
    if (!this.elements.root) return;

    const nameInput = this.elements.root.querySelector('input[name="name"]');
    this.updateFieldError(nameInput, formErrors?.name);

    const emailInput = this.elements.root.querySelector('input[name="email"]');
    this.updateFieldError(emailInput, formErrors?.email);

    const urlInput = this.elements.root.querySelector('input[name="url"]');
    this.updateFieldError(urlInput, formErrors?.url);

    const contentTextarea = this.elements.root.querySelector('textarea');
    this.updateFieldError(contentTextarea, formErrors?.content);
  }

  updateFieldError(element, error) {
    if (!element) return;

    if (error) {
      element.classList.add('vwd-input-error');
    } else {
      element.classList.remove('vwd-input-error');
    }

    const parent = element.parentElement;
    let errorSpan = parent.querySelector('.vwd-error-text');
    if (error) {
      if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'vwd-error-text';
        parent.appendChild(errorSpan);
      }
      errorSpan.textContent = error;
    } else if (errorSpan) {
      errorSpan.remove();
    }
  }

  createFormField(label, type, fieldName, value, error, placeholder = '') {
    return this.createElement('div', {
      className: 'vwd-form-field',
      children: [
        this.createTextElement('label', label, 'vwd-form-label'),
        this.createElement('input', {
          className: `vwd-form-input ${error ? 'vwd-input-error' : ''}`,
          attributes: {
            type,
            name: fieldName,
            value: value || '',
            disabled: this.props.submitting,
            onInput: (e) => this.handleFieldChange(fieldName, e.target.value),
            onBlur: (e) => {
              if (fieldName === 'email') this.handleEmailBlur(e.target.value);
            },
            onKeydown: (e) => this.handleContentKeydown(e),
          },
        }),
        ...(error ? [this.createTextElement('span', error, 'vwd-error-text')] : []),
      ],
    });
  }

  setInputValues(root, form) {
    const nameInput = root.querySelector('input[name="name"]');
    const emailInput = root.querySelector('input[name="email"]');
    const urlInput = root.querySelector('input[name="url"]');
    const contentTextarea = root.querySelector('textarea');

    if (nameInput) nameInput.value = form.name || '';
    if (emailInput) emailInput.value = form.email || '';
    if (urlInput) urlInput.value = form.url || '';
    if (contentTextarea) contentTextarea.value = form.content || '';
  }

  togglePreview() {
    this.state.showPreview = !this.state.showPreview;
    this.render();
  }

  handleFieldChange(field, value) {
    this.state.localForm[field] = value;
    if (this.props.onFieldChange) {
      this.props.onFieldChange(field, value);
    }
    if (this.elements.root) {
      this.updateFormState();
      if (field === 'content' && this.state.showPreview) {
        this.updatePreviewContent(value);
      }
    }
  }

  handleContentKeydown(e) {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.stopPropagation();
    }
  }

  updatePreviewContent(content) {
    const previewContent = this.elements.root?.querySelector('.vwd-preview-content');
    if (previewContent) {
      previewContent.innerHTML = renderMarkdown(replaceEmotionSyntax(content, this.props.emotionUrl || ''));
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
      this.handleFieldChange('content', newValue);
      if (this.state.showPreview) {
        this.updatePreviewContent(newValue);
      }
    }
    this.state.showEmojiPicker = false;
  }

  handleSubmit(e) {
    e.preventDefault();
    const email = this.state.localForm.email?.trim();
    const adminEmail = this.props.adminEmail;
    if (adminEmail && email && email === adminEmail && !auth.hasToken()) {
      this.showAuthModal();
      return;
    }
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.localForm);
    }
  }

  async handleEmailBlur(email) {
    if (!email || !this.props.adminEmail) return;
    if (email.trim() === this.props.adminEmail) {
      if (auth.hasToken()) return;
      this.showAuthModal();
    }
  }

  showAuthModal() {
    let modalContainer = this.elements.root.querySelector('.vwd-modal-container');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.className = 'vwd-modal-container';
      this.elements.root.appendChild(modalContainer);
    }

    this.modal = new AdminAuthModal(modalContainer, {
      onCancel: () => {
        this.modal.destroy();
        this.modal = null;
      },
      onSubmit: async (key) => {
        if (this.props.onVerifyAdmin) {
          await this.props.onVerifyAdmin(key);
          auth.saveToken(key);
          this.modal.destroy();
          this.modal = null;
          this.render();
        }
      },
      t: this.t
    });
    this.modal.render();
  }
}
