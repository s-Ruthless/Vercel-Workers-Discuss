/**
 * VWD Comments Widget 入口文件
 *
 * 评论组件：
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
 *
 * 说说组件（同一个类，加 mode 开关）：
 * ```html
 * <div id="vwd-says"></div>
 * <script>
 *   new VWDComments({
 *     el: '#vwd-says',
 *     apiBaseUrl: 'https://api.example.com',
 *     mode: 'says'
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
