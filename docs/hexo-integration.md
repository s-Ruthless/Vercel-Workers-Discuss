# Hexo 博客接入 VWD 评论系统指南

## 前置条件

- 已部署 VWD 评论系统（假设地址为 `https://vercel-workers-discuss.vercel.app`）
- 已在 `/admin/` 后台完成管理员初始化设置

---

## 通用接入方法（适用于所有 Hexo 主题）

### 第 1 步：找到文章模板文件

Hexo 主题的文章模板通常在以下位置（根据你使用的主题选择）：

| 主题 | 文件路径 |
| --- | --- |
| NexT | `themes/next/layout/_macro/post.swig` 或 `themes/next/layout/post.njk` |
| Butterfly | `themes/butterfly/layout/post.pug` |
| Fluid | `themes/fluid/layout/post.ejs` |
| Matery | `themes/matery/layout/post.ejs` |
| Volantis | `themes/volantis/layout/layout.ejs` |
| 自定义 | `themes/<主题名>/layout/post.ejs` |

> 如果你不确定，查看 `themes/<你的主题>/layout/` 目录下与 `post` 相关的文件。

### 第 2 步：在文章末尾插入评论代码

在文章模板文件的 `</article>` 或文章内容结束标签之后，添加以下代码：

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

### 第 3 步：重新生成博客

```bash
hexo clean && hexo generate
```

---

## 按主题分步教程

### Butterfly 主题

**方法一：通过注入器（推荐）**

编辑 ` themes/butterfly/_config.yml`（或站点 `_config.butterfly.yml`）：

```yaml
inject:
  bottom:
    - <div id="vwd-comments" style="max-width:800px;margin:2rem auto;"></div>
    - <script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
    - <script>new VWDComments({el:'#vwd-comments',apiBaseUrl:'https://vercel-workers-discuss.vercel.app'}).mount();</script>
```

**方法二：替换内置评论系统**

编辑 `themes/butterfly/layout/comment.pug`，在文件末尾添加：

```pug
//- VWD Comments
#vwd-comments(style="max-width:800px;margin:2rem auto;")
script(src="https://vercel-workers-discuss.vercel.app/vwd.js")
script.
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
```

---

### NexT 主题

**方法一：自定义文件（推荐）**

1. 创建文件 `source/_data/body-end.njk`（如果使用 Nunjucks）或 `source/_data/body-end.swig`：

```html
{% if page.comments %}
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
{% endif %}
```

2. 在 `_config.next.yml` 中启用：

```yaml
custom_file_path:
  body_end: source/_data/body-end.njk
```

**方法二：直接编辑主题文件**

编辑 `themes/next/layout/_partials/comments.swig`，在文件末尾添加：

```html
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Fluid 主题

编辑 `themes/fluid/layout/post.ejs`，在 `<%- partial('_partial/footer') %>` 之前添加：

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Matery 主题

编辑 `themes/matery/layout/post.ejs`，在文章内容结束的 `</div>` 之后添加：

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Volantis 主题

编辑 `themes/volantis/layout/_partial/article.njk`，在文章内容后添加：

```html
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Hexo 原生主题（landscape）

编辑 `themes/landscape/layout/post.ejs`，在 `<%- partial('comment') %>` 处替换为：

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

## 通过 Hexo 注入器接入（免改主题，推荐）

Hexo 5.0+ 支持 `inject` 注入器，无需修改主题文件：

在博客根目录创建 `scripts/vwd-comments.js`：

```js
'use strict';

hexo.extend.injector.register('body_end', `
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
`, 'post');
```

> `'post'` 表示仅在文章页面注入。重新 `hexo generate` 即可生效。

---

## 配置项详解

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | 是 | — | 挂载元素选择器或 DOM 元素 |
| `apiBaseUrl` | `string` | 是 | — | VWD 评论系统 API 地址 |
| `siteId` | `string` | 否 | `default` | 站点 ID，用于多站点隔离 |
| `postSlug` | `string` | 否 | `window.location.pathname` | 文章唯一标识 |
| `postTitle` | `string` | 否 | `document.title` | 文章标题（用于通知邮件） |
| `postUrl` | `string` | 否 | `window.location.href` | 文章 URL（用于通知邮件） |
| `theme` | `'light' \| 'dark'` | 否 | `light` | 主题 |
| `pageSize` | `number` | 否 | `20` | 每页评论数 |
| `lang` | `'zh-CN' \| 'en-US' \| 'auto'` | 否 | `auto` | 界面语言 |
| `primaryColor` | `string` | 否 | `#2563eb` | 主题色（hex 格式） |
| `customCssUrl` | `string` | 否 | — | 自定义 CSS 文件 URL |

### 使用示例

```html
<div id="vwd-comments"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    siteId: 'my-blog',
    theme: 'dark',
    lang: 'zh-CN',
    pageSize: 10,
    primaryColor: '#0969da'
  }).mount();
</script>
```

---

## PV 浏览量统计

VWD 支持自动统计页面访问量。在页面中任意位置添加 `id="vwd-page-pv"` 的元素，Widget 会自动填充数字：

```html
<div>
  本文已被阅读 <span id="vwd-page-pv">0</span> 次
</div>
```

> Widget 初始化时会自动调用 `/api/analytics/visit` 上报访问，并将 `/api/analytics/pv` 返回的数据填入该元素。

---

## 暗黑模式适配

### 自动跟随系统

```html
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }).mount();
</script>
```

### 监听主题切换（适用于支持暗黑模式切换的 Hexo 主题）

```html
<div id="vwd-comments"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  const vwd = new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  });
  vwd.mount();

  // 监听主题切换（根据你的主题调整选择器和属性名）
  const observer = new MutationObserver(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    vwd.updateConfig({ theme: isDark ? 'dark' : 'light' });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
</script>
```

---

## 常见问题

### 1. 评论框不显示

- 检查浏览器控制台是否有报错
- 确认 `apiBaseUrl` 地址正确，末尾不要加 `/`
- 确认 `vwd.js` 能正常加载（在浏览器地址栏直接访问该 URL）
- 确认 `el` 选择器对应的元素存在于页面中

### 2. 评论提交后不显示

- 登录管理后台 `/admin/`，检查是否开启了「评论审核」（开启后新评论需手动审批）
- 检查评论是否被 `IP/邮箱黑名单` 拦截

### 3. 多个博客共用一套评论系统

为不同博客设置不同的 `siteId`：

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
  siteId: 'tech-blog'  // 技术博客
}).mount();
```

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
  siteId: 'life-blog'  // 生活博客
}).mount();
```

### 4. 指定文章的自定义标识

默认情况下，VWD 使用页面路径（`window.location.pathname`）作为文章标识。如果你的文章 URL 变了（比如换了域名或路径结构），评论会丢失。可以通过显式指定 `postSlug` 来固定标识：

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
  postSlug: 'my-first-post'  // 使用固定标识，不随 URL 变化
}).mount();
```

### 5. 只在特定页面显示评论

如果使用注入器方式，可以通过条件判断控制：

```js
hexo.extend.injector.register('body_end', `
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
`, 'post');  // 'post' 表示仅在文章页注入
```

可选值：`home`（首页）、`post`（文章页）、`page`（自定义页面）、`archive`（归档页）、`category`（分类页）、`tag`（标签页）。

---

## API 速查

如果需要自定义开发，可以直接调用 API：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/comments?post_slug=/your-page` | 获取评论列表 |
| POST | `/api/comments` | 提交评论 |
| POST | `/api/comments/like` | 评论点赞 |
| GET | `/api/like?post_slug=/your-page` | 获取文章点赞状态 |
| POST | `/api/like` | 文章点赞 |
| POST | `/api/analytics/visit` | 上报页面访问 |
| GET | `/api/analytics/pv?post_slug=/your-page` | 获取页面 PV |
| GET | `/api/config/comments` | 获取公开配置 |

> 表情包已改为前端配置（Waline 风格），不再提供 `/api/emotions` 接口。

完整 API 文档见项目根目录 `README.md`。
