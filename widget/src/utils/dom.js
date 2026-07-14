/**
 * DOM 操作工具函数
 */

export function createElement(tag, className = '', attributes = {}, content = null) {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith('on')) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        el.dataset[dataKey] = dataValue;
      });
    } else {
      el.setAttribute(key, value);
    }
  });

  if (content !== null) {
    appendContent(el, content);
  }

  return el;
}

export function appendContent(el, content) {
  if (typeof content === 'string') {
    el.textContent = content;
  } else if (Array.isArray(content)) {
    content.forEach(child => {
      if (child instanceof HTMLElement) {
        el.appendChild(child);
      }
    });
  } else if (content instanceof HTMLElement) {
    el.appendChild(content);
  }
}

export function empty(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function show(el) {
  el.style.display = '';
}

export function hide(el) {
  el.style.display = 'none';
}

export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
