# 说说功能

VWD 支持说说（动态/短博文）功能。博主可以在后台 `/admin/says` 发布说说，然后创建独立页面展示说说列表。

## 发布说说

在管理后台的「说说管理」页面可以：

- **发布说说**：支持 Markdown 内容、表情、标签
- **编辑说说**：修改已有说说的内容
- **删除说说**：删除不需要的说说
- **说说状态**：控制说说的显示/隐藏

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
`, 'page');
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

## 后台设置

在后台「设置」→「说说设置」中可配置：

- **说说开关**：开启/关闭说说功能
- **说说点赞**：开启/关闭说说点赞（也可在功能开关中配置）
- **每页数量**：说说列表每页显示条数
- **说说审核**：开启后新说说需审核后显示
