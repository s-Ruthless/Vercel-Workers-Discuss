# Hexo 博客接入 VWD 评论系统

## 前置条件

- 已部署 VWD 评论系统（假设地址为 `https://your-project.vercel.app`）
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
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
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

编辑 `themes/butterfly/_config.yml`（或站点 `_config.butterfly.yml`）：

```yaml
inject:
  bottom:
    - <div id="vwd-comments" style="max-width:800px;margin:2rem auto;"></div>
    - <script src="https://your-project.vercel.app/vwd.js"></script>
    - <script>new VWDComments({el:'#vwd-comments',apiBaseUrl:'https://your-project.vercel.app'}).mount();</script>
```

**方法二：替换内置评论系统**

编辑 `themes/butterfly/layout/comment.pug`，在文件末尾添加：

```pug
//- VWD Comments
#vwd-comments(style="max-width:800px;margin:2rem auto;")
script(src="https://your-project.vercel.app/vwd.js")
script.
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
  }).mount();
```

---

### NexT 主题

**方法一：自定义文件（推荐）**

1. 创建文件 `source/_data/body-end.njk`（如果使用 Nunjucks）或 `source/_data/body-end.swig`：

```html
{% if page.comments %}
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
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
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
  }).mount();
</script>
```

---

### Fluid 主题

编辑 `themes/fluid/layout/post.ejs`，在 `<%- partial('_partial/footer') %>` 之前添加：

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
  }).mount();
</script>
```

---

### Matery 主题

编辑 `themes/matery/layout/post.ejs`，在文章内容结束的 `</div>` 之后添加：

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
  }).mount();
</script>
```

---

### Volantis 主题

编辑 `themes/volantis/layout/_partial/article.njk`，在文章内容后添加：

```html
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
  }).mount();
</script>
```

---

### Hexo 原生主题（landscape）

编辑 `themes/landscape/layout/post.ejs`，在 `<%- partial('comment') %>` 处替换为：

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
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
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
  }).mount();
</script>
`, 'post');
```

> `'post'` 表示仅在文章页面注入。重新 `hexo generate` 即可生效。

---

## 暗黑模式适配

### 自动跟随系统

```html
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app',
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }).mount();
</script>
```

### 监听主题切换

```html
<div id="vwd-comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  const vwd = new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app',
    theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  });
  vwd.mount();

  // 监听主题切换
  const observer = new MutationObserver(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    vwd.updateConfig({ theme: isDark ? 'dark' : 'light' });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
</script>
```
