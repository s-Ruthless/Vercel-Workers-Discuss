# 说说功能

VWD 支持说说（动态/短博文）功能。博主可以在后台 `/admin/says` 发布说说，然后创建独立页面展示说说列表。

## 在独立页面展示说说

```html
<div id="vwd-says" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-says',
    apiBaseUrl: 'https://your-project.vercel.app',
    mode: 'says'
  }).mount();
</script>
```

## 通过 Hexo 注入器接入

在博客根目录创建 `scripts/vwd-says.js`：

```js
'use strict';

hexo.extend.injector.register('body_end', `
<div id="vwd-says" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-says',
    apiBaseUrl: 'https://your-project.vercel.app',
    mode: 'says'
  }).mount();
</script>
`, 'page');  // 在 page 类型页面注入
```

## 说说配置项

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | 是 | — | 挂载元素选择器或 DOM 元素 |
| `apiBaseUrl` | `string` | 是 | — | VWD 评论系统 API 地址 |
| `mode` | `'says'` | 是 | — | 设为 `'says'` 开启说说渲染功能 |
| `siteId` | `string` | 否 | `blog` | 站点 ID |
| `pageSize` | `number` | 否 | `10` | 每页显示说说数（也可从后台设置） |
| `theme` | `'light' \| 'dark'` | 否 | `light` | 主题 |
| `primaryColor` | `string` | 否 | `#0969da` | 主题色 |

> 说说的开关、点赞、每页数量等也可在后台 `/admin/settings` 中配置，前端会自动读取服务器配置。

## 后台管理

- **发布说说**：在 `/admin/says` 页面发布新的说说
- **说说设置**：在 `/admin/settings` 中配置说说开关、点赞、每页数量等
- **点赞开关**：说说点赞可在后台功能开关中开启/关闭，默认开启
