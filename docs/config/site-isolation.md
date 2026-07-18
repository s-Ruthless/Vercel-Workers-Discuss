# 站点隔离

VWD 评论系统支持通过 `siteId` 参数实现多站点数据隔离。当你需要为多个不同的网站或博客使用同一套评论系统后端时，可以通过 `siteId` 来区分不同站点的评论数据。

## 功能说明

- **数据隔离**：每个 `siteId` 对应独立的评论数据，不同站点的评论互不干扰
- **统一管理**：所有站点共用同一个后端 API 和管理后台，通过 siteId 进行区分

## 前端配置

在初始化评论组件时，通过 `siteId` 参数指定站点标识：

```html
<div id="comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  const comments = new VWDComments({
    el: '#comments',
    apiBaseUrl: 'https://your-project.vercel.app',
    siteId: 'blog', // 站点 ID，例如：blog, docs, forum
  });
  comments.mount();
</script>
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `siteId` | string | 否 | 站点标识符，用于隔离不同站点的评论数据 |

### siteId 命名建议

- 使用小写字母、数字和连字符，如 `blog`、`docs`、`my-site-1`
- 避免使用特殊字符和空格
- 建议使用有意义的名称，便于识别不同站点

## 多站点示例

如果你有多个站点，可以为每个站点配置不同的 `siteId`：

```html
<!-- 博客站点 -->
<div id="blog-comments"></div>
<script>
  const blogComments = new VWDComments({
    el: '#blog-comments',
    apiBaseUrl: 'https://your-project.vercel.app',
    siteId: 'blog',
  });
  blogComments.mount();
</script>

<!-- 文档站点 -->
<div id="docs-comments"></div>
<script>
  const docsComments = new VWDComments({
    el: '#docs-comments',
    apiBaseUrl: 'https://your-project.vercel.app',
    siteId: 'docs',
  });
  docsComments.mount();
</script>
```

## 后台管理

在管理后台的「站点管理」页面，可以添加和管理多个托管站点，为每个站点设置名称、siteId 等信息。

## 注意事项

[为什么设置完 siteId 后，评论区不显示旧的评论数据？](./../common-problems#_3-多个博客共用一套评论系统)
