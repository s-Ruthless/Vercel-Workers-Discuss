# Widget 配置项

VWD 内置 Widget，部署后自动构建到 `public/vwd.js`，可通过你的域名直接引用。

## 基本用法

### 评论组件

```html
<div id="vwd-comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    apiBaseUrl: 'https://your-project.vercel.app',
    el: '#vwd-comments'
  }).mount();
</script>
```

### 说说组件

设置 `mode: 'says'` 可在独立页面展示说说列表：

```html
<div id="vwd-says"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    apiBaseUrl: 'https://your-project.vercel.app',
    el: '#vwd-says',
    mode: 'says'
  }).mount();
</script>
```

## 配置项总览

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | 是 | — | 挂载元素选择器或 DOM 元素 |
| `apiBaseUrl` | `string` | 是 | — | API 基础地址 |
| `mode` | `'says'` | 否 | — | 设为 `'says'` 开启说说渲染功能 |
| `siteId` | `string` | 否 | `blog` | 站点 ID，用于多站点隔离 |
| `postSlug` | `string` | 否 | `window.location.pathname` | 文章唯一标识 |
| `postTitle` | `string` | 否 | `document.title` | 文章标题（用于通知邮件） |
| `postUrl` | `string` | 否 | `window.location.origin + window.location.pathname` | 文章 URL（用于通知邮件） |
| `theme` | `'light' \| 'dark'` | 否 | `light` | 主题 |
| `pageSize` | `number` | 否 | `20` | 每页评论数 |
| `lang` | `'zh-CN'` | 否 | `zh-CN` | 界面语言 |
| `primaryColor` | `string` | 否 | `#0969da` | 主题色（hex 格式） |
| `customCssUrl` | `string` | 否 | — | 自定义 CSS 文件 URL |

## 完整示例

```html
<div id="vwd-comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app',
    siteId: 'my-blog',
    theme: 'dark',
    lang: 'zh-CN',
    pageSize: 10,
    primaryColor: '#0969da'
  }).mount();
</script>
```

## 多站点隔离

为不同博客设置不同的 `siteId`：

```js
// 技术博客
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://your-project.vercel.app',
  siteId: 'tech-blog'
}).mount();
```

```js
// 生活博客
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://your-project.vercel.app',
  siteId: 'life-blog'
}).mount();
```

## 固定文章标识

默认情况下，VWD 使用页面路径作为文章标识。如果文章 URL 变了，评论会丢失。可以通过显式指定 `postSlug` 来固定标识：

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://your-project.vercel.app',
  postSlug: 'my-first-post'  // 使用固定标识，不随 URL 变化
}).mount();
```

## 本地开发 Widget

```bash
cd widget
npm install
npm run dev   # 启动开发服务器（http://localhost:5173）
npm run build # 构建到 dist/ 并自动复制到 ../public/vwd.js
```
