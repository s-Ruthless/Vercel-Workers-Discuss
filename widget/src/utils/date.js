/**
 * 日期时间格式化工具
 */

/**
 * 将各种格式的日期值转换为 Date 对象
 * 处理 BIGINT 从 PostgreSQL 返回为字符串的情况
 * @param {string|number} dateValue - 日期字符串或时间戳
 * @returns {Date}
 */
function toDate(dateValue) {
  if (typeof dateValue === 'string') {
    const parsed = parseInt(dateValue, 10);
    if (Number.isFinite(parsed)) return new Date(parsed);
  }
  return new Date(dateValue);
}

/**
 * 格式化时间（3天内显示相对时间，超过3天显示完整日期）
 * @param {string|number} dateValue - 日期字符串或时间戳
 * @param {Function} t - 翻译函数
 * @returns {string}
 */
export function formatRelativeTime(dateValue, t = (k, p) => k) {
  const date = toDate(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days < 3) {
    if (days > 0) {
      return days === 1 ? t('time.yesterday') : t('time.daysAgo', { count: days });
    }
    if (hours > 0) {
      return t('time.hoursAgo', { count: hours });
    }
    if (minutes > 0) {
      return t('time.minutesAgo', { count: minutes });
    }
    return t('time.justNow');
  }

  return formatDateTime(dateValue);
}

/**
 * 格式化日期时间
 * @param {string|number} dateValue - 日期字符串或时间戳
 * @returns {string}
 */
export function formatDateTime(dateValue) {
  const date = toDate(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期
 * @param {string|number} dateValue - 日期字符串或时间戳
 * @returns {string}
 */
export function formatDate(dateValue) {
  const date = toDate(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * 格式化时间
 * @param {string|number} dateValue - 日期字符串或时间戳
 * @returns {string}
 */
export function formatTime(dateValue) {
  const date = toDate(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
