/**
 * VWD Comments Widget 入口文件
 *
 * 使用方法：
 * ```html
 * <div id="comments"></div>
 * <script src="vwd.js"></script>
 * <script>
 *   new VWDComments({
 *     el: '#comments',
 *     apiBaseUrl: 'https://api.example.com'
 *   }).mount();
 * </script>
 * ```
 */

import { VWDComments } from './core/VWDComments.js';

// 导出为全局变量（用于 UMD 构建）
if (typeof window !== 'undefined') {
  window.VWDComments = VWDComments;
}

// ES Module 默认导出
export default VWDComments;
export { VWDComments };
