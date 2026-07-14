/**
 * AdminAuthModal 管理员验证弹窗
 */
import { Component } from './Component.js';

export class AdminAuthModal extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.t = props.t || ((k) => k);
    this.state = {
      key: '',
      error: '',
      loading: false
    };
    this.elements = {
      input: null,
      error: null,
      submitBtn: null
    };
  }

  render() {
    const { key, error, loading } = this.state;

    const overlay = this.createElement('div', {
      className: 'vwd-modal-overlay',
      children: [
        this.createElement('div', {
          className: 'vwd-modal',
          children: [
            this.createTextElement('h3', this.t('verifyAdminTitle'), 'vwd-modal-title'),
            this.createElement('div', {
              className: 'vwd-modal-body',
              children: [
                this.createTextElement('p', this.t('verifyAdminDesc'), 'vwd-modal-desc'),
                this.createElement('input', {
                  className: `vwd-form-input ${error ? 'vwd-input-error' : ''}`,
                  attributes: {
                    type: 'password',
                    placeholder: this.t('adminKeyPlaceholder'),
                    value: key,
                    disabled: loading,
                    onInput: (e) => this.setState({ key: e.target.value, error: '' }),
                    onKeydown: (e) => {
                      if (e.key === 'Enter') this.handleSubmit();
                    }
                  }
                }),
                error ? this.createTextElement('div', error, 'vwd-error-text') : null
              ]
            }),
            this.createElement('div', {
              className: 'vwd-modal-actions',
              children: [
                this.createElement('button', {
                  className: 'vwd-btn vwd-btn-secondary',
                  text: this.t('cancel'),
                  attributes: {
                    type: 'button',
                    disabled: loading,
                    onClick: () => this.props.onCancel && this.props.onCancel()
                  }
                }),
                this.createElement('button', {
                  className: 'vwd-btn vwd-btn-primary',
                  text: loading ? this.t('verifying') : this.t('verify'),
                  attributes: {
                    type: 'button',
                    disabled: loading || !key,
                    onClick: () => this.handleSubmit()
                  }
                })
              ]
            })
          ]
        })
      ]
    });

    this.empty(this.container);
    this.container.appendChild(overlay);

    this.elements.input = overlay.querySelector('input');
    this.elements.error = overlay.querySelector('.vwd-error-text');
    this.elements.submitBtn = overlay.querySelector('.vwd-btn-primary');

    this.update();

    const input = this.elements.input;
    if (input) setTimeout(() => input.focus(), 50);
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.update();
  }

  update() {
    const { key, error, loading } = this.state;

    if (this.elements.input) {
      this.elements.input.value = key;
      this.elements.input.disabled = loading;
      if (error) {
        this.elements.input.classList.add('vwd-input-error');
      } else {
        this.elements.input.classList.remove('vwd-input-error');
      }
    }

    if (this.elements.error) {
      if (error) {
        this.elements.error.textContent = error;
        this.elements.error.style.display = '';
      } else {
        this.elements.error.textContent = '';
        this.elements.error.style.display = 'none';
      }
    }

    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = loading || !key;
      this.elements.submitBtn.textContent = loading ? this.t('verifying') : this.t('verify');
    }
  }

  handleSubmit() {
    if (!this.state.key) return;
    if (this.props.onSubmit) {
      this.setState({ loading: true });
      this.props.onSubmit(this.state.key)
        .catch(err => {
          this.setState({ error: err.message || this.t('verifyFailed'), loading: false });
        });
    }
  }

  destroy() {
    this.empty(this.container);
  }
}
